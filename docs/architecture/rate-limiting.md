# Rate Limiting System Design

> Rate limiting is the gatekeeper of every public API. Get it wrong and you either kill your own service or let abusers in. This section covers every algorithm, every architecture, and the design of a distributed rate limiter system at FAANG scale.

---

## Why Rate Limiting Exists

Without rate limiting:
- A single buggy client can send 100K requests/second and take down your service
- Scrapers can exhaust your database with bulk reads
- One user can monopolize shared infrastructure and degrade everyone else's experience
- DDoS attacks succeed trivially

Rate limiting enforces **fairness**: every user gets their fair share of the API.

**The 4 dimensions of rate limiting:**

| Dimension | Example |
|-----------|---------|
| **Per-user** | 100 requests/minute per API key |
| **Per-IP** | 1,000 requests/hour per IP address |
| **Per-endpoint** | POST /login: 5 requests/min (brute-force protection) |
| **Global** | Total API: 1M requests/second system-wide |

---

## Algorithm 1: Token Bucket

**How it works:** Each user has a bucket with capacity `C`. The bucket fills at rate `R` tokens/second. Each request consumes one token. If the bucket is empty, the request is rejected.

**Properties:**
- Allows **bursting** up to capacity `C`
- Smoothly handles traffic spikes
- Most widely used algorithm (Stripe, AWS use token bucket)

```
Bucket state: { tokens: float, last_refill: timestamp }

On each request:
  1. Calculate tokens to add: (now - last_refill) * rate
  2. tokens = min(capacity, tokens + new_tokens)
  3. If tokens >= 1: allow, tokens -= 1
  4. Else: reject with 429
```

**Redis implementation:**
```
-- Lua script (atomic)
local tokens = tonumber(redis.call('GET', key) or capacity)
local last = tonumber(redis.call('GET', key..':ts') or 0)
local now = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local capacity = tonumber(ARGV[3])
local refill = math.min(capacity, tokens + (now - last) * rate)
if refill >= 1 then
  redis.call('SET', key, refill - 1)
  redis.call('SET', key..':ts', now)
  return 1  -- allowed
else
  return 0  -- rejected
end
```

> 💡 **Use Lua scripts for atomicity.** Without a Lua script, a check-then-set operation has a race condition — two concurrent requests both see `tokens = 1` and both proceed.

---

## Algorithm 2: Leaky Bucket

**How it works:** Requests enter a queue (the "bucket"). A worker drains the queue at a fixed rate. If the queue is full, new requests are dropped.

**Properties:**
- Guarantees **smooth output rate** — no bursting
- Great for protecting downstream services from spikes
- Requests can queue (unlike token bucket which instantly rejects)

**When to use:** When you need to protect a downstream service at a guaranteed rate (e.g., sending SMS: max 100/second to Twilio).

| | Token Bucket | Leaky Bucket |
|--|-------------|-------------|
| Burst allowed | Yes | No |
| Memory | Small (counter) | Queue of requests |
| Complexity | Low | Medium |
| Use case | API clients | Downstream protection |

---

## Algorithm 3: Fixed Window Counter

**How it works:** Divide time into fixed windows (e.g., 1-minute windows). Count requests per window. If count exceeds limit, reject.

```
Key: "rate:{user_id}:{window}" where window = floor(now / 60)
INCR key → if result > limit: reject
EXPIRE key 60
```

**Problem: Boundary exploitation!**

A user can make `limit` requests at 0:59 and `limit` requests at 1:01 — that's `2×limit` requests in a 2-second span while never triggering the limit. This is the **sliding window boundary problem**.

---

## Algorithm 4: Sliding Window Log

**How it works:** Store timestamp of every request in a sorted set. Count requests in the last `window` seconds.

```
ZADD user:requests {now} {unique_id}
ZREMRANGEBYSCORE user:requests 0 (now - window)
count = ZCARD user:requests
if count > limit: reject
```

**Properties:**
- **Exactly correct** — no boundary exploits
- Memory-intensive: stores every request timestamp
- Good for: strict per-user limits, low-traffic endpoints

---

## Algorithm 5: Sliding Window Counter (Best Practice)

**How it works:** Approximation that combines fixed window simplicity with sliding accuracy.

```
current_window_count × (time_in_current_window / window_size)
+ previous_window_count × (1 - time_in_current_window / window_size)
```

**Example:** Limit = 100/min. At 0:15 into current minute:
- Previous window: 80 requests
- Current window: 30 requests
- Weighted count = 80 × (45/60) + 30 × (15/60) = 60 + 7.5 = 67.5 → under limit ✅

**Properties:**
- Only 2 counters per user → memory-efficient
- ~99% accurate vs exact sliding window
- Used by Cloudflare at massive scale

---

## Distributed Rate Limiting Architecture

