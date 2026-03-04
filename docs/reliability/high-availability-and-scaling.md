# High Availability and Scaling

## HA Patterns

- Active-passive: simpler failover
- Active-active: better regional fault tolerance

## Auto Scaling Inputs

- CPU and memory
- queue depth
- request latency
- custom business metrics

## Multi-Region Strategy

- read local, write centralized (simpler)
- regional writes with conflict resolution (complex)

## Reliability Targets

Define RTO and RPO per service and tie backup/failover tests to those targets.
