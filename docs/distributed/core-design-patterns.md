# Core Design Patterns

> Recurring solutions to recurring problems. Recognize the pattern, apply the template. These appear in nearly every system design interview.

---

## Fan-Out: Write vs Read (Twitter / Instagram Feed)

When a user posts a tweet, their 1M followers need to see it in their feed. Two competing approaches:

**Fan-Out Strategy Comparison**

| Strategy | How it works | Write cost | Read cost | Best for |
|----------|-------------|-----------|---------|---------|
| **Fan-out on write (push)** | When user posts, immediately write to every follower's feed inbox in Redis. | High — write to 1M feeds per celebrity post | Low — just read from own inbox | Users with normal follower counts. Twitter uses this for users with <10K followers. |
| **Fan-out on read (pull)** | Store post in author's timeline only. On feed load, query all followed users' timelines, merge, sort. | Low — just store once | High — merge N timelines per request | No one uses pure pull at scale — too slow at read time. |
| **Hybrid (Twitter's actual approach)** | Fan-out on write for regular users. Fan-out on read for celebrities (>10K followers) — inject celebrity posts at read time. Most users benefit from pre-built feeds; celebrity writes don't flood 500M inboxes. | Moderate | Moderate | Any social feed at scale. This is the answer for Twitter/Instagram in interviews. |

---

## CQRS — Command Query Responsibility Segregation

**CQRS** separates the write model (commands that change state) from the read model (queries that return data). Instead of using the same data model for both, you maintain two separate models optimized for each purpose. Write model prioritizes correctness and consistency (normalized SQL). Read model prioritizes query speed (denormalized, pre-joined views in Redis or Elasticsearch).

Changes to the write model are propagated to the read model asynchronously via events (change data capture, Kafka). This creates eventual consistency between the two models — the read model may be slightly behind. This trade-off is acceptable for most read use cases.

```
Write side (commands):
User clicks "Like" → POST /likes → 
Write to likes table (user_id, post_id, timestamp)

CQRS Sync (CDC/Kafka):
likes table change → Kafka event → CQRS projection builder

Read side (queries):
GET /posts/123 → 
Read from pre-built Redis hash: {likes_count: 50241, liked_by_me: false}
→ No JOIN, no aggregate COUNT(*) on hot table
```

---

## Event Sourcing

**Event sourcing** stores every state change as an immutable event, rather than storing only the current state. The event log is the source of truth. Current state = replay of all events. Benefits:

- Complete audit trail (who did what, when, exactly)
- Ability to replay events to fix bugs or derive new views
- Temporal queries ("what was the account balance on Tuesday?")
- Used by banks, trading systems, and any domain requiring full audit history

```
Traditional (current state):
user_balance: 500

Event Sourced (event log):
[
  { type: "deposit",    amount: 1000, ts: "2024-01-01" },  → balance: 1000
  { type: "withdrawal", amount: 200,  ts: "2024-01-02" },  → balance: 800
  { type: "withdrawal", amount: 300,  ts: "2024-01-03" },  → balance: 500
]

Current state = replay of all events
"What was balance on Jan 2?" = replay up to Jan 2 → 800
```

---

## The Outbox Pattern (Reliable Event Publishing)

You want to both update a database AND publish an event to Kafka atomically. Problem: you can't span a database transaction and a Kafka write in the same atomic unit — if Kafka publish fails, your DB update already committed. The **outbox pattern**: write the event to an "outbox" table in the same database transaction as your state change. A separate process reads from the outbox table and publishes to Kafka. The DB transaction is your atomicity boundary. The outbox publisher retries until it succeeds (Kafka publish is idempotent). This guarantees at-least-once event publication with no race conditions.

```
Transaction (atomic):
  UPDATE orders SET status='confirmed' WHERE id=123
  INSERT INTO outbox (event_type, payload) VALUES ('order.confirmed', '{...}')
  COMMIT

Separate outbox processor:
  SELECT * FROM outbox WHERE published = false
  → Publish to Kafka "orders.confirmed" topic
  → UPDATE outbox SET published = true
  
No race conditions — the order update and the event are always in sync.
```

---

## Ticket/Booking: Handling Inventory Contention

TicketMaster-style problems: thousands of users simultaneously trying to buy the last 10 concert tickets. Without coordination, you'd oversell. Two approaches:

**Inventory Reservation Strategies**

| Approach | How it works | Trade-off |
|----------|-------------|-----------|
| **Pessimistic locking** | `SELECT ... FOR UPDATE` — database locks the ticket row during checkout. Other users wait. | Correct but slow under high concurrency. Lock held for entire checkout flow (seconds). |
| **Optimistic locking** | Read ticket with version number. Attempt update with `WHERE version = X`. If another user updated first, version mismatch — retry. | No locks, higher throughput. Retry logic needed. Works when conflicts are rare. |
| **Queue + reservation system** | Put buyers in a queue. First N in queue get a 10-minute reservation (atomic Redis DECR). After 10 minutes without payment, reservation released. | Best UX. Prevents oversell. Virtual queue during peak demand (TicketMaster's actual approach for hot events). |

---

## Sidecar Pattern (Service Mesh)

The **sidecar pattern** deploys a helper container alongside every service instance. The sidecar handles cross-cutting concerns: TLS, service discovery, load balancing, circuit breaking, observability — so service code doesn't need to.

```
Pod (Kubernetes):
  ┌─────────────────────────────┐
  │  [Your Service Container]   │
  │  [Envoy Sidecar Container]  │ ← handles: mTLS, retries, 
  └─────────────────────────────┘    circuit breaking, tracing
```

Used by Istio (Envoy sidecar), Linkerd, AWS App Mesh. This is how microservices achieve network reliability without library dependencies.

---

## Strangler Fig Pattern (Monolith Migration)

Safely migrate from a monolith to microservices without a big-bang rewrite:

1. Route ALL traffic through a new API Gateway (strangler proxy)
2. Gradually extract features into new microservices
3. API Gateway routes requests to the new service once it's ready
4. Over time, the monolith shrinks until it's fully replaced
5. No big cutover — continuous migration, easy rollback

```
Before:
Client → Monolith (handles everything)

After partial migration:
Client → API Gateway → User Service (new microservice)
                     → Order Service (new microservice)  
                     → Legacy Monolith (remaining features)

Eventually:
Client → API Gateway → [all microservices, monolith gone]
```

---

## Bulkhead Pattern (Resource Isolation)

Named after ship compartments: if one compartment floods, the ship stays afloat. In services: isolate resources (thread pools, connection pools) per dependency. If Service X becomes slow and consumes all 100 threads in its pool, Service Y (using a separate pool) is unaffected.

| Without Bulkhead | With Bulkhead |
|-----------------|---------------|
| Payment API slow → consumes all 100 threads → User API also slow/dead | Payment API slow → consumes its 20-thread pool → User API (50-thread pool) unaffected |

---

## Interview Talking Points

- "For Twitter's feed: fan-out on write for regular users (write tweet_id to all followers' Redis lists), fan-out on read for celebrities over 10K followers. The threshold of 10K is the key trade-off to defend."
- "CQRS for the user profile page: writes go to PostgreSQL (normalized, consistent), reads come from Redis (pre-built, denormalized). The read model is eventually consistent but serves in <1ms."
- "The outbox pattern guarantees we publish to Kafka exactly when we commit the database transaction — no lost events, no duplicate events from race conditions."
- "For TicketMaster's concert sale: virtual queue + Redis DECR for atomic seat reservation. The seat status transitions: AVAILABLE → RESERVED (10-min hold) → SOLD on payment, or back to AVAILABLE on expiry."
