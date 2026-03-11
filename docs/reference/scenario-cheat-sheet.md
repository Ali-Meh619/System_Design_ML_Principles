# Common Scenarios & Solutions

> **How to use:** Every system design question has a dominant constraint plus 1-2 modifiers. Find the main constraint → apply the base pattern → layer on the modifiers. Each scenario below follows the same structure: trigger words → core pattern → steps → key numbers → trade-off.

---

## The Constraint Map *(start here)*

| What the interviewer says | Dominant constraint | Jump to |
|---|---|---|
| "100M users", "Twitter/YouTube/Netflix" | Read-heavy | §1 |
| "IoT sensors", "metrics pipeline", "log ingestion", "crawler" | Write-heavy | §2 |
| "WhatsApp", "live chat", "multiplayer game", "real-time location" | Low-latency real-time | §3 |
| "Google Search", "Yelp", "Uber find driver", "typeahead" | Search / geo | §4 |
| "Banking", "TicketMaster", "Flash sale", "inventory" | Strong consistency | §5 |
| "Trending topics", "Top-K songs", "most viewed" | Count at massive scale | §6 |
| "Twitter timeline", "Instagram feed", "newsfeed" | Fan-out / social feed | §7 |
| "Dropbox", "Google Drive", "video upload pipeline" | Large file / blob | §8 |
| "Google Docs", "Figma", "collaborative whiteboard" | Collaborative editing | §9 |
| "API rate limiting", "throttling", "DDoS protection" | Rate control | §10 |
| "Push notifications", "email alerts", "SMS pipeline" | Notification delivery | §11 |
| "Login system", "OAuth", "SSO", "session management" | Auth & identity | §12 |
| "TinyURL", "unique IDs at scale", "Snowflake" | ID / URL generation | §13 |
| "B2B SaaS", "workspaces", "organizations", "enterprise login" | Multi-tenant isolation | §14 |
| "GitHub/Stripe webhook", "partner callback", "deliver events to customer endpoint" | Third-party integration | §15 |
| "For You feed", "recommendations", "ranking", "personalization" | Retrieval + ranking | §16 |
| "Global users", "region outage", "data residency", "DR" | Multi-region reliability | §17 |

---

## The Modifier Map *(layer these on top)*

| If the interviewer adds... | Layer on top |
|---|---|
| "Public API", "partner API" | Auth + rate limiting + cursor pagination + idempotency |
| "Compliance", "enterprise", "regulated" | SSO/MFA + audit logs + encryption + data residency + deletion path |
| "Cross-service workflow" | Outbox + queue + Saga + idempotency |
| "Global users", "low latency worldwide" | CDN + geo/DNS routing + multi-region read path or DR |
| "Personalization", "ranking" | Feature store + multi-stage ranking + experimentation |
| "Cost is a concern" | Managed services + autoscaling + storage tiers + async work |

---

## 1. Read-Heavy Systems

**Trigger words:** Twitter/YouTube timeline, product catalog, URL redirect, Pastebin, "100:1 read-to-write ratio"

**Core constraint:** Far more reads than writes. DB cannot sustain every read under load.

**Pattern: Cache-Aside → Read Replicas → CDN**

1. **CDN first** — static assets (images, videos, JS/CSS) never reach your origin. CloudFront/Akamai absorbs 90%+ of traffic.
2. **Application cache** — Redis Cache-Aside for hot rows. On cache miss: read DB → populate cache (TTL 1–24h). For URL shorteners: cache the top 20% of URLs (80% of traffic).
3. **Read replicas** — Primary DB handles writes only. Route all SELECT queries to 5–10 read replicas. Use a connection pooler (PgBouncer) to distribute.
4. **Cache invalidation** — On write, either `DEL` the cache key (lazy), or write-through (update cache synchronously). Lazy is simpler; write-through is fresher.

| Key Number | Value |
|---|---|
| Redis latency | < 1 ms |
| CDN cache-hit ratio (target) | > 95% |
| Read replica replication lag | 10–100 ms |
| TTL for hot data | 1–24 hours |

**Primary trade-off:** Eventual consistency — users may see data that is 10–100 ms stale. Acceptable for social feeds. Not acceptable for financial balances.

**When to deviate:** If every user sees different data (personalized), caching by key (user_id) is more granular but harder. Consider pre-computing results (materialized views, Lambda architecture).

---

## 2. Write-Heavy / High Ingestion

**Trigger words:** IoT sensors, monitoring pipeline, log ingestion, analytics events, webhooks, web crawler, "1M events/second"

