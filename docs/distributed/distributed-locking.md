# Distributed Locking

## Why Local Locks Fail

Process-level locks do not coordinate across instances.

## Lock Requirements

- Lease timeout
- Owner identity
- Safe release semantics
- Fencing token for stale lock protection

## Common Strategy

Use Redis lease-based locking for coarse-grained coordination and fencing tokens for correctness.

## Avoid Locking When Possible

Prefer idempotent operations, partition ownership, or compare-and-set semantics before introducing distributed locks.
