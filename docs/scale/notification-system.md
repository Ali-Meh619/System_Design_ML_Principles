# Notification System Design

> Design a system that reliably delivers push, SMS, and email notifications to millions of users with guaranteed delivery, smart deduplication, and user preference management.

---

## Why Notification Systems Are Hard

A "notification system" sounds simple — just send a message. But at scale, notification systems fail in predictable ways: **duplicate sends**, **missed deliveries**, **thundering herd fan-out**, and **carrier-specific rate limits**. A Facebook-scale system might send 100,000+ notifications per second across 3+ channels. Every engineering decision here has a direct user-experience consequence.

**The 4 Core Challenges**

| Challenge | Why it's hard | Solution |
|-----------|--------------|---------|
| **Guaranteed delivery** | Networks fail, services crash, devices are offline | Persistent queue + retry with exponential backoff |
| **Fan-out at scale** | 1 event → millions of notifications instantly | Async workers + Kafka fan-out |
| **Deduplication** | Retries can cause duplicate sends | Idempotency keys per notification |
| **User preferences** | Different channels, quiet hours, opt-outs | Preference service checked before dispatch |

---

## Notification Channels & Providers

Each channel has its own delivery API and constraints:

| Channel | Provider / Protocol | Typical Latency | Throughput Limit |
|---------|-------------------|-----------------|-----------------|
| **Push (Mobile)** | Apple APNs, Google FCM | Seconds | 10K–100K/sec per provider |
| **Email** | SendGrid, Mailgun, SES | Seconds–minutes | Rate limited per domain |
| **SMS** | Twilio, AWS SNS | 1–5 seconds | Carrier-regulated (10DLC) |
| **In-App** | WebSocket / SSE to client | Sub-second | Unlimited (internal) |

> 💡 **Key Insight:** Push notifications require device registration tokens. These tokens expire. Your system must handle token refresh and stale token removal gracefully — FCM returns `InvalidRegistration` for stale tokens.

---

## High-Level Architecture

```
User Action / Event
        │
        ▼
  [Notification Service]  ← REST API: POST /notifications
        │
        ▼
  [Kafka Topic: notifications]
        │
   ┌────┼────────────┐
   ▼    ▼            ▼
[Push] [Email]   [SMS]
Worker Worker    Worker
   │    │            │
   ▼    ▼            ▼
[APNs/FCM] [SendGrid] [Twilio]
```

**Why Kafka in the middle?**
- **Decouples** the notification triggering from the delivery
- **Buffers** spikes (e.g., a news event → 10M push sends)
- **Replay** ability if a channel worker crashes
- **Per-channel partitioning** — SMS workers don't compete with push workers

---

## Component Deep Dive

### 1. Notification Service (API Layer)

Accepts notification requests and publishes to Kafka. Enforces rate limits per user per channel.

```
POST /v1/notifications
{
  "user_id": "u123",
  "type": "order_confirmed",
  "channels": ["push", "email"],
  "data": { "order_id": "ord456", "amount": "$29.99" },
  "idempotency_key": "ord456-confirmed"
}
```

**Idempotency key is critical.** If the API caller retries (network timeout), the same key prevents duplicate sends. Store `idempotency_key → sent_at` in Redis with a 24-hour TTL.

### 2. User Preference Service

Before dispatching, check:
- **Opt-in status**: has the user enabled this channel?
- **Quiet hours**: no push 11pm–7am in user's timezone
- **Frequency caps**: max 3 marketing emails/day
- **Notification type preferences**: user wants order updates but not promotions

```
GET /v1/users/{user_id}/preferences
→ {
    "push": { "enabled": true, "quiet_hours": "23:00-07:00" },
    "email": { "enabled": true, "daily_limit": 3 },
    "sms": { "enabled": false }
  }
```

Store preferences in a fast key-value store (Redis or DynamoDB). Every notification dispatch reads from this service.

### 3. Channel Workers

**Push Worker (APNs/FCM):**
- Retrieves device tokens from the Device Token Store
- Sends HTTP/2 request to APNs or FCM HTTP v1 API
- Handles token invalidation: remove stale tokens on `410 Gone` from APNs
- FCM supports **topic messaging** (send once, millions receive) — use for broadcast notifications

