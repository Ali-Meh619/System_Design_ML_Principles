# Consistency and Transactions

## Saga vs Two-Phase Commit

- Saga: eventual consistency using compensating actions
- 2PC: strict atomicity with coordinator overhead and availability cost

## Idempotency Requirement

Retries are unavoidable in distributed systems. Idempotency converts retries from risk into reliability.

## Conflict Resolution

- Last-write-wins (simple, risk of overwrite)
- Version vectors (detect conflicts)
- Domain merge logic (best correctness for collaborative data)

## Interview Tip

For cross-service transactions, explain invariants first, then pick the lightest mechanism that preserves them.
