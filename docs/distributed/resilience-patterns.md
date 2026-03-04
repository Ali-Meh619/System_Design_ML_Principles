# Resilience Patterns: Circuit Breakers, Retries, Timeouts

> Distributed systems fail. These patterns are how you make services survive the failures of their dependencies. Every production microservice must implement all of them.

---

## Timeouts — The Most Important Single Rule

Every single network call must have a **timeout**. Without a timeout, a slow or hanging dependency will cause your threads to pile up waiting indefinitely, eventually exhausting your thread pool and crashing your service — even though it's not the one that's actually broken. This is how cascade failures start. Rule: set timeouts at **every level** — database queries, HTTP calls to other services, cache lookups, external API calls.

> 💡 **How to set timeout values:** Timeout = P99 latency of the dependency × 2 (safety margin). If your payment service normally responds in 80ms at P99, set timeout to 160ms. If you want to retry once, set per-attempt timeout to 80ms and total timeout to 200ms. Never set timeouts to "infinity" — this is a latent ticking time bomb.

---

## Retries — With Exponential Backoff and Jitter

Transient failures (brief network glitches, momentary overload) are common in distributed systems. **Retries** transparently recover from these. But naive retries — immediately retrying at maximum rate — can worsen an already-struggling service (the **thundering herd on failure** problem: 10,000 clients all retry simultaneously, creating 10× load).

The solution: **exponential backoff with jitter**. Wait 2^attempt seconds, plus a random jitter. Jitter spreads retries across time, preventing the synchronized retry storm.

```
Retry strategy: exponential backoff + jitter

Attempt 1: wait 0 seconds (immediate)
Attempt 2: wait 2^1 + random(0, 1) = ~2-3 seconds
Attempt 3: wait 2^2 + random(0, 2) = ~4-6 seconds  
Attempt 4: wait 2^3 + random(0, 4) = ~8-12 seconds
Max attempts: 4. Max wait: 30 seconds (cap the backoff).

Python:
import random, time
def retry_with_backoff(fn, max_attempts=4, base_delay=1.0):
    for attempt in range(max_attempts):
        try:
            return fn()
        except TransientError:
            if attempt == max_attempts - 1:
                raise
            delay = (2 ** attempt) * base_delay + random.uniform(0, base_delay)
            time.sleep(min(delay, 30.0))
```

> ⚠️ **Only retry idempotent operations.** Never blindly retry non-idempotent calls. "Place order" retried 3 times = 3 orders placed. Only retry reads and idempotent writes (those with idempotency keys). For non-idempotent operations, fail fast and surface the error to the caller.

---

## Circuit Breaker — Automatic Failure Isolation

A **circuit breaker** wraps calls to a dependency and automatically stops making calls when too many fail, giving the dependency time to recover. Named after an electrical circuit breaker that cuts power when wiring is overloaded.

**Circuit Breaker States**

| State | Behavior | Transition |
|-------|---------|-----------|
| **CLOSED** (normal) | All requests pass through. Monitors failure rate over rolling window. | → OPEN when failure rate exceeds threshold (e.g., 50% failures in last 10 seconds) |
| **OPEN** (tripped) | All requests immediately fail-fast without calling the dependency. Returns cached/fallback response. | → HALF-OPEN after reset timeout (e.g., 30 seconds) |
| **HALF-OPEN** (testing) | Allows one trial request. If it succeeds, circuit resets to CLOSED. If it fails, back to OPEN. | → CLOSED on success, OPEN on failure |

Implementation: Netflix's **Hystrix** library (Java) and its successor **Resilience4j** are the standard. In Python, use tenacity or a custom implementation. Cloud service meshes (Istio, Linkerd) can implement circuit breaking at the network layer — no code changes needed in the application.

---

## Fallbacks — What to Do When It Fails

A **fallback** is the behavior your service exhibits when a dependency is unavailable. The best fallback depends on what the dependency provides.

**Fallback Strategies**

| Strategy | How it works | Example |
|----------|-------------|---------|
| **Return cached value** | Serve stale cached data rather than failing. TTL on the stale data to bound how old it can be. | Recommendation service down → serve yesterday's personalized list from cache |
| **Return default/empty** | Return an empty list or default values. User sees degraded but functional UI. | Search ranking service down → return results in chronological order |
| **Fail gracefully** | Show a user-friendly message. The rest of the page/app works normally. | Comments service down → "Comments temporarily unavailable" banner; rest of article loads fine |
| **Queue for later** | Accept the request and process it when the dependency recovers. | Email service down → queue emails in SQS; send when email service recovers |

> 💡 **Bulkhead Pattern — Prevent One Slow Service from Drowning All Resources:** Use separate thread pools (bulkheads) for different downstream dependencies. If the Payment Service gets slow and consumes all 100 threads, your User Service calls (using a different pool) are unaffected. Named after ship bulkheads: if one compartment floods, others stay dry. Hystrix/Resilience4j implement this via thread pool isolation per dependency.

---

## Backpressure — Don't Overwhelm the Consumer

When a producer sends data faster than a consumer can process it, the system will eventually crash (Out Of Memory). **Backpressure** is the mechanism where the consumer signals "Stop! I'm full" to the producer. In synchronous systems (HTTP), this is natural (client waits for server). In asynchronous systems (queues, streams), it must be explicit (e.g., TCP flow control window, Reactive Streams `request(n)`).

**How to implement backpressure:**
- **HTTP:** Server responds with `503 Service Unavailable` when overloaded. Client should not retry immediately (exponential backoff).
- **Queue-based:** Consumer processes at its own rate, pulling from queue. Queue depth is the backpressure signal — if it grows, add more consumers or throttle producers.
- **Kafka:** Consumer tracks its own offset. If processing is slow, it just reads later. Producer throughput is controlled by producer-side rate limiting.
- **TCP:** Flow control window naturally prevents the sender from flooding the receiver.

---

## Load Shedding — Survival Mode

When a service is overloaded (CPU at 100%), it gets slower, causing queues to fill up, latency to spike, and eventually crashes. **Load shedding** is the deliberate decision to drop low-priority requests to save the service. Instead of trying to serve 110% load and failing 100% of it, serve 100% load and drop the extra 10% immediately (HTTP 503). Prioritize critical traffic (health checks, login, payment) over non-critical (recommendations, analytics).

**Priority-based load shedding:**
```
Request priority classes:
1. Critical (always serve): health checks, auth, payment
2. High: user-facing reads (feed, profile)
3. Medium: background sync, notifications
4. Low: analytics, recommendations, image resizing

Under load: drop Low first, then Medium, then High.
Never drop Critical.
```

---

## Resilience Patterns Combined

A production microservice should have all of these:

```
Client Request
    ↓
Rate Limiter (reject abusive traffic)
    ↓
Timeout (per-call limit: 200ms)
    ↓
Circuit Breaker (stop if >50% failing)
    ↓
Retry (with backoff+jitter, 3 attempts)
    ↓
Bulkhead (thread pool: 20 threads for this dependency)
    ↓
Fallback (return stale cache if all else fails)
    ↓
Downstream Service
```

---

## Interview Talking Points

- "Every service-to-service call has a 200ms timeout. Without it, a slow payment service would cause thread exhaustion in the order service — cascade failure."
- "Circuit breaker in OPEN state returns cached pricing data. Users see prices that are 5 minutes old rather than an error. Acceptable trade-off."
- "Retries with exponential backoff and jitter. Only on idempotent operations. Non-idempotent calls (like charge payment) fail fast — no retry without idempotency key."
- "Bulkhead: payment API gets its own 20-thread pool. Search API gets 50 threads. Payment degradation can't affect search service."