**Core constraint:** Write throughput exceeds what a single DB can absorb without becoming a bottleneck.

**Pattern: Buffer (Queue) → Batch → LSM-Tree DB**

1. **Decouple writes from DB** — producers write to a durable message queue (Kafka/Kinesis), not the DB. Queue absorbs spikes.
2. **Batch consumers** — consumers read 500–1000 messages every 500 ms and bulk-insert to DB. Single bulk insert is 100× faster than 1000 individual inserts.
3. **LSM-Tree database** — use Cassandra, ScyllaDB, or InfluxDB (time-series). LSM Trees buffer writes in memory (MemTable), flush to disk as sorted runs — no random I/O, unlike B-Tree (SQL). 
4. **Partitioning** — partition Kafka topics by a natural key (device_id, user_id). Consumers process their partition independently.
5. **Backpressure** — if consumers fall behind, Kafka retains data (configurable retention: 7 days). No data loss.

| Key Number | Value |
|---|---|
| Kafka throughput (single broker) | ~1 GB/s |
| Cassandra write latency (p99) | < 5 ms |
| Batch size sweet spot | 500–1000 rows / 500 ms |
| Kafka default retention | 7 days |

**Primary trade-off:** Near real-time (not real-time) reads. Data is available for read queries after the batch consumer flushes (500 ms–5 s lag). Pure real-time reads require stream processing (Flink/Spark Streaming).

---

## 3. Real-Time & Low Latency

**Trigger words:** Chat app (WhatsApp/Slack), live location (Uber), gaming, collaborative cursor, "sub-100ms", "push to client instantly"

**Core constraint:** Server must push data to connected clients without polling.

**Pattern: WebSocket + Pub/Sub (Redis/Kafka) for fan-out across servers**

1. **WebSocket** — persistent bidirectional TCP connection between client and server. No HTTP overhead per message.
2. **Connection server** — a fleet of stateful connection servers, each holding N open sockets. Clients connect to the nearest server via a load balancer with sticky sessions (consistent hashing on user_id).
3. **Pub/Sub for cross-server delivery** — User A is on Server 1, User B is on Server 2. When A sends to B: Server 1 publishes to `channel:B` in Redis Pub/Sub. Server 2 (subscribed to `channel:B`) delivers to B's socket.
4. **Message persistence** — WebSocket is ephemeral. Persist messages to a DB (Cassandra for chat history, partitioned by conversation_id). Offline users fetch history on reconnect.
5. **Presence** — a heartbeat (ping every 30s). If server misses 2 pings → mark user offline. Store in Redis (TTL 60s), not DB.
6. **Fallback** — Server-Sent Events (SSE) for server→client only (e.g., notifications feed). Long polling as last resort.

| Key Number | Value |
|---|---|
| WebSocket message latency | 5–50 ms |
| Connections per server (Go/Node) | 100K–1M |
| Redis Pub/Sub delivery | < 1 ms local, < 10 ms cross-region |
| Presence heartbeat interval | 30 s |

**Primary trade-off:** Stateful servers are harder to scale than stateless HTTP. Auto-scaling requires draining connections gracefully. Use sticky sessions at the load balancer layer.

---

## 4. Search & Discovery

**Trigger words:** Google Search, Yelp "nearby restaurants", Tinder, typeahead autocomplete, Uber driver matching, "fuzzy search", "full-text search"

**Core constraint:** Fast relevance-ranked lookup over large text corpora or geospatial data — not possible with SQL LIKE queries at scale.

**Pattern A — Full-text: Inverted Index (Elasticsearch)**

1. **Indexing pipeline** — write to primary DB → CDC (change data capture) via Debezium → stream to Elasticsearch. Index is eventually consistent (seconds behind DB).
2. **Inverted index** — maps term → list of (doc_id, position, score). Elasticsearch uses Apache Lucene underneath.
3. **Relevance scoring** — TF-IDF or BM25. Boost by recency, popularity, or user context.
4. **Typeahead** — Trie data structure for prefix lookup (top 5 completions per node). Or Redis Sorted Set: `ZRANGEBYLEX` for lexicographic prefix query.

**Pattern B — Geospatial: Geohash / Quadtree**

1. **Geohash** — encodes (lat, lng) into a base-32 string ("dr5ru…"). Nearby points share a common prefix. Query nearby drivers: `prefix = geohash[:5]` → all keys matching this prefix are within ~5 km.
2. **Quadtree** — recursively subdivides the map into 4 quadrants until each cell has ≤ N points. Efficient for sparse data. Used by Uber.
3. **PostGIS / Redis Geo** — `GEOADD`, `GEORADIUS` for simple geo lookups.

