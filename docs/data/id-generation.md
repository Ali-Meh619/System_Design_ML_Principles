# Unique ID Generation

At scale, generating unique IDs across distributed systems is a non-trivial problem. The wrong choice causes performance bottlenecks, race conditions, or ID collisions.

---

## Why Database Auto-Increment Fails at Scale

Single-server auto-increment (`SERIAL`, `AUTO_INCREMENT`) works until you need:
- **Multiple database shards:** Auto-increment gives you `1, 2, 3` on Shard A and `1, 2, 3` on Shard B — collisions everywhere.
- **High write throughput:** A single auto-increment sequence is a serialization point. Every insert must acquire a lock on the counter.
- **Cross-service IDs:** Different services can't coordinate a global counter without a shared, single-point-of-failure central service.

---

## The 4 ID Generation Strategies

### 1. UUID v4 (Random)
128-bit random UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`).

| Pros | Cons |
|------|------|
| Trivially generated locally (no coordination needed) | 128 bits vs 64-bit integer — 2× storage |
| Zero collision probability in practice | Random insertion into B-tree indexes → page fragmentation → slower writes |
| No information leakage (not sequential) | Not human-readable or sortable |
| Works across distributed systems without coordination | Can't sort by creation time |

**Use when:** You need globally unique IDs without any central coordination and sortability doesn't matter.

### 2. UUID v7 / ULID (Time-ordered)
Lexicographically sortable unique identifiers with a time component prefix.

- **UUID v7:** 48-bit Unix timestamp (milliseconds) + 80 bits of random. Globally unique and monotonically increasing (mostly).
- **ULID:** 48-bit timestamp + 80 bits random. Encodes as 26-character base32 string.

| Pros | Cons |
|------|------|
| Sortable by creation time | Still 128 bits |
| Sequential insertion → good B-tree performance | Requires library (not built into all DBs) |
| No central coordination | Millisecond timestamp leaks creation time |
| Human-readable sort order | |

**Use when:** You need globally unique IDs that are also sortable and don't require a central coordinator.

### 3. Twitter Snowflake (Industry Standard for High-Scale)
64-bit integer composed of:

```
|  41 bits timestamp  |  10 bits machine ID  |  12 bits sequence  |
   (milliseconds since   (datacenter ID +        (0-4095 per ms
    custom epoch)         worker ID)               per machine)
```

- **41-bit timestamp:** Milliseconds since a custom epoch (Jan 1, 2010). Supports ~69 years.
- **10-bit machine ID:** 1024 unique machines (5 bits datacenter × 5 bits worker).
- **12-bit sequence:** 4096 unique IDs per millisecond per machine.
- **Total capacity:** 4096 × 1024 machines × 1000 ms/s = **4 billion IDs/second**.

| Pros | Cons |
|------|------|
| 64 bits — fits in a database `BIGINT` | Requires machine ID assignment (config or service) |
| Lexicographically sortable by time | Clock drift can cause issues (need NTP and skew detection) |
| High throughput (4096/ms per node) | Machine ID must be unique — complex in dynamic cloud environments |
| Embeds creation timestamp | Requires custom epoch planning |

**Used by:** Twitter (original), Discord, Instagram, LinkedIn (li-snowflake), Sonyflake.

### 4. Database Sequences (Ticket Server)
A dedicated "ticket server" — a single database or service responsible for issuing sequential IDs. Each client asks for an ID (or a batch of IDs) from the ticket server.

| Pros | Cons |
|------|------|
| Perfectly sequential | Single point of failure (mitigated with multi-master setup) |
| Simple implementation | Network round-trip for each ID (mitigate with pre-allocated batches) |
| Centralized control | Bottleneck at extreme scale |

**Flickr's approach:** Two MySQL databases with alternating sequences (one uses `auto_increment` = 1, step 2; the other = 2, step 2). Round-robin between them. Even if one fails, the other continues with unique IDs.

---

## Comparison Table

| Strategy | Size | Sortable | Coordination needed | Throughput |
|----------|------|----------|--------------------|-----------| 
| UUID v4 | 128 bits | ❌ No | ❌ None | Unlimited |
| UUID v7 / ULID | 128 bits | ✅ Yes | ❌ None | Unlimited |
| Snowflake | 64 bits | ✅ Yes | Machine ID setup | ~4B/s per machine |
| Database sequence | 64 bits | ✅ Yes | Central server | ~10K/s (mitigated with batching) |

---

## Interview Answer Sketch

> "For user IDs, I'd use Twitter Snowflake — 64-bit integers that are sortable by creation time, fit in a standard BIGINT column, and generate 4096 IDs per millisecond per machine without coordination. Each application server gets a unique machine ID from a ZooKeeper node at startup. For short-lived resource IDs where sortability doesn't matter, UUID v7 works well since it requires no infrastructure."