**Email Worker:**
- Renders HTML templates with user-specific data
- Sends via SMTP relay (SendGrid, SES) 
- Tracks opens/clicks via tracking pixels and redirect URLs
- Handles bounces via webhook callbacks from the email provider

**SMS Worker:**
- Subject to **carrier throughput limits** (10DLC in US: ~10 msgs/sec per campaign)
- Queue SMS sends to stay under rate limits — do NOT burst
- International? Use Twilio's intelligent routing

### 4. Delivery Receipt Store

Track status for every notification:

| Field | Description |
|-------|-------------|
| `notification_id` | UUID |
| `user_id` | Target user |
| `channel` | push / email / sms |
| `status` | queued / sent / delivered / failed / bounced |
| `attempts` | Retry count |
| `sent_at` | Timestamp |
| `delivered_at` | Channel-confirmed delivery time |

Use a time-series DB (InfluxDB) or write to Cassandra (partition by `notification_id`).

---

## Fan-out: One Event → Millions of Users

**Example:** A major sports platform needs to notify all users of Team A when a goal is scored. Team A has 5M followers. How?

**Naive approach:** Loop through 5M users, send 5M API calls → 5M database reads for preferences → kills the DB.

**Production approach:**

```
[Goal Event] → Kafka
                  │
                  ▼
          [Fan-out Service]
          Reads follower list in batches (1K at a time)
          Filters by user preferences (batch Redis multi-get)
          Publishes per-user notification jobs to Kafka
                  │
             ─────────────
             │           │
         [Worker 1]  [Worker 2] ... N workers
         (push)       (email)
```

**Key optimization:** Use a **pre-computed fan-out** (like Twitter's approach) — when a user gains followers, incrementally update follower lists rather than computing at notification time.

**For smaller fan-outs (< 10K users):** Compute fan-out on-demand.

---

## Retry Strategy & Dead Letter Queue

Transient failures (network blip, provider 503) should be retried. Permanent failures (invalid token, email bounce) should NOT retry.

```
Retry Schedule:
  Attempt 1: immediate
  Attempt 2: +30 seconds
  Attempt 3: +2 minutes
  Attempt 4: +10 minutes
  Attempt 5: → Dead Letter Queue
```

**Dead Letter Queue (DLQ):** Failed notifications land here for manual inspection, alerting, and eventual escalation (e.g., try a different channel).

> ⚠️ **Warning:** Retrying SMS messages can cause significant cost if not handled carefully. Always check for permanent error codes before retrying.

---

## Scalability Numbers

Back-of-envelope for 100M daily active users:

- 3 notifications/user/day = **300M notifications/day**
- 300M / 86,400 seconds = **~3,500 notifications/second** average
- Peak (prime time, major event) = **10× average = 35,000 /sec**

For 35K/sec:
- Push: FCM handles 10K/sec per connection → 4 push worker instances
- Email: 35K/day budget on free tier → need paid plan, multiple IPs
- SMS: Most expensive channel, rate-limited, should be rare

**Storage (Delivery Receipts):**
- 300M records/day × 200 bytes = ~60 GB/day
- Use Cassandra or S3 for long-term storage, Redis for recent lookups

---

## Interview Answer Framework

When asked "Design a Notification System":

1. **Clarify channels**: push only? email? SMS? in-app?
2. **Clarify scale**: how many users, notifications/day?
3. **Mention idempotency**: retries must not cause duplicates
4. **Describe the queue**: Kafka between trigger and delivery
5. **Address fan-out**: how do you handle 1 event → millions?
6. **Preference service**: respect user settings and quiet hours
7. **Failure handling**: DLQ, retry strategy, channel fallback

> 💡 **Pro Tip:** Mention the **token management problem** for push — device tokens expire and must be cleaned up. This shows real-world depth.

---

## Common Failure Modes

| Failure | Impact | Prevention |
|---------|--------|-----------|
| Duplicate sends | Bad user experience | Idempotency keys in Redis |
| Stale push tokens | Silent failures | Remove tokens on provider error |
| Fan-out storm | DB overload on large events | Async Kafka fan-out with batching |
| Rate limit breach | SMS/email provider suspension | Per-channel rate limiters |
| Timezone bugs | Sending during user's quiet hours | Always store timezone, compute server-side |