| Key Number | Value |
|---|---|
| Elasticsearch index lag | 1–5 s |
| Geohash precision (5 chars) | ~5 km radius |
| Geohash precision (7 chars) | ~150 m radius |
| Redis ZRANGEBYLEX (1M keys) | < 1 ms |

**Primary trade-off:** Search index is a read replica of your DB — eventual consistency and extra infrastructure to maintain. Geo systems must handle boundary conditions (two nearby points with different hash prefixes).

---

## 5. Strong Consistency (Money / Inventory)

**Trigger words:** Banking, ticketing, flash sale, booking, "last ticket", "no double charge", inventory reservation

**Core constraint:** Correctness is non-negotiable. A wrong answer (double booking, double charge) is worse than a slow or rejected answer.

**Pattern: SQL + ACID + Pessimistic Locking (→ Optimistic for lower contention)**

1. **SQL database** — ACID transactions are the foundation. Do not use NoSQL here (BASE ≠ ACID).
2. **Pessimistic locking** — `SELECT ... FOR UPDATE` locks the row for the transaction duration. Right for high contention (last ticket). Prevents dirty reads and lost updates.
3. **Optimistic locking** — add a `version` column. Transaction reads `version=5`, writes only if `version` still equals 5 (CAS). Better throughput when contention is low; retries on conflict.
4. **Distributed locking** — when multiple microservices must coordinate (e.g., reserve + charge + notify must not double-execute): use Redlock (Redis) or ZooKeeper for a distributed mutex.
5. **Idempotency keys** — every payment/booking API receives a client-generated `idempotency_key`. Server stores (key → result). Safe to retry without double-charging.

| Key Number | Value |
|---|---|
| Postgres FOR UPDATE latency | 1–10 ms |
| Redlock lease duration | 10–30 s |
| Optimistic lock retry cost | 1 extra DB round trip |

**Primary trade-off:** Availability suffers. Under high load, requests queue behind locks. System rejects requests rather than give a wrong answer (CP over AP in CAP theorem).

**When to deviate:** For very high-throughput reservation (millions of users, flash sale), pre-shard inventory by region and use atomic Redis DECR with Lua scripts. Drain Redis to DB asynchronously.

---

## 6. Count / Top-K at Massive Volume

**Trigger words:** "Trending hashtags", "top 10 songs on Spotify", "most viewed videos", "count unique visitors", "view counts" at 1B scale

**Core constraint:** Cannot lock a row for every increment. At 1M writes/sec, a counter column in SQL becomes a bottleneck.

**Pattern: Approximate Counting → Aggregation Windows → Top-K Heap**

1. **Never lock a row** — use Redis `INCR` (atomic, in-memory) for approximate real-time counts. Accepts some lag.
2. **Count-Min Sketch** — 2D probabilistic array. O(1) update, O(1) query, fixed memory regardless of cardinality. Estimates frequency with guaranteed error bound ε (configurable). Used by Twitter for trending.
3. **HyperLogLog** — for distinct counts (unique visitors). Redis `PFADD` / `PFCOUNT`. Estimates unique count with 0.81% error using ~12 KB memory regardless of set size.
4. **Aggregation windows** — stream events into Kafka → Flink/Spark Streaming aggregates in 5-second tumbling windows → write window results to a leaderboard table.
5. **Top-K heap** — maintain a min-heap of size K. On new count: if count > heap minimum, replace it. Result = the K items in heap.

| Key Number | Value |
|---|---|
| Redis INCR throughput | ~1M ops/sec per core |
| Count-Min Sketch memory | ~1 MB for 1B distinct keys |
| HyperLogLog memory | ~12 KB for any cardinality |
| Flink/Spark window | 5–60 s (configurable) |

**Primary trade-off:** Approximate counts (±0.1–1% error). For view counts on YouTube, that's fine. For financial transactions, it's not.

---

## 7. Fan-out / Social News Feed

**Trigger words:** Twitter timeline, Instagram feed, Facebook newsfeed, Reddit front page, "design a feed"

**Core constraint:** Push model (write-time fan-out) is O(followers) per write. Pull model (read-time) is O(following) per read. Neither scales at celebrity scale.

**Pattern: Hybrid Push/Pull based on follower count**

