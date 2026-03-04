# Caching Deep Dive

> Caching is the most common system design optimization. Understanding when to cache, what to cache, and how to handle invalidation separates good engineers from great ones.

---

## What Caching Does (and Why You Need It)

A **cache** is a fast, temporary storage layer that holds the results of expensive operations. Instead of computing or fetching the same data repeatedly, you compute it once, store it in a cache, and serve subsequent requests from memory. Since RAM is ~100× faster than a database query, caching dramatically reduces latency and database load. At scale, without caching, your database would simply die under read volume.

The critical metric is **cache hit rate** — the percentage of requests served from cache without touching the database. A hit rate of 95% means only 5% of requests reach the database. For a system with 1 million reads/second, this cuts database load from 1M QPS to just 50K QPS — a 20× reduction.

---

## The 5 Cache Layers

Every request passes through multiple potential cache layers, from fastest (client) to slowest (database). Understanding each layer helps you decide where to cache what.

**Cache Layer Hierarchy**

| Layer | Location | Latency | Best for |
|-------|----------|---------|---------|
| **Browser cache** | User's device | 0ms | Static assets (JS, CSS, images) |
| **CDN cache** | Edge server near user | 1–5ms | Static + semi-static content, images, video |
| **API Gateway cache** | In front of your servers | ~5ms | Responses for popular read endpoints |
| **Application cache** (Redis) | Your backend servers | 0.1–1ms | Database query results, session data, computed values |
| **Database buffer pool** | Inside the database | 1–5ms | Frequently accessed pages, handled automatically |

---

## Cache Read Patterns

How your application reads from cache and falls back to the database determines your consistency guarantees and failure behavior.

**Read Pattern Comparison**

| Pattern | How it works | Pros | Cons |
|---------|-------------|------|------|
| **Cache-Aside (Lazy Loading)** | App checks cache. Miss → app queries DB → app writes to cache → returns result. Next request hits cache. | Most common. Only caches what's actually requested. Cache failure doesn't break the app. | First request always slow (cold start). Potential stale data between TTL cycles. |
| **Read-Through** | Cache sits in front of DB. On miss, cache automatically fetches from DB and stores it. | Simpler app code — app only talks to cache. | Cold start still exists. Cache library must know how to query DB. |

---

## Cache Write Patterns

**Write Pattern Comparison**

| Pattern | How it works | Pros | Cons |
|---------|-------------|------|------|
| **Write-Through** | On every write, update both cache and database simultaneously before responding. | Cache always has fresh data. No stale reads. | Slower writes (must update both). Caches data that may never be read. |
| **Write-Behind (Write-Back)** | Write to cache immediately. Asynchronously flush to DB in batches later. | Extremely fast writes. Great for bursty write workloads. | Risk of data loss if cache dies before flush. Complex consistency. |
| **Write-Around** | Write goes directly to DB, bypassing cache. Cache is only populated on reads. | Avoids caching one-time writes that won't be re-read. | First read after write will miss cache. |

> 💡 **Which pattern to use when:**
> - **Cache-Aside + Write-Around**: Best default for most systems. Simple, battle-tested.
> - **Write-Through**: Use when data consistency is critical (banking, inventory counts).
> - **Write-Behind**: Use when write throughput is extreme (gaming leaderboards, real-time counters).

---

## Eviction Policies

Cache has limited size. When it's full and a new item needs to be stored, something must be evicted. The eviction policy determines what gets removed.

**Eviction Policy Comparison**

| Policy | What it evicts | Best for |
|--------|--------------|---------|
| **LRU (Least Recently Used)** | The item not accessed for the longest time | General-purpose. Best default. Works well for temporal locality (recently accessed = likely to be accessed again). |
| **LFU (Least Frequently Used)** | The item accessed the fewest total times | When access frequency is more important than recency. Better for viral content that stays popular long-term. |
| **TTL (Time-to-Live)** | Items older than a set expiry time | When data has a known freshness window (e.g., news feed is stale after 5 minutes). Pair with LRU. |
| **FIFO (First In, First Out)** | The oldest-inserted item | Rarely optimal. Use only when insertion time is a valid proxy for staleness. |

---

## Cache Invalidation — The Hardest Problem

Phil Karlton famously said: "There are only two hard things in computer science: cache invalidation and naming things." **Cache invalidation** is the problem of ensuring your cache is updated when the underlying data changes. If a user updates their profile photo but your cache still serves the old photo for 10 minutes, that's a stale cache problem.

**Invalidation Strategies**

| Strategy | How it works | Trade-off |
|----------|-------------|-----------|
| **TTL-based expiry** | Set a time limit. After TTL expires, item is gone. Next request repopulates. | Simple but accepts some stale data. TTL length = freshness vs. cache efficiency trade-off. |
| **Event-based invalidation** | When data changes in DB, explicitly delete or update the cache entry. | Always fresh. Complex: must track what to invalidate. Race conditions possible. |
| **Write-through** | Every write updates the cache immediately. | Freshest data. Higher write latency. May cache data never re-read. |

> ⚠️ **Cache Stampede / Thundering Herd:** When a popular cached item expires, hundreds of simultaneous requests all find a miss and all hit the database at the same time, potentially crashing it. Solutions:
> 1. **Mutex lock**: only one request rebuilds the cache, others wait.
> 2. **Probabilistic early expiry**: randomly refresh the cache slightly before it expires, before the stampede hits.
> 3. **Background refresh**: a background job proactively refreshes popular items before they expire.

---

## Redis Data Types for Caching

Redis provides specialized data types that go beyond simple key-value caching:

| Data Type | Redis Command | Use Case |
|-----------|--------------|---------|
| **String** | `SET key value EX 3600` | Simple cache entries, session tokens, feature flags |
| **Hash** | `HSET user:123 name "Alice" email "a@b.com"` | User profiles — cache partial updates |
| **List** | `LPUSH feed:user:123 tweet_id` | Social feeds, activity logs (LIFO or FIFO) |
| **Sorted Set** | `ZADD leaderboard 9999 user:123` | Rankings, leaderboards, rate limiting |
| **Set** | `SADD online_users user:123` | Unique member tracking (who's online) |
| **Bitmap** | `SETBIT daily_active:2024-01-15 user_id 1` | Daily active user tracking (1 bit per user) |

---

## Distributed Cache Architecture

When a single Redis instance is insufficient, you need distributed caching:

**Redis Cluster (Sharded)**
- Data automatically partitioned across N nodes using hash slots (16,384 slots).
- Reads and writes route to the correct shard automatically.
- Failure of one shard affects only the data on that shard (not entire cache).

**Redis Sentinel (HA)**
- Primary + replicas for fault tolerance.
- Sentinel monitors nodes and performs automatic failover.
- Good for smaller datasets that fit on one node with redundancy.

**Client-side sharding**
- Application logic determines which cache server to use (consistent hashing by key).
- Avoids Redis Cluster overhead. Used by Facebook's Memcached setup.

---

## Interview Talking Points

- "I'd add Redis between the API servers and the database. Cache-aside pattern. TTL of 1 hour for product catalog data."
- "The most important metric is cache hit rate. I'd target 95%+. At that rate, only 5% of 1M reads/second hit the database — that's 50K QPS instead of 1M."
- "For the thundering herd problem, I'd use probabilistic early expiry: randomly refresh the entry when it's within 10% of TTL, not when it expires."
- "We can't use cache-aside for bank balance — we need write-through to guarantee fresh reads. The slightly higher write latency is acceptable."
- "Every cache entry has a TTL. We never store data indefinitely — stale data is worse than a cache miss."
