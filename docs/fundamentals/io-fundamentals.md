# IO Fundamentals: Read vs Write

Understanding how data moves between memory, disk, and network is the foundation of every performance decision you'll make in system design.

---

## The Latency Hierarchy (Why RAM is King)

Every engineer preparing for system design interviews must memorize this hierarchy. These numbers determine architecture decisions — whether you need a cache, whether a synchronous call is acceptable, whether you can afford a database lookup in the critical path.

| Storage Layer | Latency | Analogy |
|--------------|---------|---------|
| L1 CPU cache | ~0.5 ns | 1 second |
| L2 CPU cache | ~7 ns | 14 seconds |
| L3 CPU cache | ~20 ns | 40 seconds |
| Main memory (RAM) | ~100 ns | 3.3 minutes |
| SSD random read | ~100 µs | 2.3 days |
| HDD random read | ~10 ms | 9.3 months |
| Network (same region) | ~1 ms | 1 month |
| Network (cross-region) | ~100 ms | 10 years |

**Key takeaway:** RAM is 1,000× faster than SSD, SSD is 100× faster than HDD. Any hot data that is read frequently should live in memory — that's the entire justification for caches.

> **Rule:** Never put a synchronous HDD random read in the critical path. A single database query doing a random disk read adds ~10ms. At 1,000 concurrent users, that's already your bottleneck.

---

## Random vs Sequential Access

Access pattern matters as much as storage medium. Sequential access reads data in order; random access reads arbitrary offsets.

| Access Type | HDD | SSD | RAM |
|------------|-----|-----|-----|
| Sequential | 100 MB/s | 500 MB/s | 10 GB/s |
| Random | 0.1 MB/s (100 IOPS) | 50 MB/s | 10 GB/s |

**Why this matters for databases:**
- **B-trees** (PostgreSQL, MySQL) do random disk reads to follow pointers. Great for reads, expensive for writes (random write + rebalancing).
- **LSM-trees** (Cassandra, RocksDB) convert random writes into sequential writes by buffering in memory and flushing sorted runs. Far better write throughput at the cost of read amplification.

**Interview rule:** Write-heavy systems (log ingestion, time-series, analytics) should favor LSM-tree databases (Cassandra, InfluxDB). Read-heavy systems with point lookups favor B-tree databases (PostgreSQL, MySQL).

---

## The OS Page Cache (The Hidden Cache)

The OS kernel maintains a **page cache** — a region of RAM that caches recently read and written disk blocks. This means:

1. Your first read of a file goes to disk (~10ms).
2. The kernel caches it in the page cache.
3. Your second read is served from RAM (<1µs).
4. A write is written to the page cache first (fast), then flushed to disk asynchronously.

**Implications:**
- If your working set fits in RAM (page cache), database reads are effectively in-memory speed. This is why "add more RAM" is often the most effective performance optimization.
- Applications like Redis, Kafka, and PostgreSQL are explicitly designed to exploit the page cache.
- `mmap()` directly maps files into process address space, letting the OS manage the cache. RocksDB uses this for SSTable reads.

---

## Write Amplification

**Write amplification** = the ratio of actual bytes written to disk vs bytes the application intended to write. It is a critical metric for storage systems, especially SSDs which have a finite write endurance.

**Sources of write amplification:**
- **B-tree rebalancing:** A single key insert might require rewriting multiple pages to maintain sorted order.
- **LSM compaction:** SSTables are merged and rewritten repeatedly as they move through levels. A single user write may be rewritten 10–30× by the time it reaches the bottom level.
- **Copy-on-write (COW) filesystems:** Every write creates a new copy; old blocks are freed asynchronously (ZFS, Btrfs).
- **RAID parity:** Write to RAID-5 = read old data + parity → compute new parity → write new data + parity.

**Interview use:** When comparing storage engines, mention write amplification. "Cassandra uses an LSM-tree. It has better write throughput than B-tree databases because writes are always sequential appends to the memtable, but compaction causes write amplification. For our write-heavy sensor logging use case, this trade-off is acceptable."

---

## When to Use This Knowledge

- **Cache sizing:** "Our working set is 50GB. I'll provision 64GB RAM instances so the page cache holds the hot data."
- **Database selection:** "We're ingesting 100K events/second. The random-write cost of B-trees would be a bottleneck — use Cassandra (LSM-tree)."
- **Latency budget:** "Our API must respond in < 50ms. A database read is ~1ms (if cached). A cross-service HTTP call is ~5ms. Two hops is fine; ten hops is not."