1. **Normal users (< 10K followers):** Fan-out on write. New post → push `post_id` to all followers' Redis feed lists (`LPUSH user:{id}:feed post_id`). Feed reads are O(1).
2. **Celebrities (> 10K followers):** Fan-out on read. On feed load, merge the celebrity's last 20 posts dynamically. Beyoncé's 100M followers × 1 push = too expensive.
3. **Hybrid merge layer** — a "Feed Aggregation Service" handles the merge: fetch pre-computed feed from Redis (normal users) + live-fetch celebrity posts → merge + deduplicate + rank.
4. **Storage** — Redis List per user capped at 1000 entries (LTRIM). Post metadata in Cassandra (partitioned by user_id). Media on CDN.
5. **Ranking** — simple reverse-chronological is easiest. ML ranking (engagement score) requires a Feature Store + inference server; worth mentioning as a future improvement.

| Key Number | Value |
|---|---|
| Redis LPUSH latency | < 1 ms |
| Feed list cap | 1000 posts |
| Celebrity threshold | ~10K followers |
| Feed load SLA | < 200 ms p99 |

**Primary trade-off:** Write amplification (push) vs read latency (pull). The 10K threshold is the key decision to defend in interviews. Mention it explicitly.

---

## 8. Large File / Blob Storage

**Trigger words:** Dropbox, Google Drive, video upload, image pipeline, GitHub LFS, "design file sync"

**Core constraint:** Files are too large for your API servers to handle inline. Bandwidth, memory, and resumability all require a different approach.

**Pattern: Chunked Upload → Object Storage (S3) → CDN + Content-Hash Dedup**

1. **Pre-signed URLs** — server generates a short-lived S3 pre-signed URL, returns to client. Client uploads directly to S3 — your API server never proxies the bytes. Reduces server bandwidth by 100%.
2. **Chunking** — client splits file into 5–10 MB chunks. Uploads each independently. On network failure, only re-upload failed chunks.
3. **Resumable** — server tracks which chunk IDs have been received (stored in Redis/DB). Client queries before resuming.
4. **Content-hash deduplication** — client computes SHA-256 of each chunk. Before uploading, asks server "have you seen hash X?" If yes, link existing chunk — skip upload entirely. Dropbox reported 30%+ storage savings.
5. **Delta sync** — for file updates (Dropbox), use rsync-style block-level diff: compare old vs new block checksums, upload only changed blocks.
6. **Metadata DB** — PostgreSQL: `(file_id, user_id, path, chunk_ids[], version, last_modified)`. Versioning = list of chunk arrays over time.

| Key Number | Value |
|---|---|
| Chunk size | 5–10 MB |
| S3 pre-signed URL TTL | 15 min |
| SHA-256 hash dedup savings | ~30% |
| S3 upload throughput (single part) | ~100 MB/s |

**Primary trade-off:** Complex client-side logic (chunking, hashing, retry) vs simple but fragile single-part upload. The added complexity pays off above ~50 MB file sizes.

---

## 9. Collaborative Real-time Editing

**Trigger words:** Google Docs, Figma, Notion, Miro, "multiple users edit same document simultaneously"

**Core constraint:** Concurrent edits from multiple users must converge to the same state without silently overwriting changes.

**Pattern: WebSocket transport + OT or CRDT for conflict resolution**

1. **Core problem** — User A inserts "X" at pos 5, User B inserts "Y" at pos 5 simultaneously. Without conflict resolution, the state diverges.
2. **OT (Operational Transformation)** — each edit is an operation `{insert "X" at pos 5}`. A central server serializes all ops and transforms concurrent ones to adjust positions before applying. All clients converge. Requires a central coordinator. Used by Google Docs.
3. **CRDT (Conflict-free Replicated Data Type)** — each character gets a globally unique ID. Merge is always deterministic — same result regardless of order. No central coordinator needed. Works offline and syncs on reconnect. Used by Figma, Notion.
4. **Transport** — WebSocket for real-time ops. Ops persisted to an append-only log (PostgreSQL) for replay when a new user joins or a client reconnects.
5. **Presence** — cursor positions, selections, and user avatars broadcast via WebSocket Pub/Sub. Not persisted (ephemeral).

| Key Number | Value |
|---|---|
| OT coordination latency | < 50 ms |
| CRDT memory overhead | ~2× plain text |
| Op log retention | Full document history |

**Primary trade-off:** OT = strong consistency + central coordinator required. CRDT = decentralized + offline-capable, but more complex to implement correctly and higher memory overhead.

