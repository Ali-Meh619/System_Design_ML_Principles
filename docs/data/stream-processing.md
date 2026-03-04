# Stream Processing & Top-K Systems

Real-time analytics: trending topics (Twitter), top songs (Spotify), most watched (YouTube). Processing billions of events per day to answer "what's popular right now?"

---

## The Top-K Problem

**Problem:** Find the K most frequent items in a stream (top hashtags, top songs, trending videos).

**Naive approach:** Count all items in a hash map, sort descending, return top K.

**Problem at scale:** At billions of events/second with millions of unique items, the hash map requires terabytes of memory. You need a **space-efficient approximation**.

### Top-K Algorithms

| Algorithm | How it works | Memory | Accuracy |
|-----------|-------------|--------|----------|
| **Count-Min Sketch** | A grid of counters with multiple hash functions. Increment D cells per item. Estimate by taking minimum across rows. | Tiny — kilobytes for millions of items | Approximate. Over-counts (never under-counts). Error bounded by ε/width. |
| **Heavy Hitters (Misra-Gries)** | Maintain K tracked items with counts. On new item: if in list, increment. If list not full, add. Otherwise decrement all and remove zeros. | O(K) — only tracks K items | Guaranteed to find all items with frequency > 1/(K+1) |
| **Min-Heap + HashMap** | HashMap for counts, min-heap of size K. Update count → if > heap minimum, swap in. | O(K + unique items) | Exact but expensive for large unique item space |

### Production Pattern for Trending Topics
```
High-volume stream → Kafka
   ↓
Count-Min Sketch workers (many parallel, partition by item)
   ↓ aggregate every 10 seconds
Min-Heap (keep top 1000)
   ↓
Redis Sorted Set (ZADD item score, ZREVRANGE for top K)
   ↓ served to clients
```

> **Interview insight:** Redis Sorted Sets (`ZADD`, `ZINCRBY`, `ZREVRANGE`) are built for exactly this use case. `ZINCRBY hashtag 1 "#systemdesign"` is atomic. `ZREVRANGE trending 0 9` returns the top 10 in O(log N + K).

---

## Stream Processing Architectures

Stream processing means analyzing data **in motion** — not waiting for all data to arrive before computing. Each event is processed as it flows through, maintaining running aggregates.

### Lambda Architecture
Two parallel pipelines:
1. **Batch layer** (Spark, Hadoop) — processes all historical data for high accuracy. Runs every few hours.
2. **Speed layer** (Kafka Streams, Flink) — processes real-time data for freshness. Lag measured in seconds.
3. **Serving layer** merges both results for queries.

| Pros | Cons |
|------|------|
| Highly accurate historical data | Two codebases to maintain |
| Low-latency real-time view | Results can diverge |
| Fault-tolerant (batch corrects real-time errors) | Complex operational overhead |

### Kappa Architecture
Single pipeline using a streaming system (Flink, Kafka Streams). Replay historical Kafka log to recompute historical views. The stream is the single source of truth.

| Pros | Cons |
|------|------|
| Single codebase | Reprocessing is expensive |
| Simpler to maintain correctness | Requires long Kafka retention |
| Easier to reason about | Stream processing at scale is complex |

**Recommendation:** Start with Kappa. The simplicity outweighs the cons for most systems.

### Stream Processing Engines

| Engine | Style | Best for |
|--------|-------|----------|
| **Apache Flink** | Event-by-event, stateful | Exactly-once semantics. Stateful aggregations. Production-proven (Uber, Alibaba, Netflix). |
| **Kafka Streams** | Library (not a cluster) | Simple transformations/aggregations. Runs inside your app. Built on Kafka. |
| **Apache Spark Streaming** | Micro-batch | Higher throughput. Good bridge between batch and streaming. Familiarity if team knows Spark. |

---

## Windowing — Time-Based Aggregations

Stream aggregations always operate over a time window — "top songs in the last 24 hours." Three fundamental window types:

| Window | How it works | Example |
|--------|-------------|---------|
| **Tumbling Window** | Fixed, non-overlapping time buckets. Each event belongs to exactly one window. | Count events per hour. At 2:00 PM, start fresh; at 3:00 PM emit result and reset. |
| **Sliding Window** | Fixed size, moves by a step interval. Windows overlap — an event can belong to multiple windows. | "Top songs in the last 1 hour" updated every minute. Precise but CPU-intensive. |
| **Session Window** | Groups events by inactivity gap. A session ends when no events arrive for X seconds. | User session analytics. Group activity until 30 minutes of inactivity. |

### Event Time vs Processing Time
- **Event time:** When the event actually occurred (timestamped by the source).
- **Processing time:** When the event arrives at the stream processor.

These differ due to network delays and retries. Use **event time** for accurate analytics. Stream processors handle late-arriving events with **watermarks** — a timestamp below which no more events are expected. Events arriving after the watermark are either dropped or handled by a late-data policy.

---

## Interview Answer Sketch

> "For trending topics, I'd use Kafka to ingest all events. Flink jobs consume from Kafka, maintaining Count-Min Sketch counters partitioned by topic shard. Every 10 seconds, each worker pushes its top-K to a Redis Sorted Set using `ZINCRBY`. The API reads from Redis with `ZREVRANGE trending 0 49` for the top 50. This gives sub-second freshness with O(1) read latency. For hourly/daily trending (accurate counts), a separate Spark batch job runs on the full Kafka log."
