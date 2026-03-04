# Message Queues & Event Streaming

> Queues decouple services, absorb traffic spikes, enable retry, and make systems resilient. Mastering when and how to use them is essential for any large-scale design.

---

## Why Queues Exist

Imagine your video upload service needs to: encode the video in 5 formats, generate thumbnails, extract subtitles, notify followers, and update the search index — all when a user uploads a video. If you do all this synchronously, the user waits for everything to finish. If any step fails, everything fails. If you suddenly get 10,000 simultaneous uploads, all steps run simultaneously and your servers die.

A **message queue** solves all three problems. The upload API immediately responds "upload received!" and drops a message onto a queue. Background workers then pick up that message and process each step independently and asynchronously. Benefits:

1. **Decoupling** — producer and consumer evolve independently.
2. **Traffic smoothing** — burst of uploads fills the queue; workers process at sustainable rate.
3. **Fault isolation** — if subtitle extraction fails, video encoding still completes.
4. **Retries** — failed tasks are retried automatically.

---

## Message Queue vs Event Log (Kafka)

There are two fundamentally different models. Understanding the difference is a common interview differentiator.

**Queue vs Event Log Comparison**

| Aspect | Message Queue (SQS, RabbitMQ) | Event Log (Kafka, Kinesis) |
|--------|-------------------------------|---------------------------|
| Message storage | Deleted after consumption. Fire-and-forget. | Stored on disk for configurable retention (days/months). Consumers track their own offset. |
| Consumers | Competing consumers: each message is processed by exactly one consumer. Good for work queues. | Consumer groups: each group gets all messages. Multiple independent consumers can read the same stream. |
| Replay | No — once consumed and acknowledged, message is gone. | Yes — consumers can reset their offset to replay history. Critical for event sourcing. |
| Ordering | Best-effort. SQS FIFO provides ordering within a message group. | Strict ordering within a partition. Critical for event-driven state machines. |
| Scale | Millions of messages/second. Simple scaling. | Billions of events/day. Kafka handles petabytes. Used by LinkedIn, Netflix, Airbnb. |
| Use when | Task distribution, work queues, fan-out notifications | Event sourcing, real-time analytics, audit logs, multiple consumers of same event |

---

## Kafka Deep Dive

**Kafka** organizes messages into **topics** (named channels, like "user-events" or "payment-completed"). Each topic is split into **partitions** — parallel streams of messages. This parallelism is the key to Kafka's massive throughput. Partitions are distributed across multiple **brokers** (Kafka servers). Within a partition, messages have strictly ordered offsets (sequence numbers). A **consumer group** is a team of workers that collectively process all partitions of a topic — each partition is assigned to exactly one worker at a time.

```
Topic: "video-uploads"
  Partition 0: [offset 0: upload_A] [offset 1: upload_B] [offset 2: upload_C]
  Partition 1: [offset 0: upload_D] [offset 1: upload_E]
  Partition 2: [offset 0: upload_F] [offset 1: upload_G]

Consumer Group "encoding-workers" (3 workers):
  Worker 1 → reads Partition 0
  Worker 2 → reads Partition 1
  Worker 3 → reads Partition 2
  
  → All 3 process uploads in parallel
  → If Worker 2 crashes, Partition 1 is reassigned to Worker 1 or 3 (rebalance)
```

**Kafka Partition Design Rules:**
- The **partition key** determines which partition a message goes to. Messages with the same key always go to the same partition (ordered delivery per entity).
- Partition count = max parallelism. 10 partitions = max 10 workers in the same consumer group.
- **Don't use too few partitions** — you can't reduce partitions without recreating the topic.
- Typical production setup: 3–10× expected peak consumers (headroom for scaling).

---

## Delivery Guarantees

**The Three Delivery Semantics**