---

## 10. Rate Limiting & Throttling

**Trigger words:** API gateway quotas, DDoS protection, "limit to 100 req/s per user", "prevent abuse", "token bucket"

**Core constraint:** Must reject excess requests fast, before they hit your application servers — and the decision must work across a distributed fleet.

**Pattern: Token Bucket (or Sliding Window) in Redis, enforced at the API Gateway**

1. **Algorithm choice:**
   - **Token Bucket** — bucket of capacity C refills at rate R tokens/second. Each request consumes 1 token. Allows short bursts up to C. Most common in practice.
   - **Fixed Window** — count requests in a time bucket (e.g., 100/min). Simple but "thundering herd" at window boundary.
   - **Sliding Window Log** — store timestamps of last N requests. Precise but memory-heavy.
   - **Sliding Window Counter** — blend of fixed windows weighted by overlap. Good balance of precision and memory.
2. **Distributed enforcement** — rate limit state lives in Redis (shared across all API servers). Use `INCR + EXPIRE` for fixed window, or Lua script for atomic token bucket.
3. **API Gateway placement** — enforce at the API Gateway (Kong, AWS API Gateway, Nginx), not in each microservice. Single enforcement point, not N copies.
4. **Response** — return `HTTP 429 Too Many Requests` with `Retry-After: 30` header. Include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers on every response.
5. **Multiple limit tiers** — per user, per IP, per API key, per endpoint. Store each as a separate Redis key.

| Key Number | Value |
|---|---|
| Redis INCR latency | < 1 ms |
| Token bucket refill granularity | 1–100 ms |
| Typical API rate limit | 100–1000 req/min per user |
| Response code for exceeded | HTTP 429 |

**Primary trade-off:** Fixed window is O(1) space but has boundary burst issues. Sliding window log is precise but O(requests) memory. Token bucket is the best general-purpose choice.

---

## 11. Notification System (Push / Email / SMS)

**Trigger words:** Push notifications, email digest, SMS alert, "notify users when X happens", "multi-channel delivery"

**Core constraint:** Notifications are fire-and-forget but must be reliable. The sending path must not block the critical user action that triggered it.

**Pattern: Async event-driven pipeline with per-channel workers**

1. **Decouple immediately** — triggering service (Order, Payment) publishes an event to Kafka/SQS (`order.created`, `payment.failed`). Does NOT call notification service inline.
2. **Notification Service** — consumes events, determines: which users to notify, which channels (push/email/SMS), and applies user preferences (do-not-disturb, opt-out).
3. **Channel workers** — separate workers per channel:
   - **Push (mobile)** — call APNs (iOS) or FCM (Android). Handle invalid tokens (remove from DB).
   - **Email** — send via SendGrid/SES. Track delivery, open, and bounce events via webhooks.
   - **SMS** — call Twilio/AWS SNS. Check for opt-outs before sending.
4. **Retry & dead letter** — failed deliveries retry with exponential backoff (1s, 2s, 4s, 8s…). After 3 failures → dead letter queue for manual inspection.
5. **Template service** — notification body rendered from templates + user data. Supports i18n.
6. **User preferences DB** — store per-user channel preferences and opt-outs. Check before any send.

| Key Number | Value |
|---|---|
| APNs/FCM delivery SLA | < 1 s typical |
| Email delivery time | 1–60 s |
| Retry attempts before DLQ | 3–5 |
| Push notification token TTL | Until user uninstalls |

**Primary trade-off:** Async delivery means no guarantee of exact delivery time. For time-critical notifications (OTP, 2FA), use synchronous SMS (Twilio) outside the async pipeline.

---

## 12. Authentication & Sessions

**Trigger words:** Login system, JWT, OAuth 2.0, SSO, "stay logged in", "how do you handle auth across microservices"

**Core constraint:** Verifying identity must be fast (every request), scalable (millions of users), and secure.

**Pattern A — Session Tokens (stateful, monolith-friendly)**

1. On login, server creates a session in Redis: `session:{token} → {user_id, roles, expiry}`.
2. Token (UUID) sent to client as `HttpOnly, Secure` cookie.
3. On every request: read token from cookie → `GET session:{token}` from Redis → validate.
4. Logout: `DEL session:{token}`. Session instantly invalidated.

**Pattern B — JWT (stateless, microservices-friendly)**

