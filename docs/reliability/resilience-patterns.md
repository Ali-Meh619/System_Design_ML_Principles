# Resilience Patterns

## Mandatory Controls

- Timeouts everywhere
- Retries with backoff and jitter
- Circuit breakers
- Bulkheads and isolation pools
- Load shedding under extreme pressure

## Fallback Design

Define degraded responses before outages happen.

Examples:

- stale cached response
- reduced feature mode
- queued async completion

## Incident Readiness

- clear runbooks
- rollback strategy
- ownership and escalation path
