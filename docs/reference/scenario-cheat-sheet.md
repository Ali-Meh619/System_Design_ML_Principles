# Common Scenarios & Solutions (Cheat Sheet)

> Don't reinvent the wheel. Identify the core constraint of the question (Read-heavy? Write-heavy? Real-time? Fan-out? File Storage? Collaborative?) and apply the standard pattern. 9 patterns covering every major system design archetype.

---

## 1. Read-Heavy Systems (100:1 to 1,000,000:1)

**Questions:** Twitter, YouTube, Netflix, Pastebin, URL Shortener, Google Docs (Reading).

**Pattern: Cache-Aside + Read Replicas + CDN**

1. **Database:** Use **Read Replicas**. Primary DB takes writes, replicates to 5-10 replicas for reads.
2. **Caching:** **Cache-Aside** pattern with Redis. Cache hot data (e.g., popular tweets, video metadata). TTL 1 hour.
3. **Static Content:** Move all images/videos/JS/CSS to a **CDN** (CloudFront/Akamai). 99% of traffic hits CDN, not your servers.
4. **Trade-off:** **Eventual Consistency**. User might see old data for a few seconds (replication lag). Acceptable for social media.

---

## 2. Write-Heavy / High Ingestion (1:1 or Write > Read)

**Questions:** Realtime Monitoring, Analytics, Webhooks, IoT, Logging, "Design a Crawler".

**Pattern: Buffer (Queue) → Batch → LSM Tree**

1. **Ingestion:** Never write directly to DB. Ingest into a **Message Queue** (Kafka/Kinesis) first. Acts as a buffer/shock absorber.
2. **Processing:** Consumers read micro-batches (e.g., 500ms or 1000 items) and bulk-insert to DB.
3. **Database:** Use an **LSM Tree** database (Cassandra, HBase, InfluxDB) optimized for sequential writes. Avoid B-Tree (SQL) which fragments on random writes.
4. **Trade-off:** **Query Latency**. Real-time reads might be slower or slightly delayed (near real-time).

---

## 3. Real-Time & Low Latency

**Questions:** WhatsApp, Messenger, Uber (Location update), Google Docs (Collab), Gaming.

**Pattern: WebSocket + Pub/Sub**

