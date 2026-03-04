# Observability & Monitoring

> You can't fix what you can't see. Every production system needs metrics, logs, and traces — the three pillars of observability.

---

## The Three Pillars of Observability

**Metrics, Logs, Traces**

| Pillar | What it is | Answers | Tools |
|--------|-----------|---------|-------|
| **Metrics** | Numeric measurements over time: request rate, error rate, CPU usage, p99 latency. Aggregated, low cost. | "Is something wrong right now? What's the trend?" | Prometheus, Grafana, Datadog, CloudWatch |
| **Logs** | Timestamped records of discrete events: "User 123 failed login", "Payment processed for order 456". Rich context but expensive at scale. | "What exactly happened? What was the error message?" | ELK Stack (Elasticsearch + Logstash + Kibana), Splunk, CloudWatch Logs |
| **Traces** | End-to-end journey of a single request through all microservices. Each service adds a span with timing and context. | "Why was this specific request slow? Which service was the bottleneck?" | Jaeger, Zipkin, AWS X-Ray, Datadog APM |

> 💡 **Mention this in every design interview:** "I'd add observability: Prometheus for metrics, structured logging to Elasticsearch, and distributed tracing with OpenTelemetry. Alerts on P99 latency, error rate, and saturation metrics. SLOs with error budgets to drive reliability investments." This shows production maturity.

---

## Metrics Deep Dive

**Key metric types:**

| Type | Description | Example |
|------|-------------|---------|
| **Counter** | Monotonically increasing value. Reset on restart. | `http_requests_total{status=200}` |
| **Gauge** | Value that goes up and down. Current state. | `active_connections`, `memory_usage_bytes` |
| **Histogram** | Sample distribution bucketed into ranges. | `http_request_duration_seconds{le="0.1"}` |
| **Summary** | Pre-computed percentiles (less flexible than histogram). | `p50`, `p95`, `p99` latency |

**The Four Golden Signals (Google SRE):**

| Signal | What it measures | Alert threshold |
|--------|----------------|----------------|
| **Latency** | Time to serve requests (P99, P95, P50) | P99 > SLO (e.g., > 200ms) |
| **Traffic** | Requests per second (volume) | Sudden drop (outage) or spike (abuse) |
| **Errors** | Rate of failed requests (5xx, timeouts) | Error rate > 1% |
| **Saturation** | How "full" the service is (CPU, memory, queue depth) | CPU > 80% for >5 min |

---

## Prometheus Architecture

```
Services expose /metrics endpoint (Prometheus format)
        ↓
Prometheus scrapes every 15 seconds (pull model)
        ↓
Stores in time-series database (locally, 15-day default)
        ↓
Grafana queries Prometheus via PromQL
        ↓
Alertmanager evaluates alert rules → PagerDuty/Slack

PromQL example:
rate(http_requests_total{status=~"5.."}[5m]) /
rate(http_requests_total[5m]) > 0.01
→ Alert if 5xx error rate > 1% over last 5 minutes
```

---

## Distributed Tracing

A trace records the full journey of a single request across all microservices:

```
Trace for order checkout:

Span: API Gateway          0ms ─────────────────────────── 450ms
  Span: Auth Service       2ms ─── 15ms
  Span: Order Service      20ms ──────────────── 380ms
    Span: DB Query         25ms ── 40ms  
    Span: Payment Service  50ms ────────────── 300ms
      Span: Payment DB     55ms ──── 90ms
      Span: Fraud Check    100ms ────── 200ms  ← BOTTLENECK
      Span: Card Network   210ms ──── 290ms
    Span: Inventory Service 310ms ── 370ms
  Span: Notification Queue 385ms ── 395ms
```

Every span has:
- `trace_id`: unique ID for the entire request
- `span_id`: unique ID for this operation
- `parent_span_id`: which span triggered this one
- `start_time`, `end_time`: timing
- `tags`: key-value metadata (user_id, order_id, region)
- `logs`: events within the span (errors, retries)

**OpenTelemetry** is the standard for instrumentation — it's vendor-neutral and works with any backend (Jaeger, Zipkin, Datadog, AWS X-Ray).

---

## Structured Logging

Logs should be **structured** (JSON, not free text) for efficient querying:

```json
// Bad (unstructured):
"[2024-01-15 10:30:45] User login failed for user@example.com from 192.168.1.1"

// Good (structured):
{
  "timestamp": "2024-01-15T10:30:45Z",
  "level": "WARN",
  "service": "auth-service",
  "event": "login_failed",
  "user_email": "user@example.com",
  "ip_address": "192.168.1.1",
  "reason": "invalid_password",
  "attempt_count": 3,
  "trace_id": "abc123def456"
}
```

**Log levels:**
| Level | Use for |
|-------|---------|
| `DEBUG` | Detailed debugging info (disabled in production) |
| `INFO` | Normal business events (user created, order placed) |
| `WARN` | Recoverable issues (retry succeeded, rate limit hit) |
| `ERROR` | Failures requiring investigation (DB connection failed) |
| `FATAL` | Service cannot continue (corrupted state, missing config) |

---

## Alerting Best Practices

**Alert design rules:**
1. **Alert on symptoms, not causes** — alert on "users can't log in", not "CPU is high"
2. **Alert on SLO breach** — if your SLO is 99.9% availability, alert when error rate threatens that budget
3. **Every alert must be actionable** — if you can't fix it, don't page someone at 3am
4. **Alert fatigue** — too many alerts → engineers ignore them → real incidents missed

**Error budgets (Google SRE):**
```
SLO: 99.9% availability = 0.1% error budget
Monthly error budget: 43.8 minutes of downtime
Current month error rate: 0.05% → 50% of budget consumed

Alert when: budget consumption rate means you'll exceed the SLO before month end
Action: slow down risky deployments, focus on reliability work
```

---

## SLI, SLO, SLA Definitions

| Term | Definition | Example |
|------|-----------|---------|
| **SLI** (Service Level Indicator) | Metric measuring service quality | P99 latency = 85ms |
| **SLO** (Service Level Objective) | Internal target for SLI | P99 latency < 200ms |
| **SLA** (Service Level Agreement) | External contract with customers | "We guarantee 99.9% uptime; credit if breached" |

---

## Interview Talking Points

- "I'd add the three pillars: Prometheus + Grafana for metrics, structured JSON logs to Elasticsearch, Jaeger for distributed tracing. OpenTelemetry SDK in each service — vendor-neutral."
- "Alerts on the Four Golden Signals: P99 latency, traffic anomalies, error rate, and saturation. Every alert is actionable — if there's nothing to do, it's not a page."
- "Error budgets drive the reliability vs. velocity trade-off. If we've used 80% of this month's error budget, we slow down risky deployments until the month resets."
- "The trace_id propagated through every service call means I can go from a user complaint ('checkout is slow') to the exact slow span in under 30 seconds."