| Guarantee | What it means | Risk | When to use |
|-----------|-------------|------|-------------|
| **At-most-once** | Message delivered 0 or 1 time. Acknowledged before processing. | Can lose messages if consumer crashes | Metrics/logging where losing some data is OK |
| **At-least-once** | Message delivered 1+ times. Acknowledged after processing. Re-delivered on failure. | Can deliver duplicates — consumers must be idempotent | Most business logic. Use idempotency keys to handle duplicates. |
| **Exactly-once** | Message delivered exactly once, even on failures. | Highest overhead. Complex to implement. | Financial transactions, inventory updates — where duplicates cause real harm. |

> 💡 **Interview rule of thumb:** Default to **at-least-once** and design idempotent consumers. Exactly-once is technically possible with Kafka transactions but expensive. Most real systems use at-least-once + idempotency keys.

---

## Dead Letter Queues (DLQ)

A **Dead Letter Queue** is a special queue where messages go when they've failed processing a configurable number of times (e.g., 5 retries). Instead of losing the message or blocking the entire queue, failed messages are isolated for manual inspection, debugging, and potential replay. Every production message queue system should have a DLQ. Without it, a single poison message (one that always fails processing) can clog your queue indefinitely.

**DLQ pattern:**
```
Normal Queue → Worker fails 5 times → Message → Dead Letter Queue
                                                   ↓
                                         Alert engineer
                                         Inspect failure cause
                                         Fix bug → Replay from DLQ
```

---

## Stream Processing Engines

| Service | Best For | Key Features |
|---------|----------|--------------|
| **Apache Flink** | Stateful stream processing | Exactly-once semantics. Event-time processing with watermarks. Stateful operators for aggregations. Used by Uber, Alibaba, Netflix. |
| **Kafka Streams** | Lightweight stream processing | Library (not a separate cluster). Runs inside your application. Built on Kafka. Great for simpler streaming transformations and aggregations. |
| **Apache Spark Streaming** | Micro-batch processing | Processes data in small batches (e.g., every 1 second). Higher throughput, slightly higher latency. Good bridge between batch and streaming. |
| **AWS Kinesis** | Managed, AWS-native | Fully managed Kafka-like service on AWS. Simpler to operate, less configurable. |
| **Google Pub/Sub** | Managed, GCP-native | Fully managed, global, auto-scaling. Used with Dataflow for stream processing. |

---

## Queue Technology Comparison

| Technology | Type | Retention | Use Case |
|-----------|------|-----------|---------|
| **Apache Kafka** | Event log | Days to months (configurable) | Event streaming, analytics, replay |
| **AWS SQS** | Queue | Up to 14 days | Task distribution, async workers |
| **AWS SNS** | Pub/sub | No retention (push only) | Fan-out notifications |
| **RabbitMQ** | Queue | Until consumed (or TTL) | Flexible routing, priority queues |
| **Redis Streams** | Event log (lightweight) | Configurable | Lightweight Kafka alternative in-process |

---

## When to Use Which

**Use a message queue (SQS/RabbitMQ) when:**
- You need work distribution to a pool of workers
- Each task should be processed exactly once by one worker
- You don't need replay or multiple consumer groups
- Example: Email sending, image resize jobs, payment processing

**Use an event log (Kafka/Kinesis) when:**
- Multiple different systems need to react to the same event
- You need replay for bug fixes or new consumer backfill
- You need ordering guarantees within an entity
- Example: User activity stream consumed by analytics, recommendation engine, and audit log simultaneously

---

## Interview Talking Points

- "I'd use Kafka here because both the analytics pipeline AND the notification service need to consume the same order-created events. With SQS, only one consumer would get each message."
- "For the video encoding pipeline: upload API drops a message to SQS, 5 different worker pools (encoding, thumbnail, subtitle, search, notification) each have their own queue fed by SNS fan-out."
- "Dead Letter Queue is mandatory — without it, one malformed video upload could wedge the entire encoding pipeline."
- "I'd use at-least-once delivery and make all my workers idempotent by checking 'have I already processed this upload_id?' before doing work."