1. On login, Auth Service signs a JWT: `{user_id, roles, exp}` with a private key (RS256).
2. JWT stored in client memory (or `HttpOnly` cookie). Sent as `Authorization: Bearer <token>`.
3. On every request: any service validates JWT signature with the **public key** — no DB call needed.
4. Short expiry (15 min access token) + long expiry refresh token (7 days in Redis). Access token is stateless; refresh token is stateful (stored in DB, revocable).

| Feature | Session Token | JWT |
|---|---|---|
| Revocation | Instant (DEL Redis) | Only at expiry (or via blocklist) |
| Scalability | Requires shared Redis | Stateless — any server validates |
| Microservices | One service must own sessions | Each service validates independently |
| Token size | Small (UUID) | Larger (~500 bytes) |

**OAuth 2.0 / SSO flows:**

- **Authorization Code** — for web apps. User redirected to IdP (Google, Auth0). IdP issues authorization code → exchange for tokens.
- **PKCE** — mandatory for mobile/SPA. Prevents code interception attacks.
- **API-to-API** — Client Credentials flow. No user involved.

| Key Number | Value |
|---|---|
| Access token expiry | 15 min |
| Refresh token expiry | 7–30 days |
| JWT validation (CPU) | < 1 ms (asymmetric verify) |
| Session Redis key TTL | = session expiry |

**Primary trade-off:** JWT is fast and stateless, but hard to revoke immediately. Session tokens are instantly revocable but require a shared Redis (adds a network hop per request). Hybrid: short-lived JWTs + refresh token in Redis is the modern standard.

---

## 13. Unique ID Generation

**Trigger words:** TinyURL, "generate a unique short code", "IDs at scale across microservices", "no sequential IDs", Snowflake

**Core constraint:** IDs must be globally unique, ideally time-sortable, and generated without a single point of coordination.

**Pattern: Snowflake ID (distributed, sortable, no coordination)**

```
64-bit Snowflake:
[ 41 bits timestamp ms ] [ 10 bits machine ID ] [ 12 bits sequence ]
```

1. **41-bit timestamp** — milliseconds since epoch. Gives ~69 years of IDs.
2. **10-bit machine ID** — assigned at startup (from ZooKeeper or environment). Supports 1024 machines.
3. **12-bit sequence** — counter per machine per millisecond. Allows 4096 IDs/ms per machine = ~4M IDs/sec per machine.
4. **Short URL** — encode a numeric ID as Base62 (`[0-9A-Za-z]`). A 7-char Base62 string = 62^7 ≈ 3.5 trillion combinations. Generate ID → encode to Base62 → use as short code.
5. **Alternatives:**
   - **UUID v4** — 128-bit random. Globally unique but not sortable, large.
   - **ULID** — Universally Unique Lexicographically Sortable Identifier. Time-sortable UUID alternative.
   - **DB auto-increment** — simple but single point of coordination; doesn't scale across shards.

| Key Number | Value |
|---|---|
| Snowflake throughput per machine | ~4M IDs/ms |
| Base62 (7 chars) combinations | ~3.5 trillion |
| UUID v4 collision probability | Negligible (2^122 space) |
| Short URL typical length | 6–8 chars |

**Primary trade-off:** Snowflake requires machine ID management (startup coordination). UUIDs need no coordination but are larger and not sortable. Choose Snowflake for high-throughput systems; UUID for simplicity.

---

## 14. Multi-Tenant B2B SaaS & Authorization

**Trigger words:** B2B SaaS, workspaces, organizations, enterprise login, per-tenant admin roles, "prevent cross-tenant data leaks"

**Core constraint:** Many customers share the same platform, but tenant isolation, authorization, and noisy-neighbor control must be explicit from day one.

**Pattern: Tenant-aware data model + scoped identity + RBAC/ABAC + audit logs**

1. **Tenant identity on every request** — JWT/session should carry `tenant_id`, `user_id`, and roles. Every cache key, DB query, and background job should stay tenant-scoped.
2. **Choose isolation level deliberately** — shared DB/schema with `tenant_id` is the default for most SaaS; schema-per-tenant is useful when customization or noisy-neighbor issues grow; DB-per-tenant is usually reserved for whale or regulated customers.
3. **Authorization after authentication** — RBAC is enough for many SaaS products; add ABAC/ReBAC when access depends on resource ownership, sharing, or organization hierarchy.
4. **Enterprise login** — OIDC is the clean default; SAML still matters for enterprise customers. Mention SCIM if the interviewer asks about automated user provisioning/deprovisioning.
5. **Protect against noisy neighbors** — apply per-tenant quotas, rate limits, concurrency caps, and tenant-aware partitions for especially large tenants.
6. **Audit and admin safety** — log admin actions, membership changes, exports, privilege changes, and sensitive writes. Enterprise customers often care as much about auditability as raw scale.

