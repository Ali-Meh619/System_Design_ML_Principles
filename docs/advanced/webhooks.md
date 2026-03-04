# Webhooks System Design

> How to design a system that pushes events to third-party user endpoints (like Stripe/GitHub webhooks) reliably and securely.

---

## The Challenge

You are calling UNTRUSTED, UNRELIABLE external servers. They will timeout, return 500s, or be offline. You cannot let their slowness block your system. You must ensure delivery eventually.

**The core problems:**
1. External servers are slow/unreliable — can't block your main flow
2. Must guarantee delivery even if their server is temporarily down
3. Security: recipient must verify events really came from you
4. Scale: you might have 100,000 webhook subscribers per event type

---

## Webhook Architecture

**Reliable Webhook Delivery Pipeline:**

1. **Event Trigger:** Internal service emits event (e.g., "payment_succeeded") to Kafka topic `events`.

2. **Webhook Worker:** Consumes Kafka. Looks up user's configured webhook URL from DB.

3. **Delivery Attempt:** Send POST request with payload.
   - **Timeout:** Strict 5s timeout. Don't let slow users clog workers.
   - **Security:** Sign payload using HMAC-SHA256 with user's secret. Send signature in `X-Signature` header so user can verify it's from you.

4. **Retry Logic:** On failure (500, 429, timeout), push message to **Retry Queue** (SQS with delay). Use exponential backoff: 1min, 5min, 30min, 6h. Max 5 retries.

5. **Dead Letter:** After max retries, move to "Failed Webhooks" table. Notify user via email: "Your webhook endpoint is failing."

---

## Webhook Signing (Security)

Recipients need to verify that webhook calls genuinely come from you:

```python
import hmac
import hashlib
import json

def sign_payload(payload: dict, secret: str) -> str:
    payload_bytes = json.dumps(payload, sort_keys=True).encode('utf-8')
    signature = hmac.new(
        secret.encode('utf-8'),
        payload_bytes,
        hashlib.sha256
    ).hexdigest()
    return f"sha256={signature}"

# Send webhook:
headers = {
    "Content-Type": "application/json",
    "X-Webhook-Signature": sign_payload(payload, user_secret),
    "X-Webhook-Event": "payment.succeeded",
    "X-Webhook-Delivery": delivery_id,  # unique ID for idempotency
}

# Recipient verifies:
def verify_webhook(payload_bytes, received_signature, secret):
    expected = "sha256=" + hmac.new(
        secret.encode('utf-8'),
        payload_bytes,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, received_signature)
    # hmac.compare_digest is timing-safe (prevents timing attacks)
```

---

## Full Architecture Diagram

```
User configures webhook URL in dashboard
  → Stored in DB: {user_id, url, secret, event_types: ["payment.*"]}

Payment service processes payment
  → Emits to Kafka: {type: "payment.succeeded", order_id: 123, amount: 99.00}
  
Webhook dispatcher service:
  → Reads from Kafka
  → Queries DB: "who subscribed to payment.succeeded?"
  → For each subscriber (fan-out via SQS):
      SQS message: {webhook_config_id, event_payload, attempt: 1}

Webhook delivery worker:
  → Reads from SQS
  → Fetches webhook config (URL, secret)
  → Signs payload with HMAC-SHA256
  → POST to user's endpoint (5s timeout)
  → If 2xx: mark delivered ✓
  → If non-2xx or timeout: 
      SQS delay queue: visibility_timeout = 60s (1 min)
      Attempt 2: 5 min delay
      Attempt 3: 30 min delay
      Attempt 4: 6 hours delay
      Attempt 5 fails: → Failed webhooks DB table → email alert

Monitoring:
  → Dashboard: delivery rate, p99 latency, failure rate per webhook URL
  → Alert: if endpoint fails 3 consecutive attempts
  → Auto-disable: if endpoint fails 100% over 7 days (prevent waste)
```

---

## Delivery Tracking

Track every webhook delivery attempt:

```sql
-- webhook_deliveries table
CREATE TABLE webhook_deliveries (
    delivery_id UUID PRIMARY KEY,
    webhook_id UUID REFERENCES webhooks(id),
    event_type VARCHAR(100),
    payload JSONB,
    attempt_number INT,
    status VARCHAR(20),  -- 'pending', 'delivered', 'failed'
    response_code INT,
    response_body TEXT,
    latency_ms INT,
    attempted_at TIMESTAMPTZ
);

-- Index for monitoring queries
CREATE INDEX ON webhook_deliveries (webhook_id, attempted_at DESC);
CREATE INDEX ON webhook_deliveries (status, attempted_at) WHERE status != 'delivered';
```

---

## Fan-Out at Scale

If you have 100,000 subscribers to `payment.succeeded` and send 1,000 payments/second:
- That's 100 million webhook delivery requests per second
- Fan-out must be asynchronous and distributed

**Architecture for massive fan-out:**
```
Kafka event "payment.succeeded"
    ↓
Fan-out service:
  → Query: SELECT * FROM webhook_subscriptions WHERE event_type = 'payment.succeeded'
  → Batch: group by endpoint URL (deduplicate same URL)
  → Publish N messages to SQS delivery queue
  
Delivery worker pool (auto-scaled):
  → Each worker handles 10 deliveries/second
  → 100 workers needed for 1000 deliveries/second
  → Scale with queue depth via KEDA/ASG
```

---

## Webhook Idempotency

Recipients must handle duplicate deliveries (your retry = their duplicate):

```
Each delivery has a unique X-Webhook-Delivery header:
delivery_id: "whd_01ARYZ3NDEKTSV4RRFFQ69G5"

Recipient deduplication:
1. Receive webhook
2. Check: have I processed delivery_id "whd_01ARY..."?
   → Redis: SETNX processed_deliveries:whd_01ARY... 1 EX 86400
   → If fails (already exists): 
       return 200 (acknowledge without reprocessing)
   → If succeeds: process normally
```

---

## Interview Talking Points

- "Webhook delivery is async — the payment service drops a message to Kafka and returns immediately. The delivery worker runs separately. User's slow server never blocks our payment flow."
- "Exponential backoff: 1min, 5min, 30min, 6h. Max 5 retries. After that, email the user 'your webhook is failing' and stop retrying."
- "HMAC-SHA256 signature in every request. The user verifies it matches their secret before processing. Prevents replay attacks (include a timestamp in the signed payload and reject requests older than 5 minutes)."
- "Auto-disable: if an endpoint has 100% failure rate over 7 days, disable it automatically. Prevents wasting resources on permanently dead endpoints."
