# Database Internals

## B-tree vs LSM-tree

- B-tree: strong read latency and range query behavior
- LSM-tree: high write throughput with compaction trade-offs

## Indexing Reality

Indexes speed reads but increase write amplification and storage cost.

## Replication Choices

- Leader-follower for simple writes
- Multi-leader for geo write locality with conflict complexity
- Quorum-based systems for tunable consistency

## Isolation Levels

- Read committed
- Repeatable read
- Serializable

Choose based on anomaly tolerance, not habit.

## CDC Benefit

CDC enables safe propagation to search indexes, analytics, and cache warmers without dual writes.
