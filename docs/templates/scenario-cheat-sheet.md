# Scenario Cheat Sheet

## Read-Heavy

Start with CDN, multi-layer cache, and async invalidation.

## Write-Heavy Ingestion

Partition writes, batch persistence, and stream processing.

## Low-Latency Realtime

Use persistent channels, in-memory state, and strict timeout budgets.

## Global Consistency

Define invariants, use quorum/transactions where mandatory, and isolate slow paths.

## Search and Discovery

Dedicated index, async indexing, and relevance metrics.

## Collaboration

Operation log, OT/CRDT merge strategy, and offline conflict handling.
