# Database Selection Guide

> The single most impactful architectural decision. Choosing the wrong database is extremely hard to undo. Learn the trade-offs, not just the names.

---

## The Core Tension: SQL vs NoSQL

The **SQL vs NoSQL** debate is really a debate about **structure vs scale**. SQL databases give you strong guarantees and rich query power. NoSQL databases give you horizontal scalability and flexible schemas at the cost of query expressiveness and consistency guarantees. Neither is universally better — the right choice depends on your data model and access patterns.

**SQL vs NoSQL at a Glance**

| Dimension | SQL (Relational) | NoSQL |
|-----------|-----------------|-------|
| Data structure | Tables with fixed schema, rows and columns | Documents, key-value pairs, wide columns, or graphs — flexible |
| Queries | Extremely powerful: JOINs, aggregations, arbitrary filters | Limited: mostly get-by-key or simple filters, no joins |
| Transactions | Full ACID: atomicity, consistency, isolation, durability | Usually eventual consistency; some offer transactions within a partition |
| Scaling | Vertical scaling primarily; sharding is painful and complex | Built for horizontal scaling: just add nodes |
| When to choose | Complex relationships, financial data, e-commerce, user accounts | Massive scale, flexible schemas, simple access patterns (get by key) |

---

## Type 1: Relational Databases (SQL)

**Relational databases** store data in tables with rows and columns, enforcing a strict schema. They provide **ACID transactions** — a critical property for anything financial or order-related. The "A" (atomicity) means either all steps of a transaction succeed or none do. This prevents scenarios like money being deducted from Account A without being added to Account B.

| Database | Best For | Key Features |
|----------|----------|--------------|
| **PostgreSQL** | Industry standard | Open-source, extremely feature-rich. Supports JSON columns (hybrid SQL/NoSQL), full-text search, geospatial queries. Best all-around choice for most applications. |
| **MySQL** | Web applications | Simpler than PostgreSQL, slightly faster for simple reads. Used by Facebook, Twitter, YouTube at massive scale with custom sharding. |
| **Amazon RDS / Aurora** | Managed cloud | Managed MySQL/PostgreSQL. Aurora is AWS's cloud-native version: 5× faster than MySQL, automatic failover, up to 15 read replicas. |

**Scaling SQL: The 4 Strategies**

| Strategy | How it works | Limitation |
|----------|-------------|-----------|
| **Vertical scaling** | Buy a bigger machine (more CPU, RAM, SSD) | Has a physical ceiling; expensive; single point of failure |
| **Read replicas** | Copy data to secondary servers; route read queries there | Writes still go to primary; replicas may lag (replication delay) |
| **Connection pooling** | Use PgBouncer or ProxySQL to reuse database connections | Reduces connection overhead but doesn't scale data |
| **Sharding** | Split table across multiple databases by user_id range or hash | Cross-shard JOINs become impossible; complex application logic |

---

## Type 2: Key-Value Stores

**Key-value stores** are the simplest NoSQL databases. You store and retrieve data by a single unique key — like a giant dictionary. There are no tables, no schemas, no queries. Just: "store this value under this key" and "give me the value for this key." This extreme simplicity is exactly what makes them so fast and scalable.

| Database | Best For | Key Features |
|----------|----------|--------------|
| **Redis** | Cache, sessions, queues, pub/sub | In-memory. Sub-millisecond reads/writes. Rich data types: strings, lists, sets, sorted sets, hashes. Can persist to disk. **The most versatile database for systems design.** |
| **Amazon DynamoDB** | Serverless, global scale | Managed, infinitely scalable. Guaranteed single-digit millisecond latency. Supports auto-scaling. Used by Amazon.com, Lyft, Airbnb. |
| **Memcached** | Pure cache only | Simpler than Redis, faster for pure string caching at massive scale. No persistence, no complex data types. Used by Facebook for multi-billion-key caches. |

> ✅ **When to use key-value stores:**
> - **Sessions:** store user_id → session data (needs fast reads on every request)
> - **Cache:** store expensive query results keyed by query hash
> - **Rate limiting:** store user_id → request_count with TTL
> - **Feature flags:** store flag_name → enabled/disabled
> - **Leaderboards:** Redis sorted sets are perfect for top-K rankings

---

## Type 3: Wide-Column Stores (Cassandra)

**Cassandra** is the right choice when you need to write enormous volumes of data continuously, need it distributed globally, and can tolerate eventual consistency. Netflix, Uber, Instagram, Discord, and Apple all use Cassandra. Its killer feature is that writes are extremely fast (append-only log structure) and every node is equal — there's no single master that becomes a bottleneck.

Cassandra's data model forces you to **design tables around your queries** (not your entities). You decide upfront: "I will always query user activity by user_id and time range." Then you design a table with user_id as the **partition key** (determines which node holds the data) and timestamp as the **clustering key** (determines order within the partition). You cannot query a Cassandra table by fields that aren't in the partition key — so if you need multiple access patterns, you create multiple tables (denormalization).

**Cassandra Trade-offs**

