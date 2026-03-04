# Database Internals

> Why databases use different storage engines, how indexes work, replication strategies, and Change Data Capture — the plumbing that makes databases scalable and reliable.

---

## B-tree vs LSM Tree — The Two Storage Engine Designs

Every database stores data on disk using an underlying data structure. The two dominant designs have opposite trade-off profiles:

**B-tree vs LSM Tree**

| Aspect | B-tree (PostgreSQL, MySQL, SQLite) | LSM Tree (Cassandra, RocksDB, LevelDB) |
|--------|-----------------------------------|----------------------------------------|
| Write pattern | **Random writes** — update the page in-place on disk. Slow for write-heavy workloads. | **Sequential writes only** — always append to a WAL (write-ahead log), then merge. Very fast writes. |
| Read pattern | Fast reads — directly traverse tree to find value. Predictable O(log N). | Potentially slower reads — may check multiple SSTables. Bloom filters mitigate this. |
| Write amplification | Low — write data once to the right place. | High — data is written multiple times as SSTables are compacted. |
| Space amplification | Low — overwrites reuse space. | Medium — stale data exists until compaction removes it (tombstones). |
| Best for | Read-heavy workloads, OLTP, when you need fast point reads. | Write-heavy workloads, time-series, event logs, when writes >> reads. |

The **LSM Tree** (Log-Structured Merge-Tree) works like this: writes go to an in-memory buffer (**MemTable**). When full, it's flushed to disk as a sorted immutable file called an **SSTable**. Multiple SSTables accumulate. A background **compaction** process periodically merges and sorts SSTables, removing duplicates and tombstones. This is why Cassandra achieves 100K+ writes/second — every write is a sequential append.

---

## Database Indexes — How They Actually Work

An index is a separate data structure maintained alongside your table that speeds up lookups at the cost of extra write overhead and storage. Every database index uses a B-tree under the hood (for most databases) — a self-balancing tree that keeps data sorted and allows O(log N) lookup, insertion, and deletion.

**Index Types and When to Use Them**

| Index Type | How it works | Best for |
|------------|-------------|---------|
| **Primary index (clustered)** | Table data is physically stored in primary key order. Only one per table. Lookups by PK are fastest. | Lookups by ID. Always automatically created for primary key. |
| **Secondary index** | Separate B-tree keyed on a non-primary column, pointing to primary key. An extra lookup is needed to get actual row. | Queries filtering by email, status, created_at, etc. |
| **Composite index** | Index on multiple columns: (user_id, created_at). Efficient for queries filtering on both columns. Column order matters — leftmost prefix rule. | Queries like `WHERE user_id = X ORDER BY created_at`. Critical for feed queries. |
| **Covering index** | Index includes all columns needed for a query — the query can be answered from the index alone without touching the table. | High-frequency queries where you want to avoid the extra table lookup. |
| **Partial index** | Index only a subset of rows: `CREATE INDEX ON orders(user_id) WHERE status = 'pending'`. Much smaller index. | When you always filter on a specific value (e.g., only query pending orders). |

> ⚠️ **Index Anti-patterns:**
> - **Over-indexing:** Every index slows writes (must update index on every INSERT/UPDATE/DELETE). Don't index every column.
> - **Low-cardinality columns:** Indexing a boolean column (true/false) is useless — the index covers 50% of rows; a full scan is often faster.
> - **Leftmost prefix violation:** A composite index (a, b, c) cannot be used for `WHERE b = X` or `WHERE c = X` without a, but can be used for `WHERE a = X` or `WHERE a = X AND b = Y`.

---

## Database Replication Strategies

Replication copies data from one database node to others for redundancy and read scaling. The primary risk: **replication lag** — replicas are slightly behind the primary, causing stale reads.

**Replication Modes**

| Mode | How it works | Trade-off |
|------|-------------|-----------|
| **Single-leader (primary-replica)** | One primary accepts all writes. Replicas copy changes asynchronously. Reads can go to replicas. | Simple. Replica reads may be stale. Primary is single point of failure for writes. |
| **Multi-leader** | Multiple nodes accept writes independently. Changes are synced across leaders asynchronously. Write conflicts possible. | Better write availability. Complex conflict resolution. Used for multi-datacenter active-active setups. |
| **Leaderless (Dynamo-style)** | Any node accepts reads and writes. Uses quorum: write to W nodes, read from R nodes where R + W > total_nodes. Cassandra, DynamoDB. | Highest availability. Eventual consistency. No failover needed. More complex consistency guarantees. |
| **Synchronous vs Async replication** | Sync: primary waits for replica to confirm before responding to client. Async: primary responds immediately, replica catches up later. | Sync: zero data loss, slower writes. Async: faster, but potential data loss if primary crashes before replica catches up. |

> 💡 **Read-your-writes consistency:** A common complaint with replica reads: "I just updated my profile photo but it still shows the old one." This is because your write went to the primary but your next read hit a replica that hasn't caught up yet. Solution: after a write, route subsequent reads for that user to the primary for a short window (e.g., 1 second). Or always route a user's reads to the same replica using consistent hashing (sticky replica reads).

---

## Change Data Capture (CDC) — The Sync Superpower

**Change Data Capture** reads the database's internal write-ahead log (**WAL**) and streams every INSERT/UPDATE/DELETE as a real-time event. This is the most reliable way to sync data between systems because:
1. It captures all changes, even those made directly in the DB
2. It's atomic — changes are emitted exactly as they were committed
3. It has near-zero performance impact on the primary database