| Key Number | Value |
|---|---|
| Access token TTL | 15–60 min |
| AuthZ check target | < 5 ms |
| Audit log retention | 90–365 days+ |
| Default quota window | 1 min / 1 hour / daily mix |

**Primary trade-off:** Shared infrastructure is cheaper and simpler, but tenant isolation is logically enforced rather than physically isolated. Dedicated infrastructure improves isolation but increases cost and operational complexity.

**When to deviate:** A common pattern is hybrid isolation: most tenants share the default stack, while a few large or regulated customers get isolated storage or dedicated clusters.

---

## 15. Webhooks & Third-Party Integrations

**Trigger words:** GitHub webhook, Stripe webhook, Slack app, partner callback, "deliver events to a customer endpoint", "integrate with third-party APIs"

**Core constraint:** External endpoints and third-party APIs are unreliable, slow, and outside your control. Delivery must still be secure, retryable, and observable.

**Pattern: Durable event record → signed delivery worker → retries + idempotency**

1. **Persist before sending** — after the source transaction commits, write an event to an outbox table or queue. Never generate a webhook only from in-memory state.
2. **Sign every outbound request** — include `event_id`, timestamp, and an HMAC signature so receivers can verify authenticity and reject replays.
3. **Retry with exponential backoff** — customer endpoints fail all the time. Retry at 1s, 10s, 1m, 10m, etc., then move to a DLQ or failed-delivery state.
4. **Assume at-least-once delivery** — duplicates happen. Both sender and receiver should dedupe using `event_id` or an idempotency key.
5. **Expose delivery visibility** — maintain delivery logs, status pages, and replay tooling so support and customers can inspect failures without digging through raw logs.
6. **Protect the destination and yourself** — enforce per-endpoint rate limits, timeouts, and circuit breakers so one bad receiver does not poison the whole delivery fleet.

| Key Number | Value |
|---|---|
| Delivery timeout | 3–10 s |
| Retry attempts before DLQ | 3–10 |
| Initial backoff | 1–10 s |
| Signature timestamp tolerance | ±5 min |

**Primary trade-off:** At-least-once delivery is practical and robust, but it means duplicates are unavoidable. Exactly-once over arbitrary third-party HTTP endpoints is not realistic.

---

## 16. Recommendation / Ranking & Personalization

**Trigger words:** "For You", recommendation engine, home-feed ranking, search ranking, ads ranking, personalization, cold start

**Core constraint:** You must choose the best few items from a huge candidate set under tight latency while balancing relevance, diversity, freshness, and exploration.

**Pattern: Candidate generation → feature lookup → multi-stage ranking → business rules → online feedback loop**

1. **Generate candidates cheaply** — use heuristics, collaborative filtering, ANN/vector retrieval, popularity, or graph-based retrieval to narrow millions of items to a few hundred or thousand.
2. **Use a feature store or equivalent online feature path** — ranking quality collapses when training and serving features diverge. Point-in-time correctness matters.
3. **Rank in stages** — a light ranker filters candidates first; a heavier ranker or re-ranker handles the final list. This is how you keep latency reasonable.
4. **Add a post-ranking rules layer** — enforce diversity, freshness, safety, inventory constraints, sponsored placement, or creator fairness after the model score.
5. **Run experiments and log outcomes** — offline metrics like NDCG or MRR are useful, but online metrics like CTR, watch time, retention, or conversion decide ship/no-ship.
6. **Handle cold start explicitly** — new users and new items need fallback logic such as popularity, content-based retrieval, or exploration slots.

| Key Number | Value |
|---|---|
| Candidate set size | 100–1000 |
| Online ranking budget | 10–50 ms |
| Feature freshness target | Seconds to minutes |
| Exploration traffic / slots | 1–5% |

**Primary trade-off:** Better ranking quality usually costs more latency, feature infrastructure, experimentation complexity, and serving spend. Offline gains do not guarantee online improvement.

---

## 17. Global / Multi-Region Reliability

**Trigger words:** global users, region outage, disaster recovery, data residency, low latency worldwide, "must survive a regional failure"

**Core constraint:** Reduce latency and survive region failures without creating unmanageable consistency, cost, and operational complexity.

**Pattern: Multi-AZ first → explicit RTO/RPO → active-passive or active-active multi-region**

