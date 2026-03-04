# Advanced Data Patterns

> Materialized views, pre-computation, data pipelines (ETL vs ELT), batch processing, and hot key mitigation — patterns that appear in Twitter feed, analytics dashboards, and recommendation systems.

---

## Pre-computation and Materialized Views

Some queries are too expensive to compute in real time. A user's Twitter feed requires fetching posts from hundreds of followed accounts, merging, and ranking — 100ms+ per request. The solution: **pre-compute** the expensive result ahead of time and store it. When the user requests their feed, just fetch the pre-computed result.

In databases, **materialized views** are pre-computed query results stored on disk. Unlike regular views (which run the query each time), a materialized view is refreshed on a schedule (every hour) or triggered by underlying data changes (incremental refresh). PostgreSQL supports materialized views natively with `CREATE MATERIALIZED VIEW ... AS SELECT ...`

**Pre-computation Patterns**

| Pattern | How it works | Example |
|---------|-------------|---------|
| **Pre-computed feeds** | When user A posts, immediately write post_id to all followers' feed cache in Redis. Read is just a list lookup. | Twitter home timeline — O(1) read, O(followers) write |
| **Materialized aggregations** | Maintain a running count/sum in a separate table rather than computing COUNT(*) or SUM() on every read. | Tweet like counts, product review ratings (don't run COUNT each time — maintain a likes_count column) |
| **Batch pre-computation** | Nightly Spark job computes expensive results (friend-of-friend recommendations, spending analytics) and stores output in fast storage. | Netflix "because you watched X" recommendations, LinkedIn "people you may know" |
| **Read-model projections** | CQRS read model: maintain a denormalized table specifically for a high-frequency read query. Rebuild from events when needed. | User's order history page — pre-joined table with user, order, and item data |

> ⚠️ **The pre-computation freshness trade-off:** Pre-computed data is always slightly stale. A nightly batch job means recommendations are 24 hours old. Accept this for non-critical metrics (recommendation score) but not for critical ones (inventory count, bank balance). The question to ask: "What's the cost of showing data that's X minutes stale?" For most social features, a few seconds is acceptable.

---

## ETL vs ELT — Data Pipeline Design

**ETL** (Extract, Transform, Load) and **ELT** (Extract, Load, Transform) are the two approaches to building data pipelines — moving data from operational systems to analytics systems.

**ETL vs ELT**

| Aspect | ETL | ELT |
|--------|-----|-----|
| Order | Extract → Transform (in pipeline) → Load to warehouse | Extract → Load raw → Transform inside warehouse using SQL |
| Transform location | Separate transform server (Spark, custom Python) | Inside the data warehouse (Snowflake, BigQuery SQL) |
| Raw data preservation | Only transformed data stored in warehouse | Raw data always available — re-transform anytime (schema changes, bug fixes) |
| Modern choice | Legacy. Required when warehouses lacked compute power. | Modern standard. Cloud warehouses are powerful and cheap. Tools: dbt, Fivetran. |

The modern data stack: **Fivetran/Airbyte** (Extract + Load raw data automatically) → **Snowflake/BigQuery** (raw data warehouse) → **dbt** (Transform raw → analytics-ready tables using SQL) → **Looker/Metabase** (visualization). This ELT approach has largely replaced traditional ETL because it's faster to implement, more maintainable, and preserves raw data.

---

## Hot Key / Hot Spot Problem

A **hot key** (or hot partition) is when a disproportionate amount of traffic hits one specific database partition, cache key, or server — overloading it while others sit idle. Classic examples: a tweet from a celebrity with 100M followers (all fans load it simultaneously), a viral product listing, or a sports event being queried by everyone at kickoff.

**Hot Key Mitigation Strategies**

| Strategy | How it works | Best for |
|----------|-------------|---------|
| **Local cache (request coalescing)** | Cache the hot item in application server memory (not just Redis). Multiple in-flight requests for the same key are collapsed into one Redis call. | Extreme celebrity traffic — each app server only hits Redis once per cache TTL period regardless of local QPS. |
| **Key splitting** | Instead of one Redis key `"tweet:123:likes"`, use N keys `"tweet:123:likes:0"` through `"tweet:123:likes:9"`. Randomly increment one. Read = sum all 10. | High-write counters (like counts, view counts). Distributes write load across N Redis instances. |
| **Jitter on TTL** | Instead of all instances caching with TTL = 60 seconds, add random jitter (55–65 seconds). Prevents all instances from expiring simultaneously. | Cache stampede prevention when many servers cache the same key. |
| **Read replica routing** | Route reads for hot keys to dedicated read replicas, not the primary. | Read-heavy hot data in relational databases. |

---

## Backfill & Reprocessing

**Backfill** means reprocessing historical data — either to fix a bug in previous processing, to populate a new data store with existing data, or to apply a new transformation retroactively. This is a common but often overlooked operational concern in data system design.

Kafka's ability to retain events for 30+ days makes it the ideal backfill mechanism: reset a consumer group's offset to the beginning and replay all events through your corrected processing logic. Without Kafka's log retention, backfill requires querying the source database (slower) or restoring from backup (complex). This is a key architectural argument for choosing Kafka over a traditional message queue: **replayability** is built-in.

```
Bug in recommendation algorithm (event: Feb 1–15):
1. Fix the algorithm
2. Create new consumer group "recommendations-v2"
3. Set offset to Feb 1 start
4. Consumer replays 15 days of user events
5. Rebuilds recommendation store with corrected logic
6. Switch traffic from recommendations-v1 to recommendations-v2
7. No data loss, no downtime
```

---

## Lambda and Kappa Data Architecture

**Lambda Architecture** (two-layer):
```
Raw Events → Kafka
    ↓                         ↓
Batch Layer (Spark)     Speed Layer (Flink)
(accurate, hours)       (approximate, seconds)
    ↓                         ↓
Batch Views             Real-time Views
    ↓                         ↓
        Serving Layer (merges both)
```

**Kappa Architecture** (one-layer):
```
Raw Events → Kafka (long retention, 30 days)
    ↓
Stream Layer (Flink)
(handles both real-time AND historical reprocessing)
    ↓
Serving Layer
```

The Kappa architecture has won in practice: cloud storage is cheap, Flink handles historical replays, and having one system is simpler than two.

---

## Data Partitioning for Analytics

Partitioning tables dramatically speeds up analytics queries:

```sql
-- Without partitioning: scan entire 1TB table
SELECT count(*) FROM events WHERE date = '2024-01-15'
-- → Scans 1TB, returns in 5 minutes

-- With date partitioning: scan only that day's partition
CREATE TABLE events (...) PARTITION BY RANGE (date);
SELECT count(*) FROM events WHERE date = '2024-01-15'
-- → Scans 1/365 of data = ~2.7GB, returns in 1 second

-- Columnar storage (Parquet, ORC) further reduces I/O:
-- Only the "date" and "count" columns are read, not all 50 columns
```

Common analytics partitioning patterns:
| Pattern | Partition by | Best for |
|---------|------------|---------|
| Time-based | `date`, `month`, `year` | Event logs, metrics, user activity |
| Tenant-based | `organization_id`, `user_id` | Multi-tenant SaaS analytics |
| Geographic | `region`, `country` | Location-based analytics |
| Functional | `event_type`, `status` | When queries always filter on these |

---

## Interview Talking Points

- "Like counts are pre-computed via key splitting: 10 Redis keys per tweet, randomly increment one on like. Read = sum all 10 keys. Distributes write hotspot to 10 Redis instances."
- "The nightly batch Spark job computes 'people you may know' recommendations. They're 24 hours stale — acceptable for a social feature. Bank balance: never pre-computed, always fresh from primary DB."
- "ETL pipeline: Fivetran extracts from production PostgreSQL to Snowflake. dbt transforms raw events into analytics tables. Looker builds dashboards. All in SQL, no Spark code to maintain."
- "Kafka log retention = free backfill. Fixed a bug in the event parsing logic? Reset the consumer offset to 30 days ago and replay. No backup restore, no downtime."
