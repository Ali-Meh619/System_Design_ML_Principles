# Queues and Streaming

## When to Use Queues

Use queues to decouple producers from consumers when the consumer may be slow, intermittent, or bursty.

## Queue vs Log

- Queue: task distribution and worker consumption
- Event log: durable ordered stream for many independent consumers

## Delivery Semantics

- At-most-once: possible loss, no duplicates
- At-least-once: no loss, duplicates possible
- Exactly-once: expensive and constrained, often approximated

## Reliability Patterns

- Idempotency key on write operations
- Dead-letter queue for poison messages
- Retry policy with bounded attempts
- Outbox pattern for reliable event publishing from DB state

## Operational Metrics

- Consumer lag
- Retry volume
- DLQ growth rate
- End-to-end event latency