1. **Start with one region across multiple AZs** — this handles the most common infrastructure failure before you take on cross-region complexity.
2. **Use DNS/CDN/WAF at the edge** — route users to the closest healthy region when possible, and keep static content at the edge.
3. **Replicate data deliberately** — asynchronous cross-region replication is the default. Reserve synchronous cross-region writes for narrow cases where correctness truly requires it.
4. **Choose a failover mode** — cold standby, warm standby, active-passive, and active-active all exist for a reason. Pick one based on RTO/RPO and business criticality.
5. **Keep region-local dependencies in mind** — caches, search indexes, queues, and feature stores may all need local copies or recovery plans, not just the primary database.
6. **Run failover and restore drills** — a DR plan that has never been tested is just documentation.

| Key Number | Value |
|---|---|
| Multi-AZ default | 2–3 AZs |
| Cross-region RTT | ~50–200 ms |
| Typical RPO target | 0–15 min |
| Typical RTO target | Minutes to hours |

**Primary trade-off:** Multi-region improves resilience and can reduce latency for global users, but it raises cost, complicates data consistency, and makes operations much harder.

---

## Quick Reference: Core Constraint → Pattern

| Scenario | Core Pattern | Key Technologies | Critical Trade-off |
|---|---|---|---|
| Read-heavy | Cache-Aside + CDN + Read Replicas | Redis, CloudFront, PgBouncer | Eventual consistency (staleness) |
| Write-heavy | Queue → Batch → LSM DB | Kafka, Cassandra, InfluxDB | Near-real-time (not real-time) reads |
| Real-time | WebSocket + Pub/Sub (+ SSE fallback) | Socket.io, Redis, Sticky sessions | Stateful servers, harder to scale |
| Search / geo | Inverted Index + Geohash / Quadtree | Elasticsearch, Redis GEO, PostGIS | Index lag + boundary conditions |
| Strong consistency | SQL transactions + locks + idempotency | PostgreSQL FOR UPDATE, version column, idempotency key | Lower availability, more latency |
| Count at scale | Approx. counters + windows | Count-Min Sketch, Redis HLL, Flink | ~1% error (approx.) |
| Social feed | Hybrid fan-out (push/pull) | Redis Lists, Kafka, Cassandra | Write amplification vs read latency |
| Large file / blob | Chunked + Pre-signed URL + Dedup | S3, SHA-256, rsync | Complex client-side logic |
| Collaborative edit | OT (central) or CRDT (p2p) | WebSocket, append-only log | OT: coordinator needed; CRDT: memory |
| Rate limiting | Token Bucket in Redis | Kong, Nginx, Redis Lua script | Boundary burst (fixed window) |
| Notification pipeline | Async event queue + per-channel workers | Kafka, APNs, FCM, Twilio | Async = no exact delivery guarantee |
| Authentication | Short-lived JWT + Redis refresh token | RS256, Redis, OAuth 2.0 | JWT: hard to revoke before expiry |
| Unique IDs | Snowflake (time + machine + seq) | ZooKeeper, Base62 encoding | Machine ID coordination at startup |
| Multi-tenant SaaS | Tenant-scoped auth + RBAC/ABAC + quotas | OIDC/SAML, SCIM, audit logs | Shared infra is cheaper; isolation is weaker |
| Webhooks / integrations | Durable outbox + signed retries + DLQ | HMAC, outbox, Kafka/SQS | At-least-once duplicates |
| Recommendation / ranking | Candidate generation + multi-stage ranker | Feature store, ANN, LightGBM/NN | Quality vs latency/cost |
| Global / multi-region | Multi-AZ → DR / active-passive / active-active | DNS, CDN, replication, failover | Cost and consistency complexity |

---

## Common Modifiers *(layer these on top of any scenario)*

| Need | Default add-on |
|---|---|
| Public list API | Cursor pagination + auth + rate limiting |
| Cross-service business workflow | Outbox + queue + Saga + idempotency |
| Strict mutual exclusion | DB row lock first; fencing-token lock only when truly needed |
| Enterprise / regulated customer | SSO + audit logs + secrets management + residency controls |
| Aggressive cost constraints | Managed services + storage tiers + autoscaling + async pipelines |

---

**Final reminder:** Most real interviews are combinations, not pure patterns. Say the primary scenario first, then explicitly layer on the modifiers: "This is mainly a read-heavy feed problem, with ranking, multi-tenant auth, and rate limiting layered on top."
