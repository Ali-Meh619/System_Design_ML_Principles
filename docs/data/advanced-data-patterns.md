# Advanced Data Patterns

## CQRS

Separate write and read models when read patterns diverge significantly from transactional write models.

## Event Sourcing

Persist immutable events as source of truth and materialize query views asynchronously.

## Materialized Views

Precompute heavy read queries to hit latency targets.

## ETL vs ELT

- ETL: transform before loading into warehouse
- ELT: load raw first, transform in data platform

## Hot Partition Mitigation

- Better partition key design
- Write sharding/salting
- Adaptive load balancing

## Backfill Strategy

- Idempotent jobs
- Checkpointing
- Rate limiting to avoid production impact
