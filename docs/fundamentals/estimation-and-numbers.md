# Estimation and Numbers

## Core Formulae

- QPS: `DAU * actions_per_user_per_day / 86400`
- Storage/day: `writes_per_day * bytes_per_write`
- Network egress/day: `responses_per_day * avg_response_size`

## Practical Latency Ladder

- L1 cache: sub-nanosecond
- RAM: around 100 ns
- Redis/in-memory read: around 0.1 ms
- SSD random read: around 1 ms
- Same-region network: 1 to 5 ms
- Database query: 5 to 50 ms
- Cross-region network: 100+ ms

## Interview Rule

Never put a high-latency dependency in the critical path without a cache, timeout, and fallback.

## Capacity Planning Checklist

- Peak QPS multiplier (at least 3x average)
- Burst handling strategy
- Storage growth for 12 to 36 months
- Compaction/retention policy
- Rebuild/backfill time estimates

## Common Pitfall

Showing exact arithmetic but no implication. Always conclude with architecture impact, such as cache necessity, partitioning, or async processing.
