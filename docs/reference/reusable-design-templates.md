# Reusable Design Templates

> Map any interview question to one of 12 battle-tested templates. Identify the pattern, apply the blueprint, then customize for specific constraints. These 12 templates cover 95%+ of all system design interview questions.

---

## Template 1: Read-Heavy Content System (YouTube, Netflix, Dropbox)

**Pattern: Users read/stream content far more than they upload it (100:1 ratio or more)**

1. **Upload path:** Client → API Gateway → Upload Service → S3 (raw file). Async: S3 event → SQS/Kafka → Transcoding Workers → encode in 5 formats (1080p, 720p, 480p, 360p, 144p) → upload each format to S3 → update video metadata in PostgreSQL → push to CDN
2. **Play path:** Client → CDN (cache hit 95%+ for popular content) → CDN miss → S3 origin → stream via HTTP range requests. Never hit application servers for media bytes.
3. **Metadata (title, description, comments):** PostgreSQL for writes. Redis cache for reads (TTL 1 hour). Read replicas for DB-level scaling.
4. **Search:** Video metadata synced to Elasticsearch. Users search via dedicated search service.
5. **Recommendations:** Offline ML pipeline → pre-computed recommendation lists per user → stored in Redis. Served instantly on homepage load.
6. **Scaling:** CDN handles most load. API servers: stateless → horizontal scale. DB: read replicas + Redis cache for hot queries.
7. **Key trade-offs to mention:** Eventual consistency for view counts (Redis counter, batch-flush to DB hourly). CDN cache TTL (longer = cheaper + stale; shorter = fresher + expensive).

![Read-Heavy System Architecture](../../assets/system_design_template_01_youtube.png)

---

## Template 2: Social Feed / Write-Heavy System (Twitter, Instagram)

**Pattern: Millions of write events, billions of fan-out reads. Hybrid push/pull feed**

1. **Post creation:** `POST /tweet` → Validation → Write to Tweets table (PostgreSQL/Cassandra, tweet_id, user_id, content, timestamp) → Publish to Kafka "new-tweets" topic
2. **Feed fan-out (async):** Fan-out service consumes Kafka → For each follower (if follower count < threshold, e.g., 10K): prepend tweet_id to follower's Redis feed list (`LPUSH user:{id}:feed tweet_id`; LTRIM to 1000 entries)
3. **Feed read:** `GET /feed` → Redis `LRANGE user:{id}:feed 0 19` (get 20 tweet IDs) → Batch fetch tweet content + author profiles from cache/DB → Return merged feed
4. **Celebrities (>10K followers):** Don't fan-out on write — too expensive. At read time, fetch recent tweets from followed celebrities and merge with pre-built feed.
5. **Media:** Images/videos stored in S3, served via CDN. Only URLs stored in tweets table.
6. **Trending topics:** Kafka stream of all tweets → Count-Min Sketch for top hashtags per 15-minute window → Redis sorted set for real-time trending display

![Social Feed System Architecture](../../assets/system_design_template_02_twitter.png)

---

## Template 3: Real-time Chat System (WhatsApp, Slack)

**Pattern: Full-duplex real-time messaging with guaranteed delivery and offline support**

