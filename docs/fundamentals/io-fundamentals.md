# IO Fundamentals: Read vs Write

> The physics of data access. Understanding Random vs Sequential IO, RAM vs Disk, and the OS Page Cache is the difference between a Junior and Senior engineer.

---

## The Latency Hierarchy (Why RAM is King)

The "Numbers to Know" section showed you *what* the latencies are. This section explains *why*. The CPU is blazingly fast (0.5ns). Main Memory (RAM) is reasonably fast (100ns). Disk (SSD) is slow (100,000ns). Network is glacial (50,000,000ns).

**The Cost of Persistence**

| Storage | Volatility | Cost/GB | Speed | Role |
|---------|-----------|---------|-------|------|
| **RAM** | Volatile (data lost on power off) | $$$ High | ~10GB/s+ | Workspace for active data. Cache. Indexes. |
| **SSD (Disk)** | Persistent (data safe) | $$ Medium | ~500MB/s - 3GB/s | Primary storage. Databases. Logs. |
| **HDD (Spinning)** | Persistent | $ Low | ~100MB/s | Archival. Backups. Cheap cold storage. |

**Key Insight:** Any system design that requires a synchronous disk read in the user path will be slow. We use caching (RAM) to hide the slowness of disk, and we use buffering/logging (sequential write) to hide the cost of persistence.

---

## Random vs Sequential Access

Not all disk operations are equal. This distinction is critical for database performance.

**The Access Pattern Impact**

| Pattern | Mechanics | Performance | Used by |
|---------|-----------|-------------|---------|
| **Sequential Access** | Reading/writing blocks one after another. No "seeking" (jumping around). Predictable. | **Fastest.** HDDs thrive here. SSDs maximize throughput. OS pre-fetches data. | Kafka (append-only log), Cassandra (LSM tree write), Backups. |
| **Random Access** | Jumping to arbitrary locations on disk. Requires "seeking". | **Slowest.** 10-100x slower than sequential. Kills throughput. | Relational DBs (B-trees) doing random updates, Reading files by ID. |

> 💡 **Why LSM Trees (Cassandra) are fast at writing:** LSM Trees convert **random writes** (users updating random rows) into **sequential writes** (appending to a log file). This allows them to ingest data orders of magnitude faster than B-trees, which must jump around updating random disk pages.

---

## The OS Page Cache (The Hidden Cache)

When you "write to disk" in code, you usually aren't. You are writing to the operating system's **Page Cache** (RAM). The OS decides when to actually flush that dirty page to the physical disk (fsync). This makes writes appear fast but introduces a risk: if power fails before the flush, data is lost.

Conversely, when you "read from disk", if that file was recently read, the OS likely serves it straight from RAM. This is why "cold" database performance is terrible compared to "warm" performance. **Free RAM on a database server is never wasted; it is used as cache by the OS.**

---

## Write Amplification

A "logical write" (user saves 1KB profile) often results in multiple "physical writes" (database writes 10KB to disk). This is **write amplification**.

1. **WAL (Write Ahead Log):** To ensure durability, the DB writes to a log file first (1×).
2. **Data File:** Then it writes to the actual data page (2×).
3. **Indexes:** Then it updates every index (Email, Username, etc.) (3×, 4×, 5×...).
4. **SSD Level:** SSDs must erase a whole block before writing a page, causing internal copying (GC).

**Design implication:** Every secondary index you add slows down writes significantly. Don't over-index.

---

## IO Patterns Summary

| Pattern | Reads | Writes | Example DB | Best For |
|---------|-------|--------|------------|----------|
| **B-Tree (in-place update)** | Fast O(log N) | Random writes → slow under load | PostgreSQL, MySQL | Read-heavy OLTP, transactions |
| **LSM Tree (append-only)** | Slightly slower (bloom filter check) | Sequential writes → very fast | Cassandra, RocksDB | Write-heavy, time-series, event logs |
| **Log-structured (append only)** | Full scan or indexed | Ultra-fast sequential append | Kafka | Event streaming, durable queues |

---

## Durability vs Performance Trade-off

| Setting | Durability | Performance | Risk |
|---------|-----------|-------------|------|
| `fsync=on` (PostgreSQL default) | Full — flush on every commit | Slower writes | None — data safe on crash |
| `fsync=off` | Weak — relies on OS Page Cache | Much faster writes | Data loss on power failure |
| Write-ahead log (WAL) | Strong — crash-recoverable | Moderate overhead | Low — WAL can be replayed |
| In-memory only (Redis no-persistence) | None | Fastest possible | Total data loss on restart |

> ⚠️ **Warning:** Never disable fsync in a production database that holds financial or user data. The performance gain is not worth the data loss risk. Use Redis (non-persistent) only for caches and ephemeral data.

---

## Interview Talking Points

- "I'll store user writes in Redis first (async durability) for speed, then persist to PostgreSQL in the background — so the user path never hits disk."
- "We need an LSM-based database here because our write rate is 100K/second. B-tree databases would fragment under this load."
- "Every index we add slows down writes. I'll only index fields we actually query frequently: user_id, created_at, status."
- "The OS Page Cache means our database will be faster after warmup — I'd add a warmup script on deployment to pre-populate the cache."
