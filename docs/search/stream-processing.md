# Stream Processing & Top-K Systems

> Real-time analytics: trending topics (Twitter), top songs (Spotify), most watched (YouTube). Processing billions of events per day to answer "what's popular right now?"

---

## The Top-K Problem

Find the K most frequent items in a stream. Naive approach: count all items in a hash map, sort descending, return top K. Problem: at billions of events per second with millions of unique items (hashtags, song IDs), the hash map requires terabytes of memory. You need a space-efficient approximation.

**Top-K Algorithms**

| Algorithm | How it works | Memory | Accuracy |
|-----------|-------------|--------|---------|
| **Count-Min Sketch** | A grid of counters with multiple hash functions. Increment D cells per item. Estimate count by taking minimum across rows. Width × depth = memory. | Tiny — kilobytes for millions of items | Approximate. Over-counts (never under-counts). Error bounded by (e/width). |
| **Heavy Hitters (Misra-Gries)** | Maintain K tracked items with counts. On new item: if in list, increment. If list has room, add. Otherwise, decrement all counts and remove zeros. | O(K) — only tracks K items | Guaranteed to find all items with frequency > 1/(K+1) |
| **Min-Heap + HashMap** | HashMap for counts, min-heap of size K for top-K tracking. Update count → if now > heap minimum, swap in. | O(K + unique_items) | Exact. Expensive for huge unique item space. |

---

## Stream Processing Architectures

Stream processing means analyzing data in motion — not waiting for all data to arrive before computing. You process each event as it flows through, maintaining running aggregates.

**Lambda vs Kappa Architecture**

| Architecture | How it works | Pros | Cons |
|-------------|-------------|------|------|
| **Lambda Architecture** | Two parallel pipelines: (1) Batch layer (Spark, Hadoop) processes all historical data for accuracy. (2) Speed layer (Kafka Streams, Flink) processes real-time data for freshness. Query merges both results. | Highly accurate historical data. Low-latency real-time view. | Two codebases to maintain. Results can diverge. Complex operational overhead. |
| **Kappa Architecture** | One pipeline using a streaming system (Flink, Kafka Streams). Replay historical Kafka log to recompute historical views. Stream is the single source of truth. | Single codebase. Simpler. Easier to maintain correctness. | Reprocessing is expensive. Requires long Kafka retention. |

**Stream Processing Engines**

| Service | Best For | Key Features |
|---------|----------|--------------|
| **Apache Flink** | Stateful stream processing | Exactly-once semantics. Event-time processing with watermarks. Stateful operators for aggregations. Used by Uber, Alibaba, Netflix for real-time pipelines at massive scale. |
| **Kafka Streams** | Lightweight stream processing | Library (not a separate cluster). Runs inside your application. Built on Kafka. Great for simpler streaming transformations and aggregations. |
| **Apache Spark Streaming** | Micro-batch processing | Processes data in small batches (e.g., every 1 second) rather than event-by-event. Higher throughput, slightly higher latency. Good bridge between batch and streaming. |

---

## Windowing — Time-Based Aggregations

Stream processing aggregations always operate over a time window — "top songs in the last 24 hours." There are three fundamental window types.

**Window Types**

| Window | How it works | Example |
|--------|-------------|---------|
| **Tumbling Window** | Fixed, non-overlapping time buckets. Every event belongs to exactly one window. | Count events per hour. At 2:00PM, start fresh; at 3:00PM, emit result and reset. |
| **Sliding Window** | Fixed size, moves by a step interval. Windows overlap — an event can belong to multiple windows. | "Top songs in the last 1 hour" updated every minute. Precise but computationally expensive. |
| **Session Window** | Groups events by inactivity gap. A session ends when no events arrive for X seconds. | User session analytics. Each user's activity grouped until 30 minutes of inactivity. |

---

## Twitter Trending Topics Architecture

End-to-end design for "Top 10 trending hashtags right now":

```
All tweets → Kafka topic "tweets"
                ↓
    Flink job (stateful stream processor)
    - 5-minute tumbling window
    - Count occurrences of each hashtag
    - Maintain top-K using Count-Min Sketch
    - Emit top-100 hashtags every 5 minutes
                ↓
    Redis sorted set "trending:global"
    ZADD trending:global 50341 "#Python"
    ZADD trending:global 43211 "#WorldCup"
    ZREVRANGE trending:global 0 9 → top 10
                ↓
    API: GET /trending → read Redis sorted set
    (sub-millisecond read, updated every 5 min)
```

**For personalized trending (Twitter's actual approach):**
- Separate trending scores per geographic region (geohash-based)
- Per-user topic interests overlay (boost topics you follow)
- Trending detection = frequency increase rate, not just absolute count (a new topic with 10x growth is "trending" even if smaller than established topics)

---

## Real-time Analytics Dashboard Architecture

Design for a product analytics dashboard ("events per minute, error rate, p99 latency"):

1. **Instrumentation:** Each service emits events via StatsD/OpenTelemetry → Kafka
2. **Stream processing:** Flink job aggregates per-minute, per-service: sum, count, percentiles
3. **Time-series storage:** InfluxDB or Cassandra (partition by service+metric, cluster by timestamp)
4. **Downsampling:** Raw 1-second data kept 24 hours. 1-minute aggregates kept 30 days. 1-hour aggregates kept 1 year.
5. **Query:** Grafana queries InfluxDB via PromQL/Flux. Renders charts.
6. **Alerting:** Prometheus rule evaluator checks thresholds every 30s. PagerDuty alert if P99 > SLO threshold.

---

## Event-Time vs Processing-Time

A critical stream processing concept:

| Concept | Definition | Problem |
|---------|-----------|---------|
| **Processing time** | When the event arrives at the stream processor | Mobile events arrive late (phone was offline for 10 minutes) |
| **Event time** | When the event actually occurred (timestamp in event) | Correct but requires handling out-of-order events |
| **Watermark** | A timestamp asserting "no more events older than T will arrive" | Allows stream processor to close windows correctly despite late arrivals |

```
Example: User played a song on mobile at 3:00PM but phone was offline
         Event arrives at server at 3:15PM

Processing-time window (3:10-3:20): includes the event (wrong — it happened before)
Event-time window (2:55-3:05): includes the event (correct)

Flink watermark: "I've seen events up to 3:12PM, 
                  events older than 3:02PM (10min delay) won't arrive"
→ Close the 3:00-3:05 window at 3:15PM (not 3:05PM)
```

---

## Interview Talking Points

- "For trending hashtags: Kafka + Flink with 5-minute tumbling windows. Count-Min Sketch for memory-efficient frequency counting. Redis sorted set for serving the results in <1ms."
- "Lambda architecture is dead for new systems. Kappa is simpler: one Flink job for both real-time AND historical reprocessing (replay Kafka log to backfill)."
- "Event-time processing + watermarks ensures mobile events that arrive 10 minutes late still count in the right window. Without this, offline users' events would skew real-time counts."
- "Downsampling: 1-second raw data for 24 hours, then aggregate to 1-minute for 30 days, 1-hour for 1 year. Reduces storage 3600× without losing long-term trend visibility."