1. **Connection:** Client opens WebSocket to Chat Server. Load balancer uses consistent hashing (user_id) to route to same server per user. Chat Server registers `user_id → server_address` in Redis.
2. **Send message:** Client → WebSocket → Chat Server receives → Persist to Cassandra (partition key: conversation_id, clustering key: timestamp DESC) → Publish to Redis Pub/Sub channel `"conversation:{id}"`
3. **Deliver message:** All Chat Servers subscribed to `"conversation:{id}"` receive message → Look up which server holds each recipient's WebSocket → Send via WebSocket if online
4. **Offline delivery:** If recipient offline, store in Redis `"user:{id}:offline_messages"` list. On reconnect, flush pending messages.
5. **Delivery receipts:** Message states: sent (in Cassandra), delivered (recipient's server received), read (recipient opened). States published back via WebSocket.
6. **Media:** Upload to S3 first, get URL, then send URL as message. Media served via CDN.
7. **Group messages:** For large groups (e.g., 1000-member Slack channel), use fan-out via Kafka. For small groups, direct server-to-server delivery.

![Real-time Chat Architecture](../../assets/system_design_template_03_whatsapp.png)

---

## Template 4: Location-Based Service (Uber, Yelp, Google Maps)

**Pattern: Real-time location data + proximity queries + route computation**

1. **Location ingestion:** Driver/user apps → WebSocket or UDP → Location Service → Store in Redis: `GEOADD drivers_geo longitude latitude driver_id` (Redis native geospatial). Update every 4 seconds for drivers, on-demand for users.
2. **Proximity search:** `GEORADIUS drivers_geo user_lng user_lat 5 km` → returns nearby driver IDs within 5 km. Redis geospatial commands use geohash internally — sub-millisecond for millions of points.
3. **Route computation:** Pre-build road graph from OpenStreetMap data. Store in memory on Route Servers. Dijkstra / A* for shortest path. For real-time traffic, overlay speed data from probe vehicles onto edges.
4. **ETA calculation:** Route distance / average speed per road segment. Speed data refreshed every few minutes from aggregate probe vehicle data.
5. **Business search (Yelp):** Business metadata in PostgreSQL. Geohash index on location for proximity queries. Elasticsearch for text search (restaurant name, cuisine type). Combine: "find Italian restaurants within 2 km" = Elasticsearch + geohash filter.
6. **Persistence:** Driver trip history → Cassandra (partition by driver_id). Business data → PostgreSQL. Location history for analytics → Kafka → data warehouse.

![Location-Based Service Architecture](../../assets/system_design_template_04_uber.png)

---

## Template 5: URL Shortener / ID Generation (Pastebin, TinyURL)

**Pattern: Generate unique short codes, fast redirect, high read volume**

1. **Short code generation:** Option A: Hash (MD5/SHA256 of long URL) → take first 7 characters → handle collision (try 8 chars, etc.). Option B: Auto-increment ID → encode to Base62 (a-zA-Z0-9 = 62 chars). 7 chars of Base62 = 62^7 = 3.5 trillion unique URLs.
2. **Storage:** PostgreSQL: (short_code VARCHAR PK, long_url TEXT, user_id, created_at, expiry). Index on short_code for O(log N) lookup. Redis cache: short_code → long_url (TTL based on expiry).
3. **Redirect:** `GET /{short_code}` → Redis lookup (cache hit: return 301/302 redirect in <1ms) → Cache miss: PostgreSQL lookup → cache result → redirect. 301 (permanent, browser caches) vs 302 (temporary, all requests hit your server — lets you track clicks). Use 302 for analytics.
4. **Analytics:** On each redirect, async push event to Kafka: {short_code, timestamp, user_agent, IP, referrer}. Stream processor aggregates click counts per URL. Store in Redis sorted set for real-time dashboard.
5. **Scale:** 100:1 read/write ratio. Redis cache handles 95%+ of redirect traffic. Database only for cache misses and new URL creation.

![URL Shortener Architecture](../../assets/system_design_template_05_url_shortener.png)

---

## Template 6: Rate Limiter System

**Pattern: Enforce per-user/per-tenant request quotas across distributed servers**

1. **Algorithm:** Token bucket (most common). Per user: each user has a bucket with capacity C and refill rate R tokens/second. Each request consumes 1 token. Burst up to C; average rate = R/second.
2. **Distributed implementation:** Redis MULTI/EXEC or Lua script for atomic check-and-decrement: check current_tokens → if > 0 decrement and allow → else return 429 Too Many Requests. Lua script ensures atomicity (no race conditions between check and decrement).
3. **Architecture:** API Gateway calls Rate Limiter Service before routing request. Rate Limiter Service: stateless servers + shared Redis cluster. Redis stores per-user counters with TTL.
4. **Headers:** Return `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` in every response so clients can self-throttle.
5. **Tiered limits:** Free users: 100 req/min. Pro users: 1000 req/min. Enterprise: configurable. Store tier in user profile, load into Redis token bucket config.
6. **Failure mode:** If Redis is unavailable: fail open (allow all requests) to maintain availability, OR fail closed (reject all) to protect backend. Decision depends on business priority. Fail open with local fallback counters is most common.

![Rate Limiter Architecture](../../assets/system_design_template_06_rate_limiter.png)

---

## Template 7: Realtime Monitoring / Metrics System

**Pattern: High-volume time-series ingestion, real-time query, anomaly detection**

1. **Ingestion:** Services push metrics via agent (Prometheus exporter / StatsD) → Kafka (buffering + replay capability) → Stream processors → Time-series DB (InfluxDB, Prometheus, Cassandra time-series schema).
2. **Aggregation:** Pre-aggregate at write time: instead of storing individual data points every second, store per-minute and per-hour buckets to reduce storage 60× and 3600×. Use downsampling policies with retention: 1-second resolution for last 24 hours, 1-minute for last 30 days, 1-hour for last 1 year.
3. **Query:** Grafana queries time-series DB via its native query language (PromQL for Prometheus). Dashboards show rolling averages, percentiles, heatmaps.
4. **Alerting:** Rule engine evaluates metric queries on schedule. If threshold breached for N consecutive periods → PagerDuty/Slack alert. Alert on anomaly (Z-score > 3) not just threshold (catches unknown-unknowns).
5. **Schema design (Cassandra):** Partition key = (service_name, metric_name, date). Clustering key = timestamp. Allows efficient range scans: "give me CPU metric for service X on date Y" → single partition scan.

![Monitoring System Architecture](../../assets/system_design_template_07_monitoring.png)

---

## Template 8: Booking / Ticketing System (TicketMaster, Airbnb, OpenTable)

**Pattern: Prevent double-booking, handle extreme concurrency for popular events, guarantee inventory accuracy**

1. **Inventory model:** PostgreSQL: seats table (seat_id PK, event_id, status: AVAILABLE/RESERVED/SOLD, reserved_until, user_id). Status transition: AVAILABLE → RESERVED (hold) → SOLD (payment complete) or back to AVAILABLE (expired hold).
2. **Reservation flow:** `SELECT seat WHERE status=AVAILABLE AND event_id=X LIMIT 1 FOR UPDATE` → `UPDATE status=RESERVED, reserved_until=NOW()+10min, user_id=U` → Return seat to user for payment. "FOR UPDATE" is pessimistic lock — held only during this fast DB transaction (milliseconds), not during checkout.
3. **Queue for hot events:** During ticket sale surge (Taylor Swift tickets), put buyers in a virtual queue. Queue is fair (FIFO) and prevents thundering herd on the database. Estimated wait time shown to user.
4. **Expiry:** Cron job or Redis TTL evicts expired reservations. Redis TTL approach: on reservation, `SET reservation:{seat_id} user_id EX 600`. When TTL fires, reservation cleanup job runs.
5. **Payment:** Payment flow runs while seat is RESERVED. On payment success: `UPDATE status=SOLD` → Send confirmation email async (SQS). On payment failure or expiry: `UPDATE status=AVAILABLE` → seat re-enters pool.
6. **Read scaling:** Availability queries (how many seats left?) served from Redis counter, not DB. `DECR seats_available:{event_id}` on reserve. `INCR` on expiry. Exact count only from DB when buying.

![Booking System Architecture](../../assets/system_design_template_08_ticketmaster.png)

---

## Template 9: Autonomous Coding Agent (Devin / Cursor / GitHub Workspace)

**Pattern: ReAct loop with sandboxed code execution and long-term memory**

1. **Orchestration:** "Manager Agent" receives user task ("Fix bug in repo X"). Decomposes into subtasks: (1) Explore codebase, (2) Reproduce bug, (3) Write fix, (4) Verify.
2. **Environment:** Each session runs in an ephemeral Firecracker microVM. The VM has the repo cloned and dependencies installed. Agent executes shell commands (`grep`, `ls`, `pytest`) and reads stdout/stderr.
3. **Cognitive Architecture:** **ReAct Loop**: Observe (read file) → Thought (I need to find where `calculate_total` is called) → Action (grep "calculate_total") → Observe (grep output).
4. **Memory (RAG):** "Codebase Knowledge" stored in Vector DB (Pinecone). Chunks of code embedding. On each step, retrieve relevant docs/code snippets if context window is full.
5. **Safety:** **Permission boundary**: Agent can edit files in the VM but cannot push to main branch without human approval (PR creation only). Network access restricted to package managers (pip/npm) and specific APIs.
6. **Evaluation:** Success = "Did the new test case pass?". **LLM-as-a-Judge** reviews the diff for style/safety before notifying user.

![AI Agent Architecture](../../assets/system_design_template_09_ai_agent.png)

---

## Template 10: Typeahead / Search Autocomplete

**Pattern: Pre-computed top-N completions per prefix, served from in-memory Trie or Redis Sorted Sets**

1. **Data collection:** Log every user search query → Kafka → Frequency aggregator → Store `{query: "apple", count: 50M}` in a PostgreSQL table. Run daily batch job to compute top-10 completions for every prefix.
2. **Storage:** Two options: (A) **Trie** in memory — each node stores top-5 popular completions for that prefix (fast O(prefix_len) lookup, must fit in RAM ~100MB for top-1M queries). (B) **Redis Sorted Set** per prefix — `ZADD "prefix:app" 50000000 "apple"`. `ZREVRANGE "prefix:app" 0 4` returns top-5 in <1ms.
3. **API:** Client types "app" → debounce 100ms → `GET /suggest?q=app` → Return `[{text: "apple", score: 50M}, ...]`. Latency target: under 50ms total.
4. **Freshness:** Rebuild Trie/Redis ZSETs nightly from aggregated logs. For trending (Twitter), use real-time stream: Kafka → Flink 5-min window counts → ZINCRBY per prefix. 2-tier: fast real-time + stable historical.
5. **Scale:** Stateless API servers (horizontal scale). Redis cluster sharded by prefix. Cache suggestions at CDN edge for ultra-common prefixes like "a", "ap".
6. **Key trade-offs to mention:** Freshness vs performance (daily rebuild = stale data but fast). Trie = faster lookup, harder to update dynamically. Redis ZSET = easier incremental updates, network hop required.

![Typeahead Architecture](../../assets/system_design_template_10_typeahead.png)

---

## Template 11: Google Docs / Collaborative Document Editing

**Pattern: WebSocket + Operational Transformation (OT) + Append-only Operation Log + Periodic Snapshots**

1. **Routing:** Load balancer uses **consistent hashing** on document_id → all users editing the same doc land on the same Document Server (stateful). Document Server holds the current in-memory document state + version counter.
2. **Edit flow:** User types "A" at position 5 → Client sends via WebSocket: `{op: INSERT, pos: 5, char: "A", clientVersion: 12}` → Server applies **OT** (transform against any ops received since version 12) → Applies to document (version → 13) → Broadcasts transformed op to all other editors → Persists to operation log.
3. **Conflict resolution (OT):** If two users both type at position 5 simultaneously — User A inserts "X", User B inserts "Y". Server receives A first. Transforms B's operation: position becomes 6 (shifted by A's insert). Both users converge to "XY" at positions 5,6. No data loss.
4. **Persistence:** Append-only operations log in PostgreSQL: (doc_id, version INT, op_json, user_id, timestamp). Full document = replay of all ops from version 0. To speed up loading: create a **snapshot** every 100 ops (store full document state at that version).
5. **Presence & cursors:** Broadcast cursor positions and selections via Redis Pub/Sub channel `"doc:{id}:presence"`. Ephemeral — not persisted. Shown as colored cursors in real-time.
6. **Offline support:** Client queues operations locally while offline. On reconnect, sends all queued ops with the last known clientVersion. Server applies OT to merge correctly.
7. **Key trade-offs to mention:** OT requires central server for op serialization (no decentralized writes). Snapshot frequency = balance between load time (more snapshots = faster) and storage cost.