The dominant tool is **Debezium** (open-source). It connects to the database (MySQL binlog, PostgreSQL replication slot, MongoDB oplog), reads changes, and publishes them to Kafka. Downstream consumers (Elasticsearch sync, cache invalidation, analytics pipeline, search index) subscribe to Kafka and react to changes.

```
CDC Architecture (keep multiple systems in sync):

PostgreSQL (source of truth)
        ↓ WAL (write-ahead log)
    Debezium
        ↓ publishes events to Kafka
┌──────────────────────────────────────┐
│  Kafka topic: "users.changes"        │
│  Event: {op: "UPDATE", before: {...}, │
│           after: {...}, ts: 12345}    │
└──────────────────────────────────────┘
        ↓ consumed by multiple subscribers
  ┌─────────────────────────────────┐
  │  Elasticsearch sync service     │ → search index always fresh
  │  Cache invalidation service     │ → delete Redis cache on update
  │  Analytics pipeline (Flink)     │ → real-time dashboards
  │  Audit log service              │ → immutable change history
  └─────────────────────────────────┘
```

> ✅ **When to use CDC vs polling:**
> - **CDC:** When you need real-time sync with sub-second latency, cannot modify application code to emit events, or need a complete audit trail including bulk DB operations.
> - **Application-level events:** When you control the application and can explicitly publish events via the outbox pattern. Simpler if CDC infrastructure doesn't exist yet.

---

## Sharding (Partitioning) — When One Server Isn't Enough

When a dataset exceeds the storage or write capacity of a single server (e.g., >10TB), you must **shard** it. Sharding splits data across multiple servers. Choosing the **shard key** is the most critical decision.

**Sharding Strategies**

| Strategy | How it works | Pros | Cons |
|----------|-------------|------|------|
| **Range Sharding** | Shard by key range: Users A-F on Server 1, G-M on Server 2. Used by HBase, BigTable. | Efficient range queries (get all users created in Jan 2024). Easy to split shards. | **Hot spots** if data is sequential (e.g., timestamp). Everyone writes to the last shard. |
| **Hash Sharding** | Shard = hash(key) % N. Evenly distributes keys. Used by DynamoDB, Cassandra, MongoDB (hashed). | Uniform distribution. No hot spots (usually). | Range queries are impossible (must query all shards). Resharding is expensive (consistent hashing helps). |
| **Directory Based** | A lookup table maps each key to a shard ID. Flexible but adds a lookup step (SPOF). | Complete control over placement. Can move individual users. | Lookup table becomes the bottleneck. |

> ⚠️ **The Price of Sharding:** Once you shard, you lose: **JOINs across shards** (must do in app), **Transactions across shards** (need 2PC/Saga), **Global constraints** (unique email across all users). Always scale up (vertical) before scaling out (sharding) if possible.

---

## ACID vs BASE — Transaction Philosophies

**Transaction Guarantees**

| Model | Stands for | Properties | Used by |
|-------|-----------|-----------|---------|
| **ACID** | **A**tomicity (all or nothing), **C**onsistency (valid state), **I**solation (transactions don't interfere), **D**urability (saved to disk). | Guarantees data integrity. Hard to scale horizontally. | RDBMS (PostgreSQL, MySQL, Oracle). |
| **BASE** | **B**asically **A**vailable, **S**oft state, **E**ventual consistency. | Prioritizes availability and scale over strict consistency. | NoSQL (Cassandra, DynamoDB, MongoDB). |

---

## Isolation Levels — How Isolated Are Your Transactions?

When two transactions run at the same time, what happens? Isolation levels define the trade-off between concurrency and correctness.

**SQL Isolation Levels (Weakest to Strongest)**

| Level | What it allows (Bugs) | Performance | Example Database Default |
|-------|----------------------|-------------|--------------------------|
| **Read Uncommitted** | Dirty Reads (read uncommitted data). | Fastest. No locking. | Rarely used. |
| **Read Committed** | Non-repeatable Reads (reading same row twice gives different results). No Dirty Reads. | Fast. Standard for most apps. | PostgreSQL, Oracle, SQL Server. |
| **Repeatable Read** | Phantom Reads (new rows appear in range queries). No Non-repeatable Reads. | Slower. Uses snapshots/locks. | MySQL (InnoDB). |
| **Serializable** | None. Transactions run as if sequentially (one after another). | Slowest. High contention/deadlocks. | CockroachDB. Optional in others. |

---

## Write-Ahead Log (WAL)

The WAL is the backbone of database durability:

```
Write Process:
1. Transaction begins
2. Changes written to WAL (sequential write, fast)
3. Transaction commits → WAL is fsynced to disk (durable!)
4. Later: WAL entries applied to actual data files (async)

Crash recovery:
1. Database restarts
2. Reads WAL log from last checkpoint
3. Replays uncommitted transactions (redo)
4. Rolls back uncommitted transactions (undo)
5. Database is back to consistent state
```

The WAL is also the foundation of replication (streaming replication in PostgreSQL ships WAL entries to replicas) and CDC (Debezium reads WAL to stream changes).

---

## Interview Talking Points

- "PostgreSQL's B-tree for user accounts — fast random reads, ACID transactions. Cassandra's LSM-tree for the activity log — 100K writes/second, append-only pattern."
- "Composite index on (user_id, created_at) for the feed query. The leftmost column (user_id) enables efficient single-user lookup; clustering key (created_at) gives time-ordered results without a sort step."
- "CDC via Debezium to keep Elasticsearch in sync with PostgreSQL. Near-real-time (< 1 second lag) with zero application code changes."
- "For sharding the user table: hash(user_id) % 10 shards. Uniform distribution, no hot spots. Cross-shard queries are impossible, but our access patterns are always single-user lookups — no cross-shard JOINs needed."
