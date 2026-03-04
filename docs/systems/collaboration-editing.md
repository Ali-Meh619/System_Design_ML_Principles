# Collaboration Editing

## Core Challenge

Multiple users editing same document concurrently without data loss.

## OT vs CRDT

- OT: transformation logic around operation order
- CRDT: conflict-free merge by design

## Practical Architecture

- operation log
- presence service
- snapshot plus incremental compaction
- durable history for replay and recovery

## Interview Focus

Discuss conflict semantics, ordering guarantees, and offline reconciliation.
