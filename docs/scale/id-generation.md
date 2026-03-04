# Unique ID Generation

> Generating globally unique IDs in a distributed system — without a centralized counter that becomes a bottleneck. Comes up in almost every system design question.

---

## Why Database Auto-Increment Fails at Scale

A single database auto-increment primary key (1, 2, 3, 4...) is simple but has critical limitations at scale:

1. It requires a round-trip to the database just to get an ID before inserting — a bottleneck at high write rates
2. It reveals business intelligence (competitor can see your order volume from sequential IDs)
3. It doesn't work across shards — shard 1 and shard 2 would both generate ID 1, causing conflicts

You need IDs that are **globally unique**, **sortable by time**, and **generated without coordination**.

---

## The 4 ID Generation Strategies

**ID Generation Comparison**

| Strategy | Structure | Pros | Cons |
|----------|---------|------|------|
| **UUID v4** | 128-bit random: `550e8400-e29b-41d4-a716-446655440000` | No coordination needed. Globally unique. Works everywhere. | Not sortable by time. Large (16 bytes). Index fragmentation on insert (random, not sequential). |
| **Twitter Snowflake** | 64-bit: [41-bit timestamp][10-bit machine ID][12-bit sequence] | Sortable by time (first 41 bits). 64-bit (smaller than UUID). No coordination between generators. Up to 4096 IDs/ms/machine. | Requires synchronized clocks. Machine IDs must be unique (managed via Zookeeper or config). |
| **ULID** | 128-bit: [48-bit ms timestamp][80-bit random] | Sortable. URL-safe string. Monotonically increasing within same millisecond. | Slightly larger than Snowflake. Less common. |
| **Database sequence server** | Dedicated service vends pre-allocated ID ranges to callers. Callers use local range, fetch new range when exhausted. | Sequential IDs. Survives clock skew. Works across any number of services. | Single point of failure (mitigated with replicas). Extra service to maintain. |

---

## Twitter Snowflake — The Industry Standard

Used by Twitter, Discord, Instagram, Mastodon, and many others. A **Snowflake ID** is a 64-bit integer composed of:
- **41 bits timestamp** (milliseconds since a custom epoch — 41 bits gives ~69 years before overflow)
- **10 bits machine ID** (identifies the server generating the ID — supports up to 1,024 machines)
- **12 bits sequence number** (auto-increments within each millisecond — up to 4,096 IDs per millisecond per machine)

```
Snowflake ID structure (64 bits total):
  [ 0 | 41 bits timestamp | 10 bits machine_id | 12 bits sequence ]

  Timestamp: ms since Jan 1 2010 (custom epoch)
  Machine ID: unique ID for this generator instance (from Zookeeper/config)
  Sequence:   auto-increment, resets to 0 each millisecond

Max throughput per machine: 4,096 IDs/ms = 4 million IDs/second
Max machines: 1,024 (2^10)
Usable until: ~2079 (69 years after 2010 epoch)

IDs are sortable: two IDs from the same machine are always ascending.
IDs from different machines at same ms may interleave but are still
roughly time-ordered — good enough for "sort by creation time."

Discord uses 42-bit timestamp + 10-bit worker + 12-bit increment.
Instagram uses 41-bit timestamp + 13-bit shard ID + 10-bit sequence.
```

> 💡 **Interview answer on ID generation:** "I'd use a Snowflake-style ID generator deployed as a lightweight sidecar service on each application server. Machine IDs are assigned from a central registry (Zookeeper or a simple config service) at startup. This gives us time-sortable 64-bit IDs with no single point of failure and no coordination on the hot path. Fallback for clock skew: if the clock goes backwards, wait until clock catches up to last-used timestamp before generating new IDs."

---

## Clock Skew — The Snowflake Weakness

Snowflake requires monotonically increasing timestamps. If a server's clock goes backwards (NTP correction), it could generate duplicate IDs. Mitigation strategies:

1. **Wait:** If `current_time < last_timestamp`, wait until `current_time >= last_timestamp` before generating new IDs
2. **Extra bits for clock backwards:** Use 1 bit as a "backwards flag" and increment it on clock rollback
3. **Centralized time service:** Use a monotonic logical clock instead of wall clock
4. **Bounded clock drift:** Configure NTP to only step forward, never backwards (slew-only mode)

---

## UUID v4 vs Snowflake Trade-offs

| Dimension | UUID v4 | Snowflake |
|-----------|---------|----------|
| Size | 128 bits (16 bytes) | 64 bits (8 bytes) |
| Sortability | No — random | Yes — time-ordered |
| B-tree index | Random inserts → fragmentation → slow writes | Sequential inserts → no fragmentation → fast writes |
| Coordination needed | None — truly stateless | Machine ID assignment needed at startup |
| Collision probability | ~10^-38 with 122 random bits | Zero within same machine-ms-sequence |
| Human readable | No (hyphenated hex) | Yes (numeric ID) |

**When to use UUID:**
- Each service generates IDs independently without any shared state
- You need IDs in URLs (they don't reveal order count)
- Merging databases from different sources (guaranteed no collision)

**When to use Snowflake:**
- High write rate where B-tree index fragmentation matters
- You need to sort by creation time without storing a separate timestamp
- 64-bit IDs fit better in integer columns

---

## ULID — The Modern Alternative

ULID (Universally Unique Lexicographically Sortable Identifier) combines the best of both:

```
ULID format: 01ARZ3NDEKTSV4RRFFQ69G5FAV
             ├── 10 chars (48-bit timestamp) ─── 16 chars (80-bit random) ┤
             └── Crockford Base32 encoding (URL-safe, case-insensitive)
```

- Sortable lexicographically (dictionary order = chronological order)
- URL-safe string (no hyphens, no special characters)
- 128-bit (same as UUID) but sortable
- No coordination needed

---

## Interview Talking Points

- "Auto-increment IDs don't work across shards — Shard 1 generates ID 1, Shard 2 generates ID 1, collision. I'd use Snowflake IDs."
- "Snowflake gives us time-sortable 64-bit IDs without a centralized counter. Each app server generates IDs independently after receiving a machine ID from Zookeeper at startup."
- "UUID v4 for user-facing IDs in URLs — they don't reveal business metrics (order count, user count) to competitors."
- "For the database: Snowflake ID as primary key. Sequential inserts avoid B-tree page splits — write performance stays consistent at scale."
