# 🗄️ Data Storage

> The most consequential architectural decisions. The wrong database is extremely hard to undo. The right caching strategy can 10× your throughput. This category covers everything from storage selection to internals.

---

## Why This Category Is Critical

In every system design interview, the database and caching choices are where you either win or lose. "Just use MySQL" or "just add Redis" without justification loses points. After this category, you'll be able to:

- Choose the exact right database type for any use case in 30 seconds
- Explain **why** a cache helps and **how** to keep it consistent
- Design message queue architectures that handle failures gracefully
- Understand B-trees vs LSM-trees and why it matters for write-heavy systems

---

## Topics in This Category

| # | Topic | Difficulty | What You'll Learn |
|---|-------|-----------|------------------|
| 1 | [Database Selection Guide](databases.md) | 🟢 Beginner | SQL vs NoSQL, all 7 database types compared |
| 2 | [Caching Deep Dive](caching.md) | 🟡 Mid | 5 cache layers, read/write patterns, invalidation |
| 3 | [Message Queues & Event Streaming](message-queues.md) | 🟡 Mid | Kafka internals, delivery guarantees, DLQ |
| 4 | [Storage & CDN](storage-and-cdn.md) | 🟢 Beginner | Object/block/file storage, CDN pull vs push |
| 5 | [Database Internals](database-internals.md) | 🔴 Advanced | B-tree vs LSM, indexes, replication, ACID, sharding |

---

## Database Decision Tree

```
What is your primary access pattern?
│
├─ Need complex queries, JOINs, strong consistency?
│    → PostgreSQL or MySQL (Relational)
│
├─ Need massive write throughput, time-series data?
│    → Cassandra (Wide-Column) or InfluxDB (Time-Series)
│
├─ Need ultra-fast key lookups, sessions, cache?
│    → Redis (Key-Value, in-memory)
│
├─ Need flexible schema, nested documents?
│    → MongoDB (Document)
│
├─ Need full-text search, faceted filtering?
│    → Elasticsearch (Search)
│
├─ Need analytics, aggregations, OLAP?
│    → BigQuery, Snowflake, ClickHouse (Columnar)
│
└─ Need unlimited scale, global distribution?
     → DynamoDB (Managed Key-Value/Document)
```

---

## The 7 Database Types at a Glance

| Type | Best Example | When to Choose |
|------|-------------|---------------|
| **Relational (SQL)** | PostgreSQL | Complex queries, financial data, user accounts |
| **Key-Value** | Redis, DynamoDB | Sessions, caching, leaderboards |
| **Wide-Column** | Cassandra | Time-series, high write throughput, IoT |
| **Document** | MongoDB | Flexible schemas, nested data |
| **Search** | Elasticsearch | Full-text search, autocomplete |
| **Time-Series** | InfluxDB, TimescaleDB | Metrics, monitoring, IoT sensor data |
| **OLAP/Columnar** | BigQuery, ClickHouse | Analytics, aggregations, reporting |

---

## Caching Strategy Quick Reference

| Pattern | How it works | When to use |
|---------|-------------|------------|
| **Cache-aside** | App checks cache, falls back to DB, populates cache | General purpose |
| **Read-through** | Cache fetches from DB automatically on miss | Transparent to app |
| **Write-through** | Write to cache AND DB synchronously | Consistency critical |
| **Write-behind** | Write to cache, async flush to DB | High write throughput |

**Eviction policies:**
- **LRU** (Least Recently Used): best for general caching
- **LFU** (Least Frequently Used): best for repeated hot keys
- **TTL** (Time to Live): always set — prevents stale data forever

---

## Message Queue Delivery Guarantees

| Guarantee | What it means | Use when |
|-----------|-------------|---------|
| **At-most-once** | Message may be lost, never duplicated | Metrics, logs (loss is OK) |
| **At-least-once** | Message delivered ≥1 times, may duplicate | Most applications — make handler idempotent |
| **Exactly-once** | Delivered exactly once (hardest) | Financial transactions |

> ⚠️ **Rule of thumb:** Design for at-least-once delivery and make your consumers **idempotent**. Exactly-once is expensive and often unnecessary.

---

## Storage Sizing Reference

| Data Type | Size per Record |
|-----------|----------------|
| UUID | 16 bytes |
| Short string (username) | 32–100 bytes |
| User profile | ~1 KB |
| Tweet / short post | ~280 bytes |
| Blog post | ~10–100 KB |
| Profile image | ~100 KB |
| HD photo | ~3–5 MB |
| 1-min HD video | ~150 MB |

---

## Practice Questions

1. Your system needs to store 50M user sessions (each ~500 bytes). Users are active 8 hours/day on average. Sessions expire after 24h of inactivity. What database do you choose and why?

2. You have a write rate of 50,000 messages/second from IoT sensors. Each message is 256 bytes and you need to query "all readings from sensor X in the last hour." What database fits best?

3. An e-commerce site's product catalog (10M products) needs both full-text search ("red sneakers size 10") and relational queries ("all products in category X with price < $50"). How would you handle this?

4. Your cache hit rate is 80%. Should you be satisfied? What would you check to improve it?