1. **Communication:** **WebSocket** for persistent bidirectional connection. (Long polling is a fallback).
2. **State:** Use **Redis Pub/Sub** to distribute messages across servers. Server A publishes "New Message", Server B (holding User B's socket) subscribes and pushes to User B.
3. **Erlang/Elixir:** Mention WhatsApp uses Erlang for massive concurrency (millions of connections per server).
4. **Trade-off:** **Stateful Servers**. Harder to auto-scale than stateless HTTP. Need sticky sessions or a smart routing layer.

---

## 4. Search & Discovery (Fuzzy / Geo)

**Questions:** Google Search, Yelp, Typeahead, Uber (Find driver), Tinder.

**Pattern: Inverted Index / Geohash**

1. **Text Search:** **Inverted Index** (Elasticsearch/Lucene). Maps words → document IDs.
2. **Typeahead:** **Trie** data structure. Store top 5 completions at each node. Or use Redis Sorted Set with lexicographical range query.
3. **Geo Search:** **Geohash** or **QuadTree**. Convert 2D (lat/long) into 1D string ("dr5ru..."). Query by string prefix (neighbors share prefixes).
4. **Trade-off:** **Index Sync Lag**. Updates to main DB take time to propagate to Search Index.

---

## 5. Global Consistency (Money / Inventory)

**Questions:** TicketMaster, Banking System, Flash Sales.

**Pattern: Strong Consistency / Locking**

1. **Database:** **RDBMS (SQL)** with ACID transactions. NoSQL is risky here.
2. **Locking:** **Pessimistic Locking** (`SELECT ... FOR UPDATE`) for high contention items (e.g., the last concert ticket).
3. **Distributed Lock:** Use Redis (Redlock) or Zookeeper to lock a resource across microservices.
4. **Trade-off:** **Availability & Latency**. System might reject requests or be slow to ensure data is 100% correct (CP over AP).

---

## 6. Count / Top-K (Massive Volume)

**Questions:** "Top K Songs on Spotify", "Most Viewed Videos", "Trending Hashtags".

**Pattern: Stream Processing + Probabilistic Structures**

1. **Exact Count:** Too slow. You can't lock a row to increment 1M times/sec.
2. **Approximate:** **Count-Min Sketch**. A probabilistic 2D array that estimates frequency with constant space.
3. **Aggregation:** MapReduce / Flink. Split stream by key, count in windows (e.g., 5 seconds), aggregate windows.
4. **Trade-off:** **Accuracy**. You get "Top K" with 99.9% accuracy, but maybe not exact counts.

---

## 7. Fan-out / Social News Feed (Push vs Pull Dilemma)

**Questions:** Twitter timeline, Instagram feed, Facebook newsfeed, Reddit.

**Pattern: Hybrid Push/Pull — fan-out on write for regular users, pull for celebrities**

1. **Normal users (< 10K followers):** **Fan-out on write**. On new post → push tweet_id to all followers' Redis feed lists (LPUSH). Feed reads are instant O(1).
2. **Celebrities (> 10K followers):** **Fan-out on read**. Beyoncé has 100M followers — pushing to all is catastrophically expensive. At read time, merge celebrity's recent 20 posts into the follower's feed dynamically.
3. **When to Push vs Pull?** Push = Fast reads, expensive writes (write amplification). Pull = Cheap writes, adds latency on read. Hybrid = Best of both, but complex logic at the merge layer.
4. **Storage:** Redis List per user (`user:{id}:feed`) capped at 1000 entries (LTRIM). Overflow users load from DB.
5. **Trade-off:** **Write amplification** (push) vs **Read latency** (pull). The 10K follower threshold is the key engineering decision to defend.

---

## 8. Large File / Blob Storage (Upload & Sync)

**Questions:** Dropbox, Google Drive, GitHub (LFS), Image/Video upload pipeline.

**Pattern: Chunked Upload → Object Storage (S3) → CDN + Content-Hash Deduplication**

1. **Chunking:** Client splits file into 5–10MB chunks. Uploads each chunk independently via a **Pre-signed URL** (S3 generates a short-lived URL, client uploads directly — your servers never touch the bytes).
2. **Resumable upload:** If network fails, only re-upload the failed chunk. Client tracks which chunk IDs succeeded. Critical for large files on mobile.
3. **Deduplication:** Hash each chunk (SHA-256). Before uploading, client asks server "do you have chunk with hash X?" If yes, skip upload (server-side copy). Dropbox reports 30%+ storage savings via deduplication.
4. **Sync:** Delta sync — only send changed chunks, not the entire file. Use **rsync algorithm**: compare block-level checksums, transfer only diffs.
5. **Metadata DB:** PostgreSQL stores (file_id, user_id, path, chunk_ids[], version, last_modified). Versioning = list of chunk_id arrays over time.
6. **Trade-off:** Complex client-side chunking logic vs simple but fragile single-part upload. Pre-signed S3 URLs reduce server load massively.

---

## 9. Collaborative Real-time Editing

**Questions:** Google Docs, Figma, Notion, Miro, Confluence.

**Pattern: WebSocket + OT (Operational Transformation) or CRDT for conflict resolution**

1. **Core Problem:** User A types "X" at position 5, User B types "Y" at position 5 at the same time. Who wins? Without conflict resolution, one edit silently overwrites the other.
2. **OT (Google Docs):** Each edit is an **Operation** `{insert "X" at pos 5}`. A central server serializes all operations and **transforms** concurrent ones to adjust positions. All clients converge to the same state. Requires central server arbitration.
3. **CRDT (Figma, Notion):** Each character has a globally unique ID. Merging is always deterministic — no server arbitration needed. Works offline/p2p and syncs on reconnect.
4. **Transport:** **WebSocket** for real-time. Operations persisted to append-only log (PostgreSQL) for replay when new user joins or reopens document.
5. **Presence:** Ephemeral cursors, selection ranges, and user avatars broadcast via WebSocket Pub/Sub — not persisted.
6. **Trade-off:** OT = Strong consistency but requires central coordinator. CRDT = Decentralized and offline-capable but complex to implement correctly.

---

## Quick Reference: Core Constraint → Pattern

| Core Constraint | Pattern | Key Technologies |
|----------------|---------|-----------------|
| Read-heavy | Cache-Aside + CDN | Redis, CloudFront, Read Replicas |
| Write-heavy | Queue → Batch → LSM | Kafka, Cassandra, InfluxDB |
| Real-time bidirectional | WebSocket + Pub/Sub | Redis Pub/Sub, Socket.io |
| Real-time server→client | SSE | EventSource, HTTP/2 |
| Full-text search | Inverted Index | Elasticsearch, Lucene |
| Geo proximity | Spatial Index | Geohash, QuadTree, Redis Geo |
| Count/frequency | Approximate counting | Count-Min Sketch, Redis HLL |
| Strong consistency | Pessimistic locking | SQL FOR UPDATE, Zookeeper |
| Social feed | Hybrid fan-out | Redis Lists, Kafka, hybrid push/pull |
| File storage | Chunked upload + dedup | S3, SHA-256 hashing, pre-signed URLs |
| Collaborative edit | OT or CRDT | WebSocket, append-only log |
| Unique IDs | Snowflake | 41-bit timestamp + machine ID |
| Pagination | Cursor-based | Keyset pagination, opaque cursor |
