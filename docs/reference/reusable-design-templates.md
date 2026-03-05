# Reusable Design Templates

> **How to use this file:** Map any interview question to one of 12 battle-tested blueprints below. Each template follows the same structure: understand the pattern → confirm requirements → estimate scale → walk through the architecture → nail the trade-offs. Read the template before your interview, and you will know exactly what to say.

---

## How to Use These Templates in an Interview

Every template below follows this interview-ready structure:

| Section | What to do | Time |
|---|---|---|
| **Recognize the Pattern** | Say which template this maps to and why | 30 sec |
| **Clarify Requirements** | Ask the checklist questions out loud | 3–5 min |
| **Estimate Scale** | Write the numbers on the whiteboard | 3 min |
| **High-Level Design** | Draw components and data flow | 5–8 min |
| **Deep Dive** | Zoom into the 2–3 hardest parts | 10–15 min |
| **Trade-offs** | State every decision with "at the cost of" | Woven in |

---

## Template 1: Read-Heavy Content System

**Covers:** YouTube · Netflix · Dropbox · Google Photos · Imgur · Pastebin (media)

> **One-line pitch:** "This is a read-heavy media system. The core strategy is upload-once-serve-many via CDN + async transcoding. Application servers are stateless. Only metadata hits the database — media bytes never do."

---

### Recognize This Pattern When You See

- Read:Write ratio ≥ 100:1
- Users upload content, millions stream/view it
- Media files (video, images, docs) are the primary payload

---

### Requirements Checklist

Ask these out loud before drawing anything:

**Functional**
- [ ] Upload and store videos/files?
- [ ] Stream or download on playback?
- [ ] Multiple quality levels (adaptive bitrate)?
- [ ] Search, comments, likes, subscriptions?

**Non-Functional** *(these drive every architecture decision)*
- [ ] How many DAU? (e.g., 500M)
- [ ] Max file size? (e.g., 128 GB for 4K video)
- [ ] Acceptable upload latency? (e.g., "upload visible within 5 min")
- [ ] Global or single-region?
- [ ] Durability requirement? (e.g., 99.999%)

---

### Scale Estimates *(write these on the whiteboard)*

```
DAU:               500M users
Upload rate:       500K videos/day  →  ~6 uploads/sec
Watch rate:        5B views/day     →  ~58K views/sec
Video size avg:    500 MB (1080p, 5 min)
Storage/year:      500K × 500 MB × 365 = ~91 PB/year (raw)
                   × 3 quality formats ≈ 273 PB/year
CDN cache hit:     ~95% (popular content served from edge)
Read:Write ratio:  ~10,000:1
```

---

### Architecture Components

| Component | Purpose | Technology |
|---|---|---|
| API Gateway | Auth, rate limiting, routing | NGINX / Kong |
| Upload Service | Receives raw file, writes to S3 | Go / Node.js |
| Message Queue | Decouples upload from processing | Kafka / SQS |
| Transcoding Workers | Encode to 5 resolutions | FFmpeg on EC2/Lambda |
| Object Store | Raw + encoded media files | Amazon S3 |
| CDN | Serve media at edge, ~95% cache hit | CloudFront / Akamai |
| Metadata DB | Video titles, descriptions, user data | PostgreSQL (primary) |
| Cache | Hot metadata, recommendations | Redis (TTL 1 hr) |
| Search Service | Full-text search on titles/tags | Elasticsearch |
| ML Pipeline | Pre-compute recommendations | Spark + Redis |

---

### Step-by-Step Design

**Upload Flow (Write Path)**
```
Client → API Gateway (auth + rate limit)
       → Upload Service → S3 (raw file, multipart)
       → Kafka "upload-complete" event
       → Transcoding Workers (FFmpeg: 1080p, 720p, 480p, 360p, 144p)
       → Each format → S3
       → Update PostgreSQL: status = READY, cdn_url = ...
       → Invalidate/warm CDN cache
```

**Watch Flow (Read Path)**
```
Client → CDN (cache hit ~95%) → return video bytes
       ↓ cache miss
       → S3 origin → stream via HTTP Range Requests
       (Application servers NEVER touch media bytes)
```

**Metadata / Search**
```
Video metadata → PostgreSQL (writes)
               → Redis cache (reads, TTL 1h)
               → Read replicas (10×) for scale

Search query → Elasticsearch (synced from PostgreSQL via CDC)
```

**Recommendations**
```
Offline ML pipeline (nightly)
→ Pre-computed lists per user
→ Stored in Redis
→ Served in <1ms on homepage load
```

---

### Deep Dive: The Hard Parts

**1. Transcoding at Scale**
- Each video spawns 5 parallel encoding jobs
- Workers are stateless, pull from SQS, autoscale (KEDA)
- Progress updates via WebSocket back to uploader
- Failed jobs: retry with exponential backoff (max 3×)

**2. CDN Cache Invalidation**
- New upload: pre-warm CDN with `Cache-Control: public, max-age=31536000`
- Content deletion/update: `POST /invalidation` to CDN API (costly—batch them)
- Popular vs. long-tail: popular videos always cached; long-tail fetched from S3 on demand

**3. View Counter at Scale**
- ❌ `UPDATE videos SET views = views + 1` per request → DB hotspot
- ✅ Redis `INCR video:{id}:views` per request (in-memory, atomic)
- Batch flush to PostgreSQL every 60 seconds
- Accept: displayed count may lag by ~60 sec (eventual consistency)

---

### Trade-offs Table

| Decision | Option A | Option B | **Our Choice** | Why |
|---|---|---|---|---|
| Media delivery | App server streams | CDN serves directly | **CDN** | 100× cheaper, lower latency |
| Transcoding | Sync (slow upload) | Async (Kafka+workers) | **Async** | Upload completes instantly |
| View counts | Exact (DB write per view) | Approximate (Redis batch) | **Approximate** | 58K/sec → DB can't handle |
| Recommendations | Real-time | Pre-computed (offline) | **Pre-computed** | Adds ML complexity but instant reads |

---

### Interview Talking Points *(say these out loud)*

> "Media bytes flow through S3 and CDN exclusively — application servers never touch them. This is the key insight that makes this system scale."

> "Transcoding is async. The upload returns immediately; the user sees 'processing' status while Kafka queues the encoding jobs."

> "View counts use eventual consistency deliberately. Showing 1,523,441 vs 1,523,443 is not a business problem. DB consistency at 58K writes/sec is."

![Read-Heavy System Architecture](../../assets/system_design_template_01_youtube.png)

---

## Template 2: Social Feed / Write-Heavy System

**Covers:** Twitter/X · Instagram · Facebook News Feed · LinkedIn · Reddit · TikTok

> **One-line pitch:** "This is a social feed with massive fan-out. The core challenge is: when a user posts, we need to update millions of followers' feeds without killing the database. The answer is hybrid push/pull — push for regular users, pull for celebrities."

---

### Recognize This Pattern When You See

- Users follow other users; post content
- Need to show a personalized, ranked feed
- Write amplification problem: 1 post → N follower feed updates
- Mix of power users (millions of followers) and regular users

---

### Requirements Checklist

**Functional**
- [ ] Post tweets/photos/videos?
- [ ] See a personalized home feed?
- [ ] Follow/unfollow users?
- [ ] Like, repost, comment?
- [ ] Real-time notifications?

**Non-Functional**
- [ ] DAU? (e.g., 300M)
- [ ] Acceptable feed staleness? (e.g., eventual consistency OK)
- [ ] Celebrity threshold for pull vs push? (e.g., 10K followers)
- [ ] Feed size limit? (e.g., top 1000 items)

---

### Scale Estimates

```
DAU:              300M users
Avg follows:      200 people per user
Posts/day:        100M  →  ~1,160 posts/sec
Read rate:        10B feed reads/day  →  ~115K reads/sec
Fan-out factor:   avg 200 followers → 200 × 1,160 = 232K write ops/sec
Max celebrity:    100M followers (e.g., Elon Musk)
Read:Write ratio: ~100:1
Feed Redis size:  300M users × 1000 tweet IDs × 8 bytes = ~2.4 TB Redis
```

---

### Architecture Components

| Component | Purpose | Technology |
|---|---|---|
| Write API | Validate and persist post | Node.js / Go |
| Posts DB | Source of truth for all posts | Cassandra (partition: user_id) |
| Fan-out Service | Push tweet IDs to follower feeds | Kafka consumers |
| Feed Cache | Per-user feed (list of post IDs) | Redis List (LPUSH/LTRIM) |
| Feed API | Hydrate feed: IDs → full posts | Go service |
| Object Store | Photos, videos | S3 + CDN |
| Graph DB / Table | Follower/following relationships | PostgreSQL or Cassandra |
| Notification Service | Push notifications, emails | Kafka → FCM/APNs |
| Celebrity Service | Pull recent posts for mega-accounts | Separate read path |

---

### Step-by-Step Design

**Post Creation (Write Path)**
```
Client → POST /tweet → API Gateway
       → Validate (auth, rate limit, content policy)
       → Write to Cassandra: {tweet_id, user_id, content, media_url, timestamp}
       → Publish to Kafka: "new-post" topic {tweet_id, user_id, follower_count}
```

**Fan-out Service (Async)**
```
Kafka Consumer reads "new-post"
→ IF follower_count < 10,000 (regular user):
    Fetch follower list from Graph DB
    For each follower:
      LPUSH user:{follower_id}:feed {tweet_id}
      LTRIM user:{follower_id}:feed 0 999   (keep latest 1000)
→ IF follower_count ≥ 10,000 (celebrity):
    SKIP fan-out (too expensive)
    Tag tweet as "celebrity post" in a separate sorted set
```

**Feed Read (Read Path)**
```
GET /feed → Redis LRANGE user:{id}:feed 0 19  (20 tweet IDs)
           + ZRANGE celebrity_posts:{user_id} 0 4  (5 latest celebrity posts)
           → Merge and deduplicate by timestamp
           → Batch fetch tweet content + user profiles (Redis or Cassandra)
           → Return ranked feed
```

---

### Deep Dive: The Hard Parts

**1. The Celebrity Problem**
- Pushing to 100M followers on every tweet = 100M Redis writes in seconds
- Solution: Don't. At read time, pull the last 20 tweets from celebrities you follow and merge with your pre-built feed
- Merge logic: union of push-feed + celebrity pulls, sorted by timestamp, deduped

**2. Feed Ranking**
- Chronological: trivial (sort by timestamp)
- Algorithmic (like Instagram): offline ML scores each post → score stored in feed cache → sort by score, not time