![Collaborative Editing Architecture](../../assets/system_design_template_11_google_docs.png)

---

## Template 12: Code Submission & Execution (LeetCode, HackerRank)

**Pattern: Async Job Queue + Isolated Sandboxed Worker + Polling/WebSocket Result Delivery**

1. **Submission:** `POST /submit {code, language, problem_id}` → API Gateway validates (size limit 64KB, language whitelist) → Enqueue job to SQS/Kafka: `{submission_id, user_id, problem_id, code, language}` → Return HTTP 202 Accepted + submission_id immediately. Never block the HTTP request waiting for code execution.
2. **Execution worker:** Worker pool (auto-scaled) pops job → Pulls Docker/Firecracker sandbox image for the target language → Injects code + test cases → Executes inside sandbox → Enforces hard limits: 2-second CPU wall time, 256MB RAM, no network, read-only filesystem, restricted syscalls (seccomp: no fork, no exec).
3. **Result storage:** On completion → Write to Redis: `SET submission:{id} {status, verdict, stdout, runtime_ms, memory_mb} EX 3600` (1-hour TTL) → Persist final result to PostgreSQL for user submission history.
4. **Result delivery:** Option A: Client polls `GET /submissions/{id}/result` every 1s → 202 until ready, then 200. Option B: WebSocket push — server sends result the moment it's ready (better UX). For contest leaderboards: publish to Kafka "results" topic → Leaderboard Service updates ranking.
5. **Security (critical):** Full **sandbox isolation** — code cannot access the internet, cannot fork bomb, cannot read other users' data. Resource limits enforced at kernel level using Linux **cgroups** (CPU/memory) and **seccomp-bpf** (syscall filter). Each submission gets a fresh, ephemeral container — no shared state between runs.
6. **Scaling:** Worker fleet auto-scales based on SQS queue depth (KEDA). Burst of submissions fills queue; workers scale from 10 → 500 in ~2 minutes. Each worker handles one submission at a time (CPU isolation).

![Code Execution Architecture](../../assets/system_design_template_12_leetcode.png)
