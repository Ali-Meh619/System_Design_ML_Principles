# Distributed Fundamentals

## CAP Intuition

During partitions, systems choose between stronger consistency and higher availability.

## Consistency Models

- Strong consistency
- Eventual consistency
- Causal consistency

Model consistency per workflow instead of globally.

## Consistent Hashing

Distributes keys with minimal reshuffling during node changes.

## Quorum Basics

With replication factor `N`, choose read quorum `R` and write quorum `W`.
When `R + W > N`, read/write overlap improves consistency.

## Clock and Ordering Concerns

Use logical clocks or vector clocks to reason about concurrent updates across regions.