Single-node rate limiting is easy. The hard problem: **how do you rate limit across 100 API servers consistently?**

**Option 1: Central Redis** (most common)

```
API Server 1 ─┐
API Server 2 ─┼──→ [Redis Rate Limiter] → decision
API Server 3 ─┘
```

Each server checks Redis before processing. Redis is the single source of truth.

**Trade-offs:**
- ✅ Consistent across all servers
- ✅ Simple to implement
- ❌ Every request adds a Redis round-trip (~1ms latency)
- ❌ Redis becomes a single point of failure

**Option 2: Redis Cluster with sticky sessions**

Route users to the same API server via consistent hashing in the load balancer. That server maintains local state for that user. Only works if users consistently hit the same server.

**Option 3: Distributed CRDT counters**

Each server maintains local counters that sync asynchronously. Accept slight over-counting in exchange for lower latency. Used by Cloudflare.

**Option 4: Rate limiting at the API Gateway** (recommended)

Put rate limiting in a dedicated layer (Kong, AWS API Gateway, Nginx) before requests reach your application servers. Rate limit state is centralized in the gateway's Redis.

```
Client → [API Gateway with Rate Limiter] → [Application Servers]
                    ↕
              [Redis Cluster]
```

---

## Rate Limiter System Design (Full Architecture)

For the interview question "Design a Rate Limiter service":

### Components

**1. Rate Limit Rules Store (Config DB)**
```
{
  "endpoint": "POST /login",
  "limit": 5,
  "window": "60s",
  "scope": "per-ip",
  "action": "reject"  // or "throttle", "queue"
}
```
Stored in a relational DB, cached in local memory of rate limiter nodes. Rules change infrequently.

**2. Counter Store (Redis)**
- Token bucket or sliding window counter per `(user_id, endpoint, window)`
- Use Redis Cluster for horizontal scaling
- Use Lua scripts for atomicity

**3. Rate Limiter Workers**
- Stateless services that receive requests, check rules, query Redis, return allow/deny
- Deploy as sidecar in every API server, OR as a dedicated gateway layer

**4. Response Headers**
Always return rate limit metadata so clients can self-throttle:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 23
X-RateLimit-Reset: 1698765432  (Unix timestamp when window resets)
Retry-After: 37               (seconds until retry allowed, on 429)
```

**5. Monitoring & Alerting**
- Track: rate of 429 responses per endpoint/user
- Alert on: sudden 10× increase in 429s (indicates abuse or broken client)
- Dashboard: top rate-limited users/IPs

---

## Response Strategies

Not all rate limiting should result in hard rejection:

| Strategy | HTTP Code | Use Case |
|----------|-----------|---------|
| **Hard reject** | 429 Too Many Requests | Public API, protecting resources |
| **Throttle (delay)** | 200 (slow) | Internal services, queued processing |
| **Degrade** | 200 (partial) | Return cached/stale data instead |
| **Queue** | 202 Accepted | Async jobs — process when capacity available |

---

## Handling Edge Cases

**What if Redis is down?**

Two strategies:
1. **Fail open**: allow all requests (availability > correctness). Risky.
2. **Fail closed**: reject all requests (protects downstream). Annoying for users.
3. **Local fallback**: each server maintains local counters if Redis is unreachable. Over-counting is possible.

Most production systems choose **fail open** with alerting, since a brief window of unthrottled traffic is better than a complete outage.

**What about IPv6?**

IPv6 addresses can be enumerated. Rate limit on /64 subnet prefix, not individual IP.

**Distributed denial via spreading?**

Sophisticated attackers use botnets to spread requests across thousands of IPs. Layer-7 signals (user-agent, headers, behavior) are needed — this is where WAFs and bot detection (Cloudflare Bot Management) come in.

---

## Back-of-Envelope

For an API handling 100K requests/second with per-user rate limiting:

| Resource | Calculation | Result |
|----------|------------|--------|
| Redis reads | 100K/sec × 1 lookup | 100K ops/sec |
| Redis memory | 10M users × 32 bytes/counter | ~320 MB |
| Rate limit overhead | 1ms Redis round-trip | +1ms per request |
| Redis cluster nodes | 100K ops/sec ÷ 100K ops/node | 1-2 nodes (add replicas for HA) |

Redis can comfortably handle 500K+ ops/second — a 100K req/sec rate limiter needs just 1–2 Redis nodes.

---

## Interview Cheat Sheet

| Question | Answer |
|----------|--------|
| Best algorithm for APIs? | Sliding window counter (Cloudflare approach) |
| How to handle burst traffic? | Token bucket (allows bursting up to capacity) |
| Where to implement? | API Gateway layer |
| How to prevent race conditions? | Redis Lua scripts (atomic) |
| What if Redis fails? | Fail open + alert |
| Headers to return? | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` |
| How to handle distributed? | Central Redis Cluster with Lua atomics |