| Strength | Weakness |
|----------|----------|
| Massive write throughput (100K+ writes/second per node) | No JOINs, no GROUP BY, no arbitrary queries |
| Linear horizontal scaling — just add nodes | Eventual consistency (may briefly show stale reads) |
| Multi-region replication built-in | Data modeling is complex — requires upfront query planning |
| No single point of failure (leaderless) | Overwrites are expensive (tombstones, compaction) |

---

## Type 4: Document Databases

**Document databases** store data as JSON-like documents. Each document can have a different structure — there's no rigid schema enforced at the database level. This is powerful when your data is naturally nested (a blog post with comments, tags, and metadata all in one document) or when your schema evolves frequently.

| Database | Best For | Key Features |
|----------|----------|--------------|
| **MongoDB** | Content management, catalogs, user profiles | Most popular document database. Flexible JSON schema. Rich query language including aggregation pipelines. Supports horizontal sharding. |
| **Firestore (Google)** | Mobile apps, real-time sync | Document database with built-in real-time listeners. When a document changes, all subscribed clients are notified instantly. Great for chat, live collaboration. |

---

## Type 5: Time-Series Databases

**Time-series databases** are optimized for data that has a timestamp and is written continuously — metrics, sensor readings, stock prices, application logs. They have built-in support for time-range queries ("show me CPU usage every minute for the last hour"), automatic downsampling (compressing old data at lower resolution), and retention policies (delete data older than 30 days).

| Database | Best For | Key Features |
|----------|----------|--------------|
| **InfluxDB** | Application metrics, IoT | Purpose-built time-series. Automatic downsampling and retention. Built-in query language (Flux) for time-range aggregations. |
| **TimescaleDB** | Complex time-series with SQL | PostgreSQL extension. You get full SQL power plus time-series optimizations. Best of both worlds for complex analytics on time-ordered data. |
| **Prometheus** | Infrastructure monitoring | Pull-based metrics collection. Scraped metrics stored with high efficiency. Native Kubernetes integration. Powers most cloud-native monitoring stacks. |

---

## Type 6: Search Databases

**Elasticsearch** is a search engine built on Lucene. It creates an **inverted index** — for every word in your documents, it stores which document IDs contain that word. When you search "spicy ramen NYC", it looks up each word in the index and finds the intersection, ranked by relevance. This is fundamentally different from a regular database query and is why dedicated search engines are orders of magnitude faster for text search.

> ⚠️ **Critical Interview Point:** Never use Elasticsearch as your primary database. It is eventually consistent, doesn't support transactions, and can lose data under certain failure modes. The correct pattern is: primary data in PostgreSQL/MongoDB → sync to Elasticsearch for search. When users search, query Elasticsearch to get IDs, then fetch full records from the primary database.

---

## Type 7: OLAP / Analytics Databases

Transactional databases (OLTP) are optimized for many small, concurrent operations ("get order 12345", "update user email"). Analytics databases (**OLAP**) are optimized for a different pattern: scan millions or billions of rows and compute aggregates ("what were total sales per region in Q3?"). These workloads need fundamentally different storage layouts — OLAP databases store data **column by column** instead of row by row, which is dramatically faster for computing column aggregations.

| Database | Best For | Key Features |
|----------|----------|--------------|
| **Snowflake** | Enterprise data warehouse | Fully managed cloud data warehouse. Separates compute from storage — pay only when running queries. Best for business intelligence and ad-hoc analysis. |
| **Google BigQuery** | Serverless analytics | Serverless. Query petabytes of data without managing servers. Pay per query. Native support for streaming inserts. Widely used for app analytics. |
| **ClickHouse** | Real-time analytics | Blazingly fast columnar database. Used by Cloudflare, Uber for real-time analytics at billions of rows per second. Self-hosted or managed. |

---

## Database Selection Decision Tree

```
Is the data primarily for analytics/reporting?
  → YES: Use OLAP (Snowflake, BigQuery, ClickHouse)
  → NO: Continue...

Is data time-series (metrics, sensor data, logs)?
  → YES: Use time-series DB (InfluxDB, Prometheus, TimescaleDB)
  → NO: Continue...

Do you need full-text search?
  → YES: Elasticsearch (as secondary index alongside primary DB)
  → NO: Continue...

Do you need ACID transactions or complex JOINs?
  → YES: Use SQL (PostgreSQL is usually the right choice)
  → NO: Continue...

Is write throughput > 10K/second or data globally distributed?
  → YES: Use Cassandra (write-heavy) or DynamoDB (managed, serverless)
  → NO: Use PostgreSQL (flexible, powerful, reliable default)

Is data accessed purely by key with no queries?
  → YES: Use Redis or DynamoDB (key-value, sub-millisecond)
  → NO: Use PostgreSQL
```

---

## Interview Tips

- Start with PostgreSQL as the default. Justify switching to NoSQL with a specific reason (scale, write volume, schema flexibility).
- Always name the **shard key** when using Cassandra/DynamoDB — the interviewer will ask.
- Distinguish **OLTP** (operational, row-oriented, user-facing) from **OLAP** (analytics, column-oriented, batch jobs).
- Never store BLOBs (images/videos) in SQL. Use S3 + store the URL in the DB.
- In interviews, saying "I'd use PostgreSQL for the user accounts table with read replicas, and Cassandra for the activity log with 100K writes/second" shows database maturity.
