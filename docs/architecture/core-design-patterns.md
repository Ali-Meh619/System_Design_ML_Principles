# Core Design Patterns

Recurring solutions to recurring problems. Recognize the pattern, apply the template. These appear in nearly every system design interview.

---

## Fan-Out: Write vs Read (Social Feed)

When a user with 1 million followers posts a tweet, those followers need to see it in their feed. Two competing approaches:

| Strategy | How it works | Write cost | Read cost | Best for |
|----------|-------------|------------|-----------|----------|
| **Fan-out on write (push)** | On post, immediately write to every follower's feed inbox in Redis. | High — write to 1M feeds per celebrity post | Low — just read from own inbox | Users with normal follower counts |
| **Fan-out on read (pull)** | Store post in author's timeline only. On feed load, query all followed users' timelines, merge, sort. | Low — store once | High — merge N timelines per request | Rarely used pure — too slow at read time |
| **Hybrid (Twitter's actual approach)** | Fan-out on write for regular users. Fan-out on read for celebrities (>10K followers) — inject at read time. | Moderate | Moderate | Any social feed at scale |

**Interview answer:** Always propose the hybrid approach for social feeds. "For users with fewer than 10K followers, fan-out on write gives O(1) feed reads. For verified accounts and celebrities, we inject their posts at read time to avoid flooding 500M Redis inboxes on every tweet."

---

## CQRS — Command Query Responsibility Segregation

**CQRS** separates the **write model** (commands that change state) from the **read model** (queries that return data).

- **Write model:** Normalized SQL database. Prioritizes correctness, consistency, and integrity.
- **Read model:** Denormalized, pre-joined views in Redis, Elasticsearch, or DynamoDB. Optimized for specific query patterns.

Changes propagate from write → read asynchronously via CDC or Kafka. The read model may be seconds behind — this eventual consistency is acceptable for most read use cases.

**When to use CQRS:**
- Your read and write workloads have very different characteristics.
- You need multiple different "views" of the same data (the same order needs to appear in customer history, analytics dashboards, and fraud detection — each needs different projections).
- You want to scale reads and writes independently.

**Example:** An e-commerce order service:
- Writes go to PostgreSQL (normalized, transactional).
- A Kafka consumer updates Elasticsearch for search, Redis for the order status endpoint, and a DynamoDB table for the customer's order history.

---

## Event Sourcing

**Event sourcing** stores every state change as an immutable event, rather than storing only the current state.

```
Traditional: Store current state → UPDATE orders SET status='shipped' WHERE id=123
Event Sourced: Append event  → INSERT INTO events (order_id, type, data) 
                                VALUES (123, 'OrderShipped', {...})

Current state = Replay of all events
```

**Benefits:**
- **Complete audit trail:** Every state change is recorded with who did it and when.
- **Temporal queries:** "What was the account balance on March 3rd?" — just replay events up to that date.
- **Debug production bugs:** Replay a user's exact sequence of events to reproduce any issue.
- **Derive new views:** Add a new read model by replaying historical events from the beginning.

**Trade-offs:**
- Event log grows forever (mitigate with snapshots: periodically save current state, only replay events since last snapshot).
- Query complexity: You must project events into read models to answer queries efficiently.

**Used by:** Banking systems, trading platforms, audit-heavy applications, systems where "undo" is a requirement.

---

## The Outbox Pattern (Reliable Event Publishing)

**Problem:** You want to both update a database AND publish an event to Kafka atomically.

If you do the database write first and Kafka publish second — and Kafka fails — you have committed a state change with no corresponding event. Downstream services miss the event.

**The Outbox Pattern:**
1. In the same database transaction as your state change, write the event to an `outbox` table.
2. A separate **outbox publisher** reads from the outbox table and publishes to Kafka.
3. Mark events as published after Kafka confirms receipt.
4. If the publisher crashes, it restarts and retries unpublished events.

```sql
-- In a single ACID transaction:
UPDATE orders SET status = 'confirmed' WHERE id = 123;
INSERT INTO outbox (aggregate_id, event_type, payload) 
  VALUES (123, 'OrderConfirmed', '{"orderId": 123, ...}');
-- COMMIT
```

**Why this works:** The database transaction is your atomicity boundary. Either both writes succeed (order updated + event stored) or both fail. The outbox publisher uses **at-least-once** delivery to Kafka — the event schema should be idempotent.

---

## Ticket/Booking: Handling Inventory Contention

Thousands of users simultaneously trying to buy the last 10 concert tickets. Without coordination, you oversell.

| Approach | How it works | Trade-off |
|----------|-------------|-----------|
| **Pessimistic locking** | `SELECT ... FOR UPDATE` — locks the row during checkout. Other users wait. | Correct but slow under high concurrency. Lock held for entire checkout flow (seconds). |
| **Optimistic locking** | Read ticket with version number. `UPDATE ... WHERE version = X`. On mismatch, retry. | No locks, high throughput. Requires retry logic. Works when conflicts are rare. |
| **Queue + reservation** | Put buyers in a queue. First N get a 10-minute reservation (atomic Redis `DECR`). Unpaid reservations released. | Best UX. Prevents oversell. Virtual queue during peak demand (TicketMaster's approach). |

**Recommended pattern for hot events:**
```
User clicks "Buy" →
  Redis DECR tickets_available
  If result >= 0: reservation created (10-min TTL)
  If result < 0: Redis INCR (rollback), show "sold out"
  
After payment:
  Mark reservation as paid in DB
  
On timeout (no payment):
  Redis INCR tickets_available (release)
```

---

## Interview Answer Sketch

> "For the social feed, I'd use a hybrid fan-out: push to Redis inboxes for normal users, inject celebrity posts at read time. For event publishing reliability, I'll use the outbox pattern so database updates and Kafka events are always in sync. For the ticket inventory problem, I'll use an optimistic reservation system backed by a Redis counter — atomic `DECR` for fast reservation, with a TTL-based release if payment doesn't complete."