**3. Hot User Problem**
- A celebrity posts → millions of fans' feeds need updating
- Solution: Kafka partitioning by user_id ensures ordering. Fan-out workers autoscale. Rate-limit the writes (eventual consistency — fans see the tweet in seconds, not milliseconds)

---

### Trade-offs Table

| Decision | Option A | Option B | **Our Choice** | Why |
|---|---|---|---|---|
| Feed delivery | Push (fan-out on write) | Pull (on demand) | **Hybrid** | Pure push kills DB for celebrities; pure pull is slow |
| Feed storage | DB query | Redis pre-built list | **Redis** | 115K reads/sec → DB can't keep up |
| Post storage | SQL (joins) | Cassandra (denormalized) | **Cassandra** | 1,160 writes/sec, timeline queries by user |
| Celebrity threshold | None (always push) | 10K followers | **10K** | Empirical sweet spot (Twitter's actual threshold) |

---

### Interview Talking Points

> "The core tension is write amplification. If we push to all followers on every post, a celebrity with 100M followers causes 100M Redis writes per tweet. The hybrid model is the industry-standard solution."

> "Feed reads come from Redis — they are O(1). The only computation is at write time (fan-out) and at merge time (celebrity pull + rank)."

> "I'd use Cassandra for posts because it's optimized for time-series writes and timeline queries by user_id with timestamp ordering."

![Social Feed System Architecture](../../assets/system_design_template_02_twitter.png)

---

## Template 3: Real-time Chat System

**Covers:** WhatsApp · Slack · Messenger · Discord · iMessage (server side)

> **One-line pitch:** "This is a real-time bidirectional messaging system. The key insight is: HTTP is request-response and doesn't work for real-time push. We need persistent WebSocket connections, routing via Redis, and Cassandra for message storage because it's optimized for high-write, time-ordered queries."

---

### Recognize This Pattern When You See

- Messages must be delivered in milliseconds (not seconds)
- Both sender and receiver need to see updates without polling
- Offline message delivery required
- Message ordering guarantees matter

---

### Requirements Checklist

**Functional**
- [ ] 1:1 and/or group messages?
- [ ] Online/offline status (presence)?
- [ ] Message delivery receipts (sent/delivered/read)?
- [ ] Media (images, files)?
- [ ] Message history / search?

**Non-Functional**
- [ ] DAU? (e.g., 500M)
- [ ] Max group size? (e.g., 1000 members)
- [ ] Message delivery latency? (e.g., < 100ms for online users)
- [ ] Message retention? (e.g., 7 years)

---

### Scale Estimates

```
DAU:                500M users
Messages/day:       100B  →  ~1.16M messages/sec
Avg message size:   1 KB (text) + media URL
Storage/day:        100B × 1KB = ~100 TB/day
Concurrent WS conn: ~100M at peak (20% DAU online)
Messages per user:  200/day
```

---

### Architecture Components

| Component | Purpose | Technology |
|---|---|---|
| WebSocket Servers | Maintain persistent connections | Golang (high concurrency) |
| Connection Router | user_id → server mapping | Redis Hash |
| Chat Service | Route, persist, fan-out messages | Go microservice |
| Message Store | Ordered message history | Cassandra |
| Redis Pub/Sub | Cross-server message delivery | Redis |
| Presence Service | Online/offline status | Redis (TTL-based heartbeat) |
| Notification Service | Push to offline users | FCM / APNs |
| Media Service | Upload/serve files | S3 + CDN |

---

### Step-by-Step Design

**Connection Setup**
```
User opens app → WebSocket handshake to Chat Server
Load balancer: consistent hashing on user_id → same server on reconnect
Chat Server: HSET user_connections {user_id: server_address}   (Redis)
             SETEX presence:{user_id} 30 "online"              (Redis, heartbeat every 15s)
```

**Send Message**
```
Sender → WebSocket → Chat Server A
Chat Server A:
  1. Validate (auth, content policy, rate limit)
  2. Persist to Cassandra:
     - partition key: conversation_id
     - clustering key: message_id (Snowflake ID, time-ordered)
     - fields: sender_id, content, type, status=SENT, timestamp
  3. PUBLISH to Redis channel "conv:{conversation_id}" {message payload}
  4. ACK sender: {message_id, status: SENT}
```

**Deliver to Recipient**
```
All Chat Servers subscribed to "conv:{conversation_id}"
→ Server B has recipient's WebSocket
→ Server B receives message via Redis Pub/Sub
→ Server B pushes to recipient's WebSocket
→ Recipient ACKs → Server B updates Cassandra: status=DELIVERED
→ Recipient opens message → status=READ → broadcast read receipt
```

**Offline Delivery**
```
Redis Pub/Sub delivery fails (no server has recipient's socket)
→ Chat Service: RPUSH offline:{user_id} {message_id}
→ Notification Service: sends FCM/APNs push notification
→ User comes online → WebSocket connects → LRANGE offline:{user_id} 0 -1
  → Fetch full messages from Cassandra → deliver in order → clear offline queue
```

---

### Deep Dive: The Hard Parts

**1. Message Ordering**
- Use Snowflake IDs as message_id: 41-bit timestamp + 10-bit machine ID + 12-bit sequence
- Cassandra clustering key = message_id → physical time ordering guaranteed per partition
- If two messages arrive simultaneously: Snowflake ensures strict ordering

**2. Large Groups (Slack channels with 10K+ members)**
- Don't fan-out via Redis Pub/Sub (too many server hops)
- Use Kafka: message → Kafka topic `"group:{id}"` → each Chat Server that has a member online consumes the topic
- Servers deduplicate delivery to their connected members

**3. Message Guarantee**
- At-least-once delivery: ACK from client required; retry if no ACK in 5s
- Exactly-once display: client deduplicates by message_id before rendering

---

### Trade-offs Table

| Decision | Option A | Option B | **Our Choice** | Why |
|---|---|---|---|---|
| Transport | HTTP polling | WebSocket | **WebSocket** | Polling = high latency + server load |
| Message DB | MySQL | Cassandra | **Cassandra** | Write-heavy, time-ordered, scales horizontally |
| Cross-server routing | Sticky sessions | Redis Pub/Sub | **Redis Pub/Sub** | Stateless servers, no sticky session hell |
| Group fan-out | Redis Pub/Sub | Kafka | **Kafka for large groups** | Pub/Sub can't fan-out to 10K+ members reliably |

---

### Interview Talking Points

> "The fundamental problem with HTTP is that the server can't push to the client. WebSockets solve this with a persistent, full-duplex connection."

> "I store messages in Cassandra partitioned by conversation_id. This means fetching a conversation's history is a single-partition scan — extremely fast."

> "Redis is the routing table: it maps each online user to the Chat Server that holds their WebSocket. Without this, Server A can't know that the recipient is on Server B."

![Real-time Chat Architecture](../../assets/system_design_template_03_whatsapp.png)

---

## Template 4: Location-Based Service

**Covers:** Uber/Lyft (ride matching) · Yelp (business search) · Google Maps · Tinder (proximity) · DoorDash

> **One-line pitch:** "This is a geospatial system. The core challenge is: how do you efficiently query 'find all drivers within 5km of this point' over millions of live locations? The answer is Redis GEORADIUS using geohash — sub-millisecond for millions of points, updated every few seconds."

---

### Recognize This Pattern When You See

- Need to find things near a point (drivers, restaurants, users)
- Location data updates in real-time
- Queries like "nearest X within Y km"

---

### Requirements Checklist

**Functional (Uber)**
- [ ] Drivers update their location continuously?
- [ ] Rider requests a ride → match to nearest available driver?
- [ ] Calculate ETA and route?
- [ ] Trip tracking in real-time?

**Non-Functional**
- [ ] How many active drivers at peak? (e.g., 1M)
- [ ] Location update frequency? (e.g., every 4 sec for drivers)
- [ ] Matching latency? (e.g., < 1 sec to show available drivers)
- [ ] Geographic scope? (global vs. city-by-city)

---

### Scale Estimates

```
Active drivers at peak:    1M worldwide
Location updates:          1M drivers × 1 update/4sec = 250K writes/sec
Rider requests:            10M rides/day  →  ~115 requests/sec
Search radius:             5 km
Geohash precision 6:       covers ~1.2km × 0.6km cell
Redis GEORADIUS query:     <1ms for 1M points
Location data size:        1M drivers × 40 bytes = ~40 MB (trivially fits in RAM)
```

---

### Architecture Components

| Component | Purpose | Technology |
|---|---|---|
| Location Service | Ingest driver location updates | Golang + Redis |
| Redis Geo | Real-time spatial index | `GEOADD`, `GEORADIUS` |
| Matching Service | Match rider to nearest driver | Go + Redis |
| Trip Service | Manage active trip state | PostgreSQL |
| Route Service | Shortest path computation | In-memory road graph (Dijkstra/A*) |
| ETA Service | Estimate arrival time | Route + traffic data |
| Cassandra | Historical location/trip data | Partitioned by driver_id |
| WebSocket Server | Real-time position streaming to rider | Go |

---

### Step-by-Step Design

**Driver Location Updates**
```
Driver app (every 4 sec) → HTTPS or WebSocket → Location Service
Location Service:
  GEOADD active_drivers {longitude} {latitude} {driver_id}
  SET driver:{id}:meta {status, rating, car_type}  EX 30   (TTL: driver goes offline after 30s without update)
```

**Rider Requests a Ride**
```
Rider: POST /ride {pickup_lat, pickup_lng, car_type}
Matching Service:
  GEORADIUS active_drivers {lat} {lng} 5 km ASC COUNT 10
  → returns [driver_id_1, driver_id_2, ...] sorted by distance
  → Filter by car_type, rating, availability
  → Offer trip to closest driver (timeout 10 sec)
  → Driver accepts → create Trip in PostgreSQL
  → Driver declines → offer to next driver
```

**Real-time Trip Tracking**
```
Driver location → Location Service → Redis Geo (update position)
                                   → WebSocket push to rider: {driver_lat, driver_lng}
Rider app renders live driver position on map (updates every 4 sec)
```

**ETA Calculation**
```
Route Service: pre-loaded road graph from OpenStreetMap (in memory)
Run Dijkstra/A* from driver_location → rider_location
ETA = sum(segment_distance / segment_avg_speed)
Traffic data: refreshed every 5 min from aggregate probe vehicle data
```

**Business Search (Yelp variant)**
```
"Italian restaurants within 2km, rating > 4.0"
→ Elasticsearch: text match on cuisine + rating filter
→ Geohash filter: prefix match on geohash of search point
  (neighbors share geohash prefix → efficient bounding-box query)
→ Merge results, return sorted by relevance × distance
```

---

### Deep Dive: The Hard Parts

**1. Geohash vs QuadTree**
| | Geohash | QuadTree |
|---|---|---|
| Storage | String key in Redis | Tree structure in memory |
| Range query | String prefix match | Recursive split |
| Dynamic updates | O(1) with Redis | Rebalancing needed |
| **Best for** | Real-time driver updates | Static business data |

**2. Hot Geohash Cells**
- Problem: Manhattan rush hour — 10K drivers in one tiny geohash cell
- Solution: Dynamic radius expansion (start at 1km, expand if fewer than 3 drivers found)

**3. Driver Goes Offline**
- Redis key TTL: if no update in 30 sec, driver entry auto-expires from the geo index
- Matching service gets stale entry? Ping driver directly; if no ACK, skip

---

### Trade-offs Table

| Decision | Option A | Option B | **Our Choice** | Why |
|---|---|---|---|---|
| Location store | PostgreSQL (PostGIS) | Redis Geo | **Redis** | PostGIS adds query latency; 250K updates/sec needs in-memory |
| Spatial index | QuadTree | Geohash | **Geohash** | Easier to implement in Redis, O(1) updates |
| Driver matching | Polling (rider polls) | Push (server pushes) | **Push via WebSocket** | Polling creates unnecessary load; WS gives real-time UX |
| Route computation | External API | In-house A* | **In-house** | External API = cost + latency + vendor lock-in at scale |

---

### Interview Talking Points

> "The entire active driver dataset — 1 million locations — fits in ~40 MB of RAM. Redis GEORADIUS queries this in under a millisecond. This is why Redis is the right tool here, not PostGIS."

> "Geohash converts 2D coordinates into a 1D string. Nearby locations share string prefixes, so a prefix query returns all neighbors. That's the magic that makes geo queries O(prefix_length)."

> "Drivers that stop updating their location are automatically evicted from the index via Redis TTL — no cleanup job needed."

![Location-Based Service Architecture](../../assets/system_design_template_04_uber.png)

---

## Template 5: URL Shortener / Unique ID Generation

**Covers:** TinyURL · Bit.ly · Pastebin · Short links in any product · Snowflake ID generation

> **One-line pitch:** "This is a unique ID generation + redirect system. Extremely read-heavy (100:1). The entire redirect path should be served from Redis cache — the database is only hit on cache misses and new URL creation."

---

### Recognize This Pattern When You See

- Need to generate unique short codes or IDs at scale
- Massive read volume vs. tiny write volume
- Redirect latency must be < 10ms

---

### Requirements Checklist

**Functional**
- [ ] Shorten any URL? Custom aliases?
- [ ] Expiry dates on short links?
- [ ] Analytics (click counts, geographic data, referrers)?
- [ ] User accounts and link management?

**Non-Functional**
- [ ] How many new URLs/day? (e.g., 100M)
- [ ] How many redirects/day? (e.g., 10B)
- [ ] Required uniqueness space? (How long should the code be?)
- [ ] Availability requirement? (e.g., 99.99%)

---

### Scale Estimates

```
New URLs/day:       100M  →  ~1,160 writes/sec
Redirects/day:      10B   →  ~115K reads/sec
Read:Write ratio:   ~100:1
Short code length:  7 chars Base62 = 62^7 = 3.5 trillion unique URLs (enough for 1000 years)
Storage/URL:        ~500 bytes (URL + metadata)
Storage/year:       100M/day × 365 × 500B = ~18 TB/year
Redis cache:        Hot 20% of URLs serve 80% of traffic
                    20% of 10B = 2B unique short codes × 500B = ~1 TB Redis
```

---

### Architecture Components

| Component | Purpose | Technology |
|---|---|---|
| Write API | Accept long URL, return short code | Go / Python |
| ID Generator | Generate unique short codes | Counter + Base62 OR Hash |
| Redirect Service | 302 redirect from short → long URL | Go (stateless) |
| Cache | short_code → long_url lookups | Redis (LRU eviction) |
| Database | Source of truth for all URLs | PostgreSQL |
| Analytics Pipeline | Click events → aggregated stats | Kafka → ClickHouse |
| Expiry Worker | Remove expired URLs | Cron + PostgreSQL |

---

### Step-by-Step Design

**Short Code Generation — Two Approaches**

```
Option A: Hash-based
  MD5/SHA256(long_url) → take first 7 chars
  Collision: try chars 2-8, then 3-9, etc.
  ✓ Same URL always produces same code (dedup built-in)
  ✗ Hash collisions require retry logic

Option B: Counter + Base62 (preferred)
  Global counter (Redis INCR or DB sequence) → encode to Base62
  Base62 alphabet: a-z A-Z 0-9 (62 chars)
  Counter 1 → "000000b", 1B → "15ftgG"
  ✓ No collisions. Guaranteed unique. Deterministic length.
  ✗ Predictable (users can enumerate URLs if sequential)
  Fix: add salt or shuffle the Base62 alphabet
```

**Database Schema**
```sql
CREATE TABLE urls (
  short_code VARCHAR(10) PRIMARY KEY,
  long_url   TEXT NOT NULL,
  user_id    BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  click_count BIGINT DEFAULT 0,
  INDEX idx_user_id (user_id)
);
```

**Redirect Flow**
```
GET /{short_code}
→ Redis GET short_code (cache hit <1ms → 302 redirect to long_url)
→ Cache miss → PostgreSQL SELECT long_url WHERE short_code = ?
  → if not found: 404
  → if expired: 410 Gone
  → found: SET Redis short_code long_url EX 86400 (24h TTL)
         → async push click event to Kafka
         → 302 redirect
```

**301 vs 302 Redirect**
```
301 Permanent: browser caches the redirect
  ✓ Subsequent clicks never hit your server (zero infra cost)
  ✗ You lose all click analytics (browser skips your server)

302 Temporary: browser always hits your server
  ✓ Every click goes through you → full analytics
  ✗ Higher server load

→ Use 302 if analytics matter (it almost always does)
```

**Analytics**
```
Click event → Kafka → Stream processor → ClickHouse
Metrics per short_code: total clicks, unique visitors, countries, referrers, devices
Serve analytics dashboard via ClickHouse aggregation queries
```

---

### Deep Dive: The Hard Parts

**1. Cache Eviction Strategy**
- LRU eviction: evict least recently used short codes
- Most short links are viral for a day, then dead → LRU is perfect here
- Cache hit rate ~95% for popular links (20% of URLs = 80% of traffic)

**2. Expiry**
- Store `expires_at` in PostgreSQL
- On redirect: check expiry before returning long_url
- Cleanup: nightly cron `DELETE FROM urls WHERE expires_at < NOW()`
- For immediate expiry: Redis TTL auto-removes the cache entry

**3. Custom Aliases**
- User provides `abc123` → check for collision → write to DB
- If collision: return error ("alias taken"), ask user to choose another

---

### Trade-offs Table

| Decision | Option A | Option B | **Our Choice** | Why |
|---|---|---|---|---|
| ID generation | Hash (MD5) | Counter + Base62 | **Counter** | No collisions; simpler retry logic |
| Redirect code | 301 Permanent | 302 Temporary | **302** | Analytics > infra savings |
| Cache strategy | Write-through | Cache-aside | **Cache-aside** | Populate only on first read; saves memory |
| Analytics | Sync (in redirect) | Async (Kafka) | **Async** | Don't add redirect latency for analytics |

---

### Interview Talking Points

> "7 characters of Base62 gives us 3.5 trillion unique short codes — that's enough for 1,000 years at 100M URLs/day. Length is a function of the uniqueness space, not aesthetics."

> "We use 302 redirects, not 301. 301 means the browser permanently caches the redirect — you never see the click again. For any product with analytics, 302 is the only reasonable choice."

> "The entire read path (115K redirects/sec) goes through Redis. The database handles maybe 5K requests/sec (cache misses + writes). This is how we scale to 10B redirects/day on modest hardware."

![URL Shortener Architecture](../../assets/system_design_template_05_url_shortener.png)

---

## Template 6: Rate Limiter System

**Covers:** API rate limiting · DDoS protection · Per-user quotas · Throttling in any microservice

> **One-line pitch:** "Rate limiting enforces per-user or per-endpoint request quotas. The core choice is algorithm (Token Bucket is best for bursts) and where to enforce (API Gateway + shared Redis state). The hardest part is making the check atomic to avoid race conditions."

---

### Recognize This Pattern When You See

- Need to prevent any single user or IP from overwhelming a service
- Different tiers of users have different quotas
- Must be enforced across multiple API server instances

---

### Requirements Checklist

**Functional**
- [ ] Rate limit by user ID? IP address? API key? Tenant?
- [ ] Different limits per endpoint? (e.g., /search = 10/sec, /post = 100/day)
- [ ] Tiered limits (free vs. pro vs. enterprise)?
- [ ] Soft limits (throttle) or hard limits (reject with 429)?

**Non-Functional**
- [ ] How many API servers? (i.e., must Redis be shared)
- [ ] Acceptable rate-limit check latency? (< 1ms add)
- [ ] What happens if Redis is down? (fail-open vs fail-closed)

---

### Scale Estimates

```
API requests:        100K req/sec
Rate-limit checks:   100K/sec (one per request)
Unique users:        10M active
Redis key per user:  ~100 bytes
Total Redis size:    10M × 100B = ~1 GB (trivial)
Redis throughput:    100K ops/sec (well within single Redis node limits)
Rate-limit latency:  <1ms added to each request
```

---

### Architecture Components

| Component | Purpose | Technology |
|---|---|---|
| API Gateway | Intercepts every request, calls Rate Limiter | Kong / NGINX / Envoy |
| Rate Limiter Service | Stateless workers; checks against Redis | Go microservice |
| Redis Cluster | Shared state: per-user counters and tokens | Redis (single-digit ms) |
| Config Store | Quota rules per tier/endpoint | Redis or DB |
| Monitoring | Alert on abuse patterns | Prometheus + Grafana |

---

### Step-by-Step Design

**Algorithm: Token Bucket (Recommended)**
```
Each user has a "bucket" with:
  - capacity C (max burst)
  - refill rate R tokens/second

On each request:
  tokens = current_tokens + (elapsed_seconds × R)
  tokens = min(tokens, C)  # cap at capacity
  if tokens >= 1:
    tokens -= 1 → ALLOW request
  else:
    → REJECT with HTTP 429

Stores per user: {last_refill_timestamp, current_tokens}
```

**Other Algorithms (know when to mention each)**
| Algorithm | Best For | Trade-off |
|---|---|---|
| Token Bucket | Bursts allowed (most APIs) | Slightly complex state |
| Fixed Window | Simple quota (100/hour) | Boundary spikes (99 req at :59, 100 at :00) |
| Sliding Window Log | Exact enforcement | Memory: stores all timestamps |
| Sliding Window Counter | Approximate + memory-efficient | Interpolates between windows |

**Atomic Redis Implementation (Lua Script)**
```lua
-- Lua script runs atomically on Redis server (no race conditions)
local key = KEYS[1]           -- "ratelimit:{user_id}"
local capacity = ARGV[1]       -- 100
local refill_rate = ARGV[2]    -- 10 per second
local now = ARGV[3]            -- current timestamp (ms)

local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(bucket[1]) or capacity
local last_refill = tonumber(bucket[2]) or now

local elapsed = (now - last_refill) / 1000
tokens = math.min(capacity, tokens + elapsed * refill_rate)

if tokens >= 1 then
  tokens = tokens - 1
  redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
  redis.call('EXPIRE', key, 3600)
  return 1  -- ALLOW
else
  return 0  -- REJECT
end
```

**Response Headers (always return these)**
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit:     100
X-RateLimit-Remaining: 0
X-RateLimit-Reset:     1703030400   (Unix timestamp when tokens refill)
Retry-After:           30           (seconds until next allowed request)
```

**Tiered Limits**
```
User tier stored in JWT / user profile:
  Free:       100 req/min,   1,000 req/day
  Pro:        1,000 req/min, 50,000 req/day
  Enterprise: custom (stored in Config DB)

Rate Limiter reads tier from user context → applies correct bucket config
```

---

### Deep Dive: The Hard Parts

**1. Distributed Race Condition**
- Problem: Two API servers check simultaneously → both see tokens = 1 → both allow → effectively 2 tokens consumed
- Solution: Lua script evaluated atomically on Redis → no TOCTOU race condition
- Alternative: Redis `MULTI/EXEC` (transaction) — less flexible but simpler

**2. Redis Failure Modes**
| Strategy | Behavior | Use When |
|---|---|---|
| **Fail open** | Allow all requests if Redis is down | External-facing APIs (availability > security) |
| **Fail closed** | Reject all requests if Redis is down | Financial APIs, billing endpoints |
| **Local fallback** | Each server maintains its own counter | Best balance (eventual consistency) |

**3. Distributed Rate Limiting Across DCs**
- Each DC has its own Redis cluster
- Limit = global_limit / num_DCs (e.g., 100 req/min → 50 per DC)
- Slight over-allowance at DC boundaries is acceptable

---

### Trade-offs Table

| Decision | Option A | Option B | **Our Choice** | Why |
|---|---|---|---|---|
| Algorithm | Fixed Window | Token Bucket | **Token Bucket** | Handles bursts; no boundary spike problem |
| Atomicity | MULTI/EXEC | Lua Script | **Lua Script** | Fewer round trips; single atomic operation |
| Failure | Fail-closed | Fail-open | **Fail-open** | Availability > occasional quota violation |
| Enforcement | Per server | Centralized Redis | **Centralized** | Per-server allows N× the quota with N servers |

---

### Interview Talking Points

> "The critical requirement for distributed rate limiting is atomicity — the check and decrement must be a single atomic operation. Without this, concurrent requests from multiple API servers will all see 'tokens available' and all be allowed, violating the quota."

> "I'd use a Lua script in Redis. The Lua evaluator on Redis runs scripts atomically, so no two scripts can interleave. It's more efficient than MULTI/EXEC because it's a single round trip."

> "If Redis goes down, I'd fail open — allow all requests — rather than take down the entire API. We might over-serve some users for a few seconds, but that's better than complete unavailability."

![Rate Limiter Architecture](../../assets/system_design_template_06_rate_limiter.png)

---

## Template 7: Realtime Monitoring & Metrics System

**Covers:** Datadog · Prometheus + Grafana · CloudWatch · Application Performance Monitoring (APM)

> **One-line pitch:** "This is a high-ingest time-series system. The core challenges are: (1) ingesting millions of metrics/second without dropping any, (2) querying arbitrary time ranges efficiently, and (3) alerting within seconds of a threshold breach."

---

### Recognize This Pattern When You See

- Ingest high-volume time-stamped numeric data
- Need to query: "show me CPU usage for service X over the last 6 hours"
- Alert when a metric crosses a threshold
- Long-term storage with downsampling

---

### Requirements Checklist

**Functional**
- [ ] Which metrics? (CPU, memory, latency, error rate, custom business metrics?)
- [ ] Dashboards and real-time visualization?
- [ ] Alerting (threshold-based? anomaly detection?)?
- [ ] Log correlation with metrics?

**Non-Functional**
- [ ] Ingestion rate? (e.g., 1M metrics/sec)
- [ ] Query latency? (e.g., dashboard loads in < 3 sec)
- [ ] Retention? (e.g., 1 year full fidelity, 5 years downsampled)
- [ ] Number of services/hosts? (e.g., 10K services, 100K hosts)

---

### Scale Estimates

```
Services monitored:   10,000
Metrics per service:  50 (CPU, mem, latency p50/p95/p99, error rate, etc.)
Hosts per service:    10 avg
Metrics/sec:          10K × 50 × 10 × 1/10sec = 500K metrics/sec
Data point size:      ~40 bytes (timestamp 8B + value 8B + labels 24B)
Raw storage/day:      500K × 40B × 86,400 = ~1.7 TB/day
After downsampling:   1-min resolution after 24h → 60× compression → ~1 TB/month
```

---

### Architecture Components

| Component | Purpose | Technology |
|---|---|---|
| Agents/Exporters | Collect metrics from each host | Prometheus exporter / Telegraf |
| Ingest API | HTTP endpoint for metric push | Go service |
| Kafka | Buffer + replay, decouple ingest from storage | Kafka (3 brokers) |
| Stream Processor | Pre-aggregate and route | Kafka Streams / Flink |
| Time-Series DB | Store metric data | Prometheus / InfluxDB / Cassandra |
| Query Engine | Execute PromQL / SQL | Thanos / VictoriaMetrics |
| Alert Engine | Evaluate rules, fire notifications | Alertmanager / PagerDuty |
| Dashboard | Visualize metrics | Grafana |
| Long-term Store | Compressed historical data | S3 (Thanos sidecar) |

---

### Step-by-Step Design

**Ingestion Path**
```
Host agent (every 10 sec) → scrape all metrics locally
→ Push batch to Ingest API via HTTP
→ Ingest API → Kafka topic "metrics" (partition by service_name)

Kafka → Stream Processor:
  - Validate and parse
  - Tag enrichment (add region, team, environment labels)
  - Pre-aggregate: sum counters in 30-sec windows (reduces cardinality)
  - Route to Time-Series DB
```

**Storage Schema (Cassandra approach)**
```
CREATE TABLE metrics (
  service_name TEXT,
  metric_name  TEXT,
  bucket_date  DATE,          -- partition key (day boundary)
  timestamp    BIGINT,        -- clustering key (nanoseconds)
  value        DOUBLE,
  tags         MAP<TEXT, TEXT>,
  PRIMARY KEY ((service_name, metric_name, bucket_date), timestamp)
) WITH CLUSTERING ORDER BY (timestamp ASC);

-- Query: "CPU usage for web-server on 2024-01-15 between 14:00 and 16:00"
-- → single partition scan, no cross-partition joins
```

**Downsampling Policy**
```
Raw (10-sec resolution):  keep for 24 hours
1-min resolution:         keep for 30 days    (60× compression)
1-hour resolution:        keep for 1 year     (360× compression)
1-day resolution:         keep indefinitely

Run nightly downsampling job:
  SELECT * FROM metrics WHERE bucket_date = yesterday
  → aggregate into 1-min buckets → write to metrics_1min table
  → delete raw data older than 24h
```

**Alerting**
```
Alert Rules (e.g., "CPU > 90% for 5 consecutive minutes"):
  Alert Engine queries TSDB every 60 sec
  Evaluates: avg(cpu_usage{service="web"}) over 5m > 0.9
  → If true for 5 checks: fire alert → PagerDuty webhook → SMS/Slack

Anomaly detection:
  Z-score: alert if value > mean ± 3σ (detects unknown-unknowns)
  Seasonal: ARIMA model for time-of-day seasonality
```

---

### Deep Dive: The Hard Parts

**1. High Cardinality**
- Problem: `{user_id=12345}` as a label creates one time series per user → billions of series
- Solution: Never use high-cardinality labels (user_id, request_id) as metric labels
- Rule: Labels should have bounded cardinality (service, region, status_code — hundreds of values, not millions)

**2. Query Performance**
- Pre-aggregate on write: store per-minute rollups alongside raw data
- Columnar layout: store values for a metric across time contiguously (great for range scans)
- Caching: popular dashboard queries cached in Redis for 30 seconds

**3. Long-term Retention (Thanos pattern)**
```
Prometheus: stores last 2 weeks in local disk
Thanos Sidecar: continuously uploads TSDB blocks to S3
Thanos Query: can query both local Prometheus AND S3 history
→ Infinite retention at S3 cost (~$23/TB/month)
```

---

### Trade-offs Table

| Decision | Option A | Option B | **Our Choice** | Why |
|---|---|---|---|---|
| Storage | SQL | Cassandra / InfluxDB | **Cassandra** | Time-series workload: high-write, range-scan by time |
| Ingest buffering | Direct DB write | Kafka buffer | **Kafka** | Protects DB from ingest spikes; enables replay |
| Downsampling | None (store all raw) | Tiered retention | **Tiered** | 5-year raw retention = petabytes; impractical |
| Alert detection | Threshold only | Threshold + anomaly | **Both** | Threshold catches known issues; anomaly catches surprises |

---

### Interview Talking Points

> "Time-series data has a natural access pattern: you almost always query by service + metric + time range. This makes Cassandra ideal — partition by (service, metric, day) so any time range query is a single partition scan."

> "We never let agents write directly to the time-series DB. Kafka acts as a buffer between ingest and storage. This means a 10× traffic spike doesn't crash the database — it just fills up the Kafka queue temporarily."

> "Downsampling is not optional — it's an architectural necessity. Storing 500K metrics/sec at 10-sec resolution for 5 years requires ~3 PB. Downsampled to hourly, it's ~8 TB."

![Monitoring System Architecture](../../assets/system_design_template_07_monitoring.png)

---

## Template 8: Booking / Ticketing System

**Covers:** TicketMaster · Airbnb · OpenTable · Hotel booking · Flash sales · Seat selection

> **One-line pitch:** "This is a high-concurrency inventory system where double-booking is catastrophically wrong. The core pattern is: optimistic locking for normal load, a virtual queue for surge events, and Redis counters for read-scaling — with PostgreSQL as the single source of truth."

---

### Recognize This Pattern When You See

- Finite, unique inventory (seats, rooms, time slots)
- Must prevent double-booking absolutely
- High-concurrency bursts (Taylor Swift tickets on sale)
- Payment must be atomic with reservation

---

### Requirements Checklist

**Functional**
- [ ] Search available inventory (dates, location, category)?
- [ ] Hold a seat/room for checkout (time-limited reservation)?
- [ ] Payment integration?
- [ ] Cancellation and refunds?
- [ ] Waiting list?

**Non-Functional**
- [ ] Peak concurrent users? (e.g., 1M during Taylor Swift sale)
- [ ] Reservation hold time? (e.g., 10 minutes to complete payment)
- [ ] Overbooking allowed? (e.g., airlines sometimes; concerts never)
- [ ] Consistency requirement? (strong — no double-booking ever)

---

### Scale Estimates

```
Normal load:         100K concurrent users browsing
Surge load:          10M users hitting at ticket sale start (Taylor Swift)
Venue capacity:      80,000 seats (Allegiant Stadium)
Hold time:           10 minutes
Requests at open:    10M users × 3 req/sec = 30M req/sec for first 10 sec
Target:              Sell 80K seats, handle 10M+ concurrent users fairly
```

---

### Architecture Components

| Component | Purpose | Technology |
|---|---|---|
| API Gateway | Auth, rate limiting, routing | Kong / AWS ALB |
| Queue Service | Virtual waiting room for surge | Redis Sorted Set (FIFO by arrival time) |
| Reservation Service | Core booking logic, optimistic lock | Go + PostgreSQL |
| Inventory Cache | Available seat counts | Redis Counter |
| Payment Service | Charge user, confirm booking | Stripe / external payment gateway |
| Notification Service | Email/SMS confirmation | Kafka → SendGrid / Twilio |
| PostgreSQL | Source of truth: seats, bookings | PostgreSQL (ACID) |
| Expiry Worker | Release timed-out holds | Redis TTL + Cron |

---

### Step-by-Step Design

**Database Schema (Source of Truth)**
```sql
CREATE TABLE seats (
  seat_id      BIGINT PRIMARY KEY,
  event_id     BIGINT NOT NULL,
  section      VARCHAR(10),
  row          VARCHAR(5),
  number       INT,
  status       ENUM('AVAILABLE', 'RESERVED', 'SOLD') DEFAULT 'AVAILABLE',
  reserved_by  BIGINT,                    -- user_id
  reserved_until TIMESTAMP,              -- hold expiry
  version      INT DEFAULT 0             -- for optimistic locking
);

CREATE TABLE bookings (
  booking_id   BIGINT PRIMARY KEY,
  user_id      BIGINT,
  seat_ids     BIGINT[],
  event_id     BIGINT,
  amount_paid  DECIMAL(10,2),
  status       ENUM('PENDING', 'CONFIRMED', 'CANCELLED'),
  created_at   TIMESTAMP DEFAULT NOW()
);
```

**Normal Reservation Flow (Optimistic Locking)**
```
POST /reserve {event_id, seat_ids, user_id}

1. BEGIN TRANSACTION
2. SELECT seat_id, status, version
   FROM seats
   WHERE seat_id IN (...) FOR UPDATE        -- pessimistic lock (row-level)

3. IF any seat.status != 'AVAILABLE': ROLLBACK → 409 Conflict

4. UPDATE seats
   SET status = 'RESERVED',
       reserved_by = user_id,
       reserved_until = NOW() + INTERVAL '10 minutes',
       version = version + 1
   WHERE seat_id IN (...) AND status = 'AVAILABLE'

5. COMMIT → return {reservation_id, expires_at}
```

**Surge Handling: Virtual Queue**
```
Taylor Swift goes on sale at 10:00 AM:

1. Pre-sale: users join queue → ZADD queue:{event_id} {arrival_timestamp} {user_id}
             User sees: "You are #234,521 in line. Estimated wait: 12 minutes."

2. Queue processor (every 100ms):
   ZPOPMIN queue:{event_id} 500          -- dequeue 500 users
   For each user: issue a time-limited "checkout token" (valid 10 min)
   Redirect user to checkout with token

3. Checkout: user selects seats, submits payment using checkout token
   → Normal reservation flow above
   → Token consumed (single-use)

This limits concurrent DB load to 500 checkouts every 100ms = 5K/sec
vs. 30M concurrent → DB crash
```

**Payment → Confirmation**
```
User submits payment during hold window:
→ Payment Service: charge card via Stripe
→ On success:
    UPDATE seats SET status = 'SOLD' WHERE reservation_id = ?
    INSERT INTO bookings (confirmed)
    PUBLISH to Kafka "booking-confirmed"
    → Notification Service: email PDF ticket

On failure / expiry:
    UPDATE seats SET status = 'AVAILABLE', reserved_by = NULL
    PUBLISH to Kafka "seat-released"
    → Increment Redis counter: INCR seats_available:{event_id}
```

**Read Scaling (Availability Queries)**
```
"How many seats left for event X?"
→ Redis: GET seats_available:{event_id}          -- O(1), <1ms
→ Never hit PostgreSQL for this query

"Show me available seats on the map?"
→ Redis hash: HGETALL seat_status:{event_id}     -- all seat statuses in one call
→ Refresh from DB every 5 sec or on any state change
```

---

### Deep Dive: The Hard Parts

**1. Preventing Double-Booking**
- `SELECT ... FOR UPDATE` acquires a row-level lock for the duration of the transaction
- No two transactions can hold the same row lock simultaneously → guaranteed no double-booking
- Lock is held only milliseconds (fast DB transaction) — not for the 10-minute hold period

**2. Seat Expiry**
```
Option A: Cron job every 60 sec
  UPDATE seats SET status='AVAILABLE'
  WHERE status='RESERVED' AND reserved_until < NOW()

Option B: Redis TTL (preferred)
  SET reservation:{seat_id} {user_id} EX 600    -- 10 min TTL
  Redis keyspace notification fires on expiry
  → Listener updates PostgreSQL: status = AVAILABLE
```

**3. Flash Sale: 10M Users, 80K Tickets**
- 80K winners, 9.92M losers
- Virtual queue + checkout token = fair FIFO + bounded DB load
- Redis Sorted Set for queue: O(log N) insert, O(1) dequeue

---

### Trade-offs Table

| Decision | Option A | Option B | **Our Choice** | Why |
|---|---|---|---|---|
| Concurrency control | Optimistic locking | Pessimistic (FOR UPDATE) | **Pessimistic** | High contention for popular events; optimistic = too many retries |
| Surge handling | Rate limit (reject) | Virtual queue (wait) | **Virtual queue** | Users accept waiting; rejection causes user frustration + retry storms |
| Availability queries | DB query | Redis counter | **Redis** | 10M users checking availability → DB can't handle |
| Hold expiry | Cron job | Redis TTL | **Redis TTL** | Event-driven, more accurate than polling |

---

### Interview Talking Points

> "The `SELECT ... FOR UPDATE` locks the seat row for the duration of the transaction — typically under 100ms. This is safe because we never hold DB locks across user-facing wait time. The 10-minute hold period is managed separately via Redis TTL."

> "For a Taylor Swift-scale sale, the virtual queue is non-negotiable. Without it, 10M simultaneous requests hit the reservation service, which hits PostgreSQL, which immediately falls over. The queue limits concurrent DB writes to a manageable number."

> "Availability counts come from Redis, not PostgreSQL. At 10M concurrent users refreshing every second, that's 10M DB reads/sec for a simple integer — unworkable. Redis serves this in under a millisecond."

![Booking System Architecture](../../assets/system_design_template_08_ticketmaster.png)

---

## Template 9: AI Agent System Design

**Covers:** Devin (coding agent) · Cursor · GitHub Copilot Workspace · AutoGPT · Customer support AI agents

> **One-line pitch:** "An AI agent system is an LLM wrapped in a ReAct loop with tools — it Observes context, Thinks about what to do, Acts (calls a tool), then re-Observes the result. The key design challenges are: managing the context window, preventing runaway loops, and sandboxing actions for safety."

---

### Recognize This Pattern When You See

- An AI model that takes multi-step actions autonomously
- Needs to use tools (search, execute code, call APIs)
- Must handle failures and retry
- Safety and human oversight are requirements

---

### Requirements Checklist

**Functional**
- [ ] What is the agent's task domain? (code, customer support, research?)
- [ ] What tools does the agent need? (web search, code execution, file I/O, API calls?)
- [ ] How long can tasks run? (seconds? hours? days?)
- [ ] Human-in-the-loop at any step?

**Non-Functional**
- [ ] Max concurrent agents? (cost × compute)
- [ ] Max context window? (GPT-4: 128K tokens; Claude: 200K tokens)
- [ ] Latency per step? (LLM inference: 1–10 sec/step)
- [ ] Safety requirements? (what can the agent NOT do?)

---

### Scale Estimates

```
Concurrent sessions:    10,000 agents running simultaneously
Steps per task:         avg 20 steps (Observe → Think → Act cycle)
LLM inference/step:     ~2 sec (GPT-4 Turbo)
Task duration:          avg 40 sec (20 steps × 2 sec)
Cost per task:          ~$0.10–$1.00 (varies by model + token count)
Context per step:       ~10K tokens (grows with conversation history)
Vector DB queries:      ~50ms per RAG retrieval
```

---

### Architecture Components

| Component | Purpose | Technology |
|---|---|---|
| Orchestrator | Manages agent lifecycle + task queue | Go service |
| LLM Gateway | Route to LLM, manage rate limits/retries | Python + LiteLLM |
| Sandbox VM | Isolated execution environment | Firecracker microVM |
| Tool Registry | Catalog of available tools + schemas | YAML/JSON config |
| Memory: Short-term | Current conversation context | In-process (token window) |
| Memory: Long-term | Persistent knowledge, past interactions | Vector DB (Pinecone / Weaviate) |
| Action Bus | Queue and execute tool calls | Kafka |
| Safety Layer | Filter dangerous actions before execution | Rule engine + LLM-as-judge |
| Observability | Trace every step, token, tool call | LangSmith / Datadog |

---

### Step-by-Step Design

**ReAct Loop (the core pattern)**
```
Task: "Fix the failing test in src/payment/processor.py"

STEP 1: Observe
  Context: {task, codebase_summary, available_tools}
  Available tools: [read_file, write_file, run_tests, grep, web_search]

STEP 2: Think (LLM inference)
  Prompt → LLM → Response:
  "Thought: I need to read the failing test file to understand what's breaking.
   Action: read_file(path='tests/test_payment.py')"

STEP 3: Act
  Tool dispatcher → calls read_file()
  Returns: file contents (added to context)

STEP 4: Observe (new context)
  Context now includes: task + file contents

REPEAT until LLM outputs: "Thought: I have fixed the bug. Final Answer: ..."
```

**Memory Architecture**
```
Short-term (context window):
  Full conversation history up to token limit
  When near limit: summarize older steps → compress into single message

Long-term (Vector DB RAG):
  Embeddings of: codebase files, documentation, past solutions
  On each step: retrieve top-5 relevant chunks
  Prompt: "Here is relevant context: [chunks]\n\nNow: [current task]"

Episodic memory:
  Store completed tasks + outcomes in DB
  Future agents can search: "Have we solved this type of bug before?"
```

**Sandboxed Execution**
```
For code execution:
  Spawn fresh Firecracker microVM (boot time ~125ms)
  Mount repo at /workspace (read-write)
  Set limits: CPU 2 cores, RAM 512MB, wall time 30sec, no network
  Syscall filter (seccomp): whitelist only {read, write, open, exec, fork}
  Execute command → capture stdout/stderr → return to agent
  Destroy VM after each step (ephemeral, no state leaks between tasks)
```

**Safety Layer**
```
Before every tool call:
  1. Rule-based filter:
     - BLOCK: rm -rf /, git push --force main, curl malicious.com
     - WARN: any write outside /workspace
     - ALLOW: everything else
  2. (Optional) LLM-as-judge:
     "Is this action safe? {action, context}" → YES/NO + reason
  3. Human approval gate (configurable per task):
     - Auto: proceed with safe actions
     - Supervised: pause, show human, require confirmation for writes
```

**Multi-Agent Architecture (for complex tasks)**
```
Manager Agent: decomposes task → subtasks → assigns to Worker Agents
  Worker A: "Reproduce the bug" (read + run tests)
  Worker B: "Research similar bugs in codebase" (RAG search)
  Worker C: "Write the fix" (write_file)
Manager: collects results → synthesizes → verifies → delivers

Communication: via shared Task DB (not direct agent-to-agent calls)
```

---

### Deep Dive: The Hard Parts

**1. Context Window Management**
- Every step adds to the context (Observe output + LLM response)
- At ~80% of token limit: summarize oldest steps ("I have read X files and found Y...")
- Critical: never truncate without summarizing — agent loses memory of past actions

**2. Preventing Infinite Loops**
- Hard limit: max 50 steps per task (configurable)
- Loop detection: if LLM generates same action 3× in a row → force terminate
- Cost guard: if task exceeds $5 in LLM spend → pause, alert human

**3. Tool Failures**
- LLM may hallucinate a tool call: `call_api(url="https://not-real.com/endpoint")`
- Solution: strict JSON schema for tool calls + validate before execution
- Failed tool → add error to context → LLM retries with different approach (max 3 retries per tool)

---

### Trade-offs Table

| Decision | Option A | Option B | **Our Choice** | Why |
|---|---|---|---|---|
| Memory | Full history in context | RAG + summarization | **RAG + summarization** | Context window is finite; 200K tokens ≈ 150K words |
| Execution | Direct on host | Sandboxed VM | **Sandboxed VM** | Agents run untrusted code; isolation is non-negotiable |
| Safety | Rule-based only | LLM-as-judge | **Both** | Rules catch known bad patterns; LLM catches novel ones |
| Architecture | Single agent | Multi-agent | **Multi-agent for complex tasks** | Parallelism + specialization; single agent bottlenecks on long tasks |

---

### Interview Talking Points

> "The ReAct loop — Reason then Act — is the fundamental pattern. The agent doesn't just call a function; it explains its reasoning in the prompt, then takes an action. This makes it debuggable and steerable."

> "The hardest engineering problem is context management. Every observation you add to the prompt costs tokens. At 200K tokens, you run out of space mid-task. The solution is progressive summarization — compress old steps into a summary before they hit the limit."

> "Safety is an infrastructure concern, not an LLM concern. You can't rely on the model to refuse dangerous actions. Sandboxed VMs, syscall filters, and rule-based blocklists enforce safety at the infrastructure layer."

![AI Agent Architecture](../../assets/system_design_template_09_ai_agent.png)

---

## Template 10: Typeahead / Search Autocomplete

**Covers:** Google Search autocomplete · Twitter search · E-commerce search · App global search

> **One-line pitch:** "Typeahead is a latency problem. The user types a character every ~100ms and expects suggestions in under 50ms — total round-trip. The answer is pre-computing top-N completions per prefix and serving them from an in-memory Trie or Redis Sorted Sets, not running live queries."

---

### Recognize This Pattern When You See

- Need to show suggestions as the user types
- Latency requirement: < 50ms
- Popularity-ranked results (not alphabetical)
- Large query volume (billions of searches/day)

---

### Requirements Checklist

**Functional**
- [ ] Suggestions based on historical search popularity?
- [ ] Personalized suggestions (per user history)?
- [ ] Real-time trending (Twitter-style)?
- [ ] Filtering by category or type?

**Non-Functional**
- [ ] Daily active users? (e.g., 1B)
- [ ] Latency target? (< 50ms)
- [ ] Number of distinct queries to index? (e.g., top 10M)
- [ ] How fresh must suggestions be? (real-time vs. daily batch)

---

### Scale Estimates

```
DAU:                   1B users
Searches/day:          5B  →  ~58K searches/sec
Keystrokes per search: avg 5 (each sends a suggestion request)
Suggestion requests:   58K × 5 = 290K req/sec
Distinct queries:      Top 10M (80% of searches covered)
Trie size:             10M prefixes × avg 10 completions × 50 bytes = ~5 GB (fits in RAM)
Redis Sorted Set:      10M prefixes × ~1 KB each = ~10 GB Redis
Latency target:        < 50ms (including network)
```

---

### Architecture Components

| Component | Purpose | Technology |
|---|---|---|
| Aggregation Pipeline | Count query frequencies | Kafka → Spark batch job |
| Prefix Computation | Build top-10 per prefix | Spark/Python daily job |
| Trie Service | In-memory prefix tree with completions | Go (custom Trie) |
| Redis Sorted Sets | Alternative: per-prefix ranked completions | Redis ZADD/ZREVRANGE |
| Suggestion API | Serve suggestions to clients | Go (stateless, horizontal scale) |
| CDN Cache | Cache common prefixes at edge | CloudFront |
| Trending Layer | Real-time freshness for trending queries | Kafka Streams → Redis |

---

### Step-by-Step Design

**Data Collection**
```
Every search → log event: {query: "apple", timestamp, user_id, result_count}
→ Kafka "search-events" topic
→ Daily Spark batch job:
    SELECT query, COUNT(*) as frequency
    FROM search_events
    WHERE date = yesterday
    GROUP BY query
    ORDER BY frequency DESC
    LIMIT 10M
→ Store: {query, frequency} in PostgreSQL
```

**Prefix Computation (build the index)**
```
For each query in top 10M (e.g., "apple"):
  Generate all prefixes: "a", "ap", "app", "appl", "apple"
  For prefix "app":
    Top completions = top 10 queries starting with "app" by frequency
    → ["apple" (5B), "app store" (3B), "application" (1B), ...]

Store in Redis:
  ZADD "prefix:app" 5000000000 "apple"
  ZADD "prefix:app" 3000000000 "app store"
  ZADD "prefix:app" 1000000000 "application"
  ...
```

**Serving Suggestions**
```
User types "app" (after 100ms debounce):
→ GET /suggest?q=app
→ Suggestion API:
    Redis ZREVRANGE "prefix:app" 0 9    -- top 10, descending by score → <1ms
    (+ personalization layer: boost user's past searches)
→ Return: ["apple", "app store", "application", ...]
→ Client displays in dropdown
```

**Trie (in-memory alternative)**
```
Trie node structure:
  {
    char: 'p',
    children: {Map<char, TrieNode>},
    top_completions: ["apple", "app store"]   // cached at each node
  }

Lookup "app":
  Navigate: root → 'a' → 'p' → 'p'
  Return node.top_completions → O(prefix_length) = O(3) → near-zero latency

Update: run nightly batch → rebuild Trie in background → hot-swap pointer
```

**Real-time Trending (for Twitter-style)**
```
Kafka Stream: all search queries in real-time
→ Flink: sliding 5-minute window → count queries
→ ZINCRBY "prefix:{p}" {delta} "{query}"  for each prefix of trending query
→ Serves fresher suggestions (Twitter trending hashtags update in real-time)

Two-tier:
  Trending layer: last 5 min (Kafka → Flink → Redis)
  Historical layer: top queries by all-time frequency (daily batch)
  Merge at serve time: blend trending boost into historical score
```

---

### Deep Dive: The Hard Parts

**1. Trie vs. Redis Sorted Sets**
| | In-Memory Trie | Redis Sorted Sets |
|---|---|---|
| Lookup latency | O(prefix_len) in-process | O(log N) + network hop |
| Memory | ~5 GB (must fit in RAM) | ~10 GB (Redis) |
| Updates | Rebuild + hot-swap (complex) | Incremental ZADD (simple) |
| Horizontal scale | Shard by prefix | Redis Cluster |
| **Best for** | Ultra-low latency, high read | Simpler ops, incremental updates |

**2. Personalization**
- Maintain per-user search history in Redis: `ZADD user:{id}:searches {timestamp} {query}`
- At serve time: boost score of user's past searches by 2×
- For new users: serve global suggestions only (cold-start handled automatically)

**3. CDN Caching**
- Very common prefixes ("a", "ap", "go", "py") can be cached at CDN edge
- Cache key: prefix + language (English vs. Spanish vs. etc.)
- TTL: 1 hour (balances freshness with cache hit rate)
- ~80% of all keystrokes hit CDN cache → reduces origin load dramatically

---

### Trade-offs Table

| Decision | Option A | Option B | **Our Choice** | Why |
|---|---|---|---|---|
| Index storage | In-memory Trie | Redis ZSET | **Redis** (for most) | Simpler to operate; incremental updates; Trie for Google-scale |
| Freshness | Daily batch rebuild | Real-time Kafka | **Hybrid** | Daily = stable historical; Kafka = trending on top |
| Debounce | None (every keystroke) | 100ms debounce | **100ms debounce** | 100ms unnoticeable to users; 10× fewer API calls |
| Personalization | Global ranking only | Per-user history boost | **Hybrid** | Cold start = global; warm user = personalized blend |

---

### Interview Talking Points

> "Typeahead is solved by pre-computation, not real-time querying. We pre-compute the top 10 completions for every prefix in the top 10M queries. Then serving a suggestion is a single Redis ZREVRANGE call — under 1ms."

> "The debounce is critical. Without it, typing 'apple' sends 5 requests ('a', 'ap', 'app', 'appl', 'apple'). With 100ms debounce, the first 4 keystrokes that are typed faster than 100ms apart collapse into a single request. 10× reduction in API calls with zero perceived latency difference."

> "For personalization, I'd maintain a Redis Sorted Set per user of their recent searches. At serve time, I'd boost the score of any suggestion that matches a user's past query. This gives instant personalization with no ML model needed."

![Typeahead Architecture](../../assets/system_design_template_10_typeahead.png)

---

## Template 11: Real-time Collaborative Editing

**Covers:** Google Docs · Figma · Notion · Miro · Confluence · Collaborative code editors

> **One-line pitch:** "Collaborative editing is a conflict resolution problem. When two users edit the same position simultaneously, naive last-write-wins corrupts the document. The industry solutions are OT (Operational Transformation, used by Google Docs) — which transforms concurrent ops on a central server — or CRDT (used by Figma) — which makes conflict resolution deterministic and peer-to-peer."

---

### Recognize This Pattern When You See

- Multiple users editing the same document simultaneously
- All users must converge to the same state
- Offline editing + reconnect required
- Real-time presence (cursors, selections)

---

### Requirements Checklist

**Functional**
- [ ] Text editing? Rich text? Drawings/shapes (Figma)?
- [ ] Real-time cursor/presence visibility?
- [ ] Version history / undo?
- [ ] Comments and suggestions?
- [ ] Offline support?

**Non-Functional**
- [ ] Max concurrent editors per doc? (e.g., 100)
- [ ] Max document size? (e.g., 10MB)
- [ ] Latency for edit propagation? (e.g., < 200ms)
- [ ] Version history retention? (e.g., 30 days)

---

### Scale Estimates

```
Documents:             1B
Active docs (editing): 10M concurrently
Editors per doc:       avg 3, max 100
Operations/sec/editor: ~10 (fast typing)
Total ops/sec:         10M × 3 × 10 = 300M ops/sec
Op size:               ~100 bytes (type, position, character)
Storage/day:           300M × 100B × 86400 = ~2.5 PB/day (raw ops)
Snapshots:             every 100 ops → 99% reduction = ~25 TB/day
```

---

### Architecture Components

| Component | Purpose | Technology |
|---|---|---|
| WebSocket Server | Persistent connections per editor | Go / Elixir |
| Document Server | In-memory document state + OT engine | Stateful Go service |
| Operation Log | Append-only history of all operations | PostgreSQL / Cassandra |
| Snapshot Store | Periodic full document state | S3 / PostgreSQL |
| Redis Pub/Sub | Broadcast ops to all editors | Redis |
| Presence Service | Cursors, selections, online status | Redis (ephemeral) |
| OT Engine | Transform concurrent operations | Custom library / ShareDB |
| Load Balancer | Consistent hash: doc_id → same server | NGINX + consistent hash |

---

### Step-by-Step Design

**Connection & Routing**
```
User opens document → WebSocket connects to Document Server
Load balancer: hash(doc_id) → always routes to SAME Document Server
  → Why: that server holds the doc in memory + the OT state machine

Document Server:
  1. Load doc from snapshot (latest snapshot + replay ops since it)
  2. Register client in local session map: {user_id, cursor_position, color}
  3. Subscribe to Redis channel "doc:{id}:ops"
```

**Edit Flow (OT: Operational Transformation)**
```
User A types "X" at position 5:
Client sends: {op: INSERT, pos: 5, char: "X", clientVersion: 42}

Document Server:
  1. Check: server is at version 50, client sent version 42
  2. Get all ops from version 42 → 50 from operation log
  3. Transform client op against those 8 ops:
     - Op 43 was INSERT at pos 3 → client's pos 5 becomes pos 6
     - Op 47 was DELETE at pos 1 → client's pos 6 becomes pos 5
     → Transformed: {op: INSERT, pos: 5, char: "X", version: 51}
  4. Apply to in-memory document → document version = 51
  5. Persist to operation log: {doc_id=X, version=51, op=..., user_id=A, ts=...}
  6. Broadcast to all other editors via Redis Pub/Sub: {version=51, op=...}
  7. ACK to User A: {serverVersion: 51}

All other editors:
  Receive op via WebSocket → apply to local copy
  Document converges to same state everywhere
```

**OT Conflict Example**
```
Both User A and User B start from "hello" at version 10:
User A: INSERT 'X' at pos 5 → sends {v:10, INSERT, 5, X}
User B: INSERT 'Y' at pos 5 → sends {v:10, INSERT, 5, Y}

Server receives A first:
  Apply A → document = "helloX" at version 11
  Transform B's op against A's: position 5 → 6 (A inserted before B's position)
  Apply transformed B → document = "helloXY" at version 12

Both A and B receive op 11 (X at 5) and op 12 (Y at 6)
Both converge to: "helloXY"  ✓ No data loss. Both characters preserved.
```

**CRDT Alternative (Figma, Notion)**
```
Each character has a globally unique ID: (user_id, local_sequence_number)
Document = ordered set of (ID, char) pairs
Insert: add new (ID, char) pair; order determined by ID (no position conflicts)
Delete: mark as "tombstone" (ID preserved, char = NULL)

Merge: take union of all operations (commutative, associative, idempotent)
→ No server needed for conflict resolution
→ Works offline: queue ops locally, sync on reconnect
→ The merge is always deterministic, regardless of order received
```

**Persistence: Snapshots + Operation Log**
```
Every 100 operations:
  Create snapshot: {doc_id, version, full_content, timestamp}
  Store in S3 (large) or PostgreSQL (small docs)
  Delete operations older than snapshot version (optional, keep for history)

Loading a document:
  Fetch latest snapshot (version N)
  Fetch ops from version N+1 to current
  Apply ops to snapshot → current document state
  → Even with 1M ops in history, load time = snapshot + (ops since last snapshot)
```

**Presence (Cursors & Selections)**
```
Every 100ms: client sends {user_id, cursor_pos, selection_range}
→ Document Server: broadcast to all editors via WebSocket
→ Store in Redis: SETEX presence:{doc_id}:{user_id} 5 {cursor_data}  (5-sec TTL)
→ NOT persisted to PostgreSQL (ephemeral — disappears when user leaves)

Client renders: colored cursor + name label for each other editor
```

---

### Deep Dive: The Hard Parts

**1. OT vs CRDT — When to Choose Each**
| | OT (Google Docs) | CRDT (Figma/Notion) |
|---|---|---|
| Server needed | Yes (for op serialization) | No (peer-to-peer possible) |
| Offline support | Complex (server must reconcile) | Natural (merge on reconnect) |
| Complexity | Transformation logic is tricky | Tombstones, ordering, size |
| Performance | Fast (server is single source of truth) | CRDT size grows with history |
| **Best for** | Central-server architecture | P2P or offline-first apps |

**2. Server Failover**
- Document Servers are stateful → if one crashes, its in-memory doc state is lost
- Solution: every op is persisted to operation log before ACK
- On crash: new server reloads from snapshot + replays ops from log
- Clients detect disconnection → show "reconnecting" → re-subscribe

**3. Large Documents**
- Document grows over time → in-memory state grows
- Mitigation: create snapshots frequently + stream ops (don't load full history)
- Max document size limit prevents abuse (e.g., 10MB for Google Docs)

---

### Trade-offs Table

| Decision | Option A | Option B | **Our Choice** | Why |
|---|---|---|---|---|
| Conflict resolution | OT | CRDT | **OT for text, CRDT for Figma** | Text editing → OT is simpler; vector graphics → CRDT handles spatial data better |
| Server architecture | Stateless | Stateful (doc in memory) | **Stateful** | OT requires serialized op processing; stateless would need distributed locks |
| Presence | Persistent (DB) | Ephemeral (Redis TTL) | **Ephemeral** | Cursor positions are meaningless after user leaves; save storage |
| Snapshot frequency | Rarely (save storage) | Frequently (fast load) | **Every 100 ops** | Balance load time vs. storage; 100 ops replays in <10ms |

---

### Interview Talking Points

> "The core problem is: two users type at the same position simultaneously. Last-write-wins silently deletes content — unacceptable. OT transforms concurrent operations to adjust positions, so both characters are always preserved."

> "The Document Server must be stateful — one server owns each document. This is different from typical stateless HTTP services. The load balancer uses consistent hashing on document_id so all editors of the same doc land on the same server."

> "Presence (cursors) is ephemeral by design. We use Redis with a 5-second TTL. When a user leaves, their cursor disappears automatically. We never write cursor positions to PostgreSQL — it would create millions of meaningless writes."

![Collaborative Editing Architecture](../../assets/system_design_template_11_google_docs.png)

---

## Template 12: Code Submission & Execution System

**Covers:** LeetCode · HackerRank · Codeforces · GitHub Actions (CI runners) · Repl.it · Code Interview platforms

> **One-line pitch:** "Code execution is a security problem first, a performance problem second. User-submitted code is fundamentally untrusted — it can do anything. The solution is mandatory sandbox isolation (Firecracker VM / Docker with seccomp) per submission, async job queues to handle bursts, and strict resource limits enforced at the kernel level."

---

### Recognize This Pattern When You See

- Need to execute arbitrary user-submitted code
- Results must be delivered back to the user
- Security: one user's code must not affect another's
- Burst traffic (contest start: 50K submissions simultaneously)

---

### Requirements Checklist

**Functional**
- [ ] Which languages? (Python, Java, C++, etc.)
- [ ] Time limit per submission? (e.g., 2 seconds)
- [ ] Memory limit? (e.g., 256 MB)
- [ ] Test case visibility? (show test cases to user or not?)
- [ ] Plagiarism detection?

**Non-Functional**
- [ ] Submissions/sec at peak? (e.g., 10K/sec during contest start)
- [ ] Max queue depth? (acceptable wait time? e.g., < 10 sec)
- [ ] Result delivery: polling vs. WebSocket push?

---

### Scale Estimates

```
Normal load:       1K submissions/sec
Contest peak:      50K submissions/sec for first 60 sec
Execution time:    avg 1 sec (Python), 0.1 sec (C++)
Worker needed:     50K submissions × 1 sec execution = 50K workers at peak
Autoscale time:    KEDA scales from 100 → 5K workers in ~2 min
Queue depth:       50K submissions × (1 sec processing - 1/50K arrivals) ≈ 10 sec wait
Sandbox boot:      Docker ~500ms, Firecracker ~125ms
Result storage:    50K × 10 KB = ~500 MB/sec peak (Redis TTL)
```

---

### Architecture Components

| Component | Purpose | Technology |
|---|---|---|
| Submit API | Accept submission, enqueue job | Go / Node.js |
| Job Queue | Buffer submissions, decouple load | SQS / Kafka |
| Worker Fleet | Execute code in sandbox | Kubernetes + KEDA autoscaler |
| Sandbox | Isolated execution environment | Firecracker microVM or Docker + seccomp |
| Language Runtimes | Pre-installed interpreter/compiler | Docker images per language |
| Result Cache | Store results (TTL 1 hour) | Redis |
| Result DB | Persistent submission history | PostgreSQL |
| WebSocket Server | Push result to user when ready | Go |
| Test Case Store | Input/output files per problem | S3 |

---

### Step-by-Step Design

**Submission Flow**
```
POST /submit {code, language, problem_id, user_id}
→ API Gateway:
    1. Authenticate user
    2. Validate: size < 64KB, language in whitelist
    3. Generate submission_id (Snowflake)
    4. Enqueue to SQS: {submission_id, user_id, problem_id, code, language}
    5. Return HTTP 202 Accepted + {submission_id}
       (Never block HTTP request waiting for code execution!)
```

**Worker Execution**
```
Worker pops job from SQS:
  1. Fetch test cases from S3: {input_1.txt, output_1.txt, ...}
  2. Pull language runtime image (pre-cached on worker)
  3. Spawn Firecracker microVM:
     - Mount code file at /code/solution.{ext}
     - Mount test cases at /tests/
     - Limits: CPU 1 core (CPU quota), RAM 256MB (cgroup), wall time 2s (SIGKILL)
     - Network: BLOCKED (no internet access from sandbox)
     - Filesystem: read-only except /tmp (tmpfs, 64MB)
     - Syscalls: seccomp whitelist (no fork bomb: clone restricted; no exec of arbitrary binaries)
  4. Run: {python3 /code/solution.py < /tests/input_1.txt}
  5. Compare stdout to /tests/output_1.txt
  6. Collect: {verdict, runtime_ms, memory_mb, stdout_snippet, stderr_snippet}
  7. Destroy VM immediately (no shared state between submissions)
```

**Result Storage & Delivery**
```
Worker writes result:
  1. Redis SET submission:{id} {result_json} EX 3600  (1-hour TTL)
  2. PostgreSQL INSERT submissions (user_id, problem_id, verdict, runtime_ms, code, timestamp)
  3. Publish to Kafka "results": {submission_id, user_id, verdict}

Result delivery:
  Option A: Polling
    Client GET /submissions/{id}/result every 1 sec
    Returns 202 (pending) or 200 + result (complete)
    Simple but adds 0-1 sec delay + unnecessary load

  Option B: WebSocket Push (preferred)
    User connects WebSocket on submission page
    Result Service subscribes to Kafka "results" topic
    On result event: push directly to user's WebSocket
    → Result appears in < 100ms of execution completing
```

**Contest Autoscaling**
```
Normal: SQS queue depth ~0, 100 workers idle
Contest starts: 50K submissions arrive in 60 sec
→ SQS queue depth spikes to 50K
→ KEDA (Kubernetes autoscaler) monitors queue depth:
    if depth > 1000: add workers (scale out)
    target: 1 worker per 100 queue items
    max workers: 5,000 (capacity limit)
→ Workers scale 100 → 5,000 in ~120 sec
→ Queue drains within ~10 min for a 50K submission burst
→ After contest: KEDA scales back to 100 workers (saves cost)
```

**Security Layers**
```
Layer 1: Input validation  → size limit, language whitelist
Layer 2: Container image   → minimal base image (no bash, no curl, no gcc unless needed)
Layer 3: User namespace    → run as non-root inside container
Layer 4: Seccomp filter    → syscall whitelist (prevents fork bomb, exec abuse)
Layer 5: cgroup limits     → CPU/memory/disk enforced at kernel level
Layer 6: Network policy    → Kubernetes NetworkPolicy blocks all egress
Layer 7: Wall time limit   → SIGKILL after 2 sec (prevents infinite loops)
Layer 8: VM isolation      → Firecracker: separate kernel per submission (strongest)

"Defense in depth" — all layers fail open to the next
```

---

### Deep Dive: The Hard Parts

**1. Docker vs. Firecracker**
| | Docker + seccomp | Firecracker microVM |
|---|---|---|
| Boot time | ~500ms | ~125ms |
| Isolation | Process (shared kernel) | Hardware (separate kernel) |
| Security | Good (seccomp limits) | Excellent (kernel exploit can't escape) |
| Overhead | Low | ~10MB RAM per VM |
| **Best for** | Trusted code (CI pipelines) | Untrusted user code (LeetCode) |

**2. Preventing Fork Bombs**
```python
# This kills a normal Linux system:
import os
while True:
    os.fork()

# Our defense:
# 1. seccomp: restrict clone() syscall to limit process creation
# 2. cgroup pids.max = 50 (max 50 processes per submission)
# 3. SIGKILL after 2 seconds (wall clock)
→ Fork bomb creates 50 processes max, then killed after 2 sec
```

**3. Test Case Security**
- Problem: if test cases are sent to the worker, a malicious user could exfiltrate them from the sandbox
- Solution: test cases never leave S3 unencrypted; mounted read-only into VM; output comparison happens outside the sandbox

---

### Trade-offs Table

| Decision | Option A | Option B | **Our Choice** | Why |
|---|---|---|---|---|
| Execution model | Sync (HTTP request blocks) | Async (queue + poll/push) | **Async** | Code execution takes 1–10 sec; HTTP timeout risk + thread starvation |
| Isolation | Docker | Firecracker | **Firecracker** | Stronger kernel isolation; user code is untrusted |
| Result delivery | Polling | WebSocket push | **WebSocket** | Instant UX; polling adds latency + unnecessary load |
| Scaling | Fixed fleet | KEDA autoscale | **KEDA** | Contest bursts are 50× normal load; fixed fleet wastes money 95% of the time |

---

### Interview Talking Points

> "The HTTP endpoint returns 202 Accepted immediately — it never waits for code to execute. This is critical. A 2-second execution time × 50K concurrent submissions = 100K threads blocked if we handle it synchronously. The queue decouples submission from execution."

> "Security is infrastructure, not trust. We don't trust the model to refuse malicious code — we enforce limits at the kernel level: seccomp syscall filter, cgroup resource limits, and network policy. Even if the code escapes the application layer, it can't escape cgroups."

> "KEDA autoscaling is the cost story. Maintaining 5,000 workers 24/7 to handle contest peaks costs $50K/month in EC2. With autoscaling, we pay for 100 workers normally and burst to 5,000 only during the 10 minutes of the contest start."

![Code Execution Architecture](../../assets/system_design_template_12_leetcode.png)

---

## Quick Reference: Template Selection Guide

> Read the question. Identify the core constraint. Pick the template. You'll know what to say.

| If the question mentions… | Template | Core Challenge |
|---|---|---|
| YouTube, Netflix, Dropbox, media streaming | **1 — Read-Heavy** | CDN + async transcoding |
| Twitter, Instagram, Facebook feed, news feed | **2 — Social Feed** | Fan-out at scale (push vs pull) |
| WhatsApp, Slack, Messenger, chat | **3 — Real-time Chat** | WebSocket routing + offline delivery |
| Uber, Yelp, Maps, "nearest X" | **4 — Location** | Geospatial index (Redis Geo) |
| TinyURL, bit.ly, short links | **5 — URL Shortener** | Unique ID + redirect at scale |
| Rate limiting, throttling, quotas | **6 — Rate Limiter** | Atomic check-and-decrement (Lua) |
| Datadog, Prometheus, monitoring, metrics | **7 — Monitoring** | Time-series ingestion + downsampling |
| TicketMaster, Airbnb, booking, reservations | **8 — Booking** | Double-booking prevention + surge queue |
| AI agent, Devin, Cursor, autonomous AI | **9 — AI Agent** | ReAct loop + context management |
| Typeahead, autocomplete, search-as-you-type | **10 — Typeahead** | Pre-computed prefix index |
| Google Docs, Figma, collaborative editing | **11 — Collaborative** | OT / CRDT conflict resolution |
| LeetCode, code execution, CI runner, sandbox | **12 — Code Execution** | Sandbox isolation + async job queue |

---

## Universal Trade-offs You Must Mention

No matter which template you use, weave these into your answer:

| Tension | Say this |
|---|---|
| **Consistency vs Availability** | "We accept eventual consistency here because [X]. If we needed strong consistency, we'd use [Y] at the cost of [Z]." |
| **Latency vs Throughput** | "We optimize for [latency/throughput] by [approach]. The trade-off is [cost]." |
| **Read vs Write optimization** | "This system is [read/write]-heavy, so we optimize the [read/write] path with [cache/queue], accepting [trade-off] on the [write/read] side." |
| **Cost vs Performance** | "Pre-computing costs storage but makes reads O(1). The alternative — computing on the fly — is cheaper to store but adds [X]ms per request." |
| **Simplicity vs Scalability** | "I'd start with [simpler approach]. We only add [complexity] when we hit [specific bottleneck]." |
