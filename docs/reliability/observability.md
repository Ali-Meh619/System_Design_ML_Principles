# Observability

## Three Signals

- Metrics: trends and alerting
- Logs: detailed event context
- Traces: request path across services

## Minimum Baseline

- request rate, error rate, latency (RED)
- saturation indicators (CPU, memory, queue lag)
- distributed trace propagation
- high-cardinality safe logging policy

## Alert Quality

Alerts should be actionable, deduplicated, and mapped to SLO impact.

## Post-Incident Data

Capture timeline, impact, trigger, contributing factors, and prevention actions.
