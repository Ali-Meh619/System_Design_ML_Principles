# 📈 Scale & Reliability

> Your system works great at 1,000 users. Now design it for 100 million. This category covers everything that breaks when you scale, and how to build systems that self-heal and self-scale.

---

## Topics in This Category

| # | Topic | Difficulty | What You'll Learn |
|---|-------|-----------|------------------|
| 1 | [Observability & Monitoring](observability.md) | 🟡 Mid | Metrics/logs/traces, SLOs, error budgets |
| 2 | [High Availability & Auto Scaling](high-availability-scaling.md) | 🟡 Mid | Active-active, auto-scaling, multi-region |
| 3 | [Unique ID Generation](id-generation.md) | 🟡 Mid | UUID, ULID, Snowflake, ticket server |
| 4 | [API Pagination](pagination.md) | 🟡 Mid | Offset trap, cursor-based, keyset pagination |
| 5 | [Advanced Data Patterns](advanced-data-patterns.md) | 🔴 Advanced | Hot partitions, CQRS, ETL vs ELT, backfill |
| 6 | [Notification System Design](notification-system.md) | 🟡 Mid | Multi-channel delivery, fan-out, idempotency |

---

## Scaling Philosophy

**Scale out, not up.** Vertical scaling (bigger machine) has a ceiling. Horizontal scaling (more machines) is theoretically unlimited. But horizontal scaling introduces distributed system complexity.

```
Single machine (vertical):
  CPU: 2 → 64 cores
  RAM: 4GB → 512GB
  Limit: ~$100K/machine, diminishing returns

Multiple machines (horizontal):
  10 × $1K machines = same cost, more complexity
  But: 100× more capacity ceiling
```

**Scaling layers (in order):**
1. Add **caching** (cheapest, highest impact)
2. Add **read replicas** (scale reads)
3. Add **CDN** (scale static content globally)
4. **Shard the database** (scale writes)
5. **Async processing** (queues, workers)
6. **Multi-region** (scale globally)

---

## Availability Numbers

| Availability | Downtime/year | Downtime/month |
|--------------|--------------|----------------|
| 99% | 87.6 hours | 7.3 hours |
| 99.9% | 8.76 hours | 43.8 minutes |
| 99.99% | 52 minutes | 4.4 minutes |
| 99.999% ("five nines") | 5.3 minutes | 26 seconds |

**How to achieve 99.99%:**
- No single points of failure
- Active-active or active-passive failover
- Health checks with automatic failover
- Circuit breakers preventing cascade failures
- Multi-AZ deployment (minimum 3 availability zones)

---

## SLO / SLA / Error Budget

| Term | Definition | Example |
|------|-----------|---------|
| **SLI** (Service Level Indicator) | The metric you measure | Request success rate |
| **SLO** (Service Level Objective) | Target for the SLI | 99.9% success rate |
| **SLA** (Service Level Agreement) | Contract with customer | 99.9% uptime or refund |
| **Error Budget** | Allowed failures per SLO period | 0.1% of requests can fail |

**Error budget math:**
```
Monthly error budget at 99.9% SLO:
  = 0.1% × (30 days × 24 hours × 60 min × ~1000 req/min)
  = 0.001 × 43,200,000 requests
  = 43,200 requests can fail/month
```

---

## ID Generation Quick Reference

| Method | Sortable? | Unique across nodes? | Requires coordination? |
|--------|----------|---------------------|----------------------|
| **UUID v4** | No | Yes | No |
| **UUID v7 / ULID** | Yes (time-ordered) | Yes | No |
| **Twitter Snowflake** | Yes | Yes | Needs node ID assignment |
| **Database auto-increment** | Yes | No (sharded) | Yes (single DB) |

**For interviews:** Default answer is **Twitter Snowflake** (64-bit integer, time-sortable, ~4K IDs/ms/node).

---

## Pagination Quick Reference

| Method | Performance at page 1000 | Stable under inserts? | Complexity |
|--------|-------------------------|----------------------|-----------|
| **Offset (`LIMIT 10 OFFSET 10000`)** | ❌ O(n) — full table scan | ❌ No (items shift) | Low |
| **Cursor (encode last item ID)** | ✅ O(log n) | ✅ Yes | Medium |
| **Keyset (`WHERE id > last_id`)** | ✅ O(log n) — uses index | ✅ Yes | Low |

**Always use keyset pagination for production APIs.** Offset pagination kills performance at depth.

---

## Notification System Quick Reference

**For 300M notifications/day (average = 3,500/sec, peak = 35,000/sec):**

```
[Trigger Event] → [Kafka] → [Channel Workers] → [Provider APIs]
                               Push: APNs/FCM
                               Email: SendGrid/SES
                               SMS: Twilio
                  ↕
        [User Preference Service]
        [Delivery Receipt Store]
```

Key: **Idempotency keys** prevent duplicate sends on retry. **Dead Letter Queue** captures failures for inspection.

---

## Practice Questions

1. Your API has a 99.9% SLO. Your team wants to add a risky deployment on Friday. How much error budget do you have left this month (assume it's the 20th of the month and you've used 30% of the monthly budget)?

2. Your system auto-scales EC2 instances. At what CPU % should you trigger scale-out? Why not 95%? Why not 50%?

3. A social app stores 50M posts. Users want to see their own feed in reverse chronological order. They paginate with "Load more" (infinite scroll). What pagination method do you use?

4. Design unique IDs for a URL shortener that will generate 100M URLs over 10 years. The IDs should be sortable by creation time. What approach?
