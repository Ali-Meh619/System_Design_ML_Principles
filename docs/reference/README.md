# 📋 Reference

> Quick-access blueprints, patterns, and design templates. Use these as your "last-mile" prep — review these the night before an interview.

---

## Topics in This Category

| # | Topic | What it contains |
|---|-------|----------------|
| 1 | [Common Scenarios & Solutions](scenario-cheat-sheet.md) | 9 pattern cheat sheets for any problem type |
| 2 | [Reusable Design Templates](reusable-design-templates.md) | 12 complete system blueprints |

---

## 9 Problem Patterns — Instant Recognition

When you see an interview question, identify the pattern first:

| Pattern | Keywords in question | Key components |
|---------|--------------------|--------------------|
| **Read-Heavy** | "Netflix", "YouTube", "CDN", "100:1 read/write" | CDN + aggressive caching + read replicas |
| **Write-Heavy** | "IoT sensors", "click stream", "100K writes/sec" | Kafka + Cassandra/LSM + async processing |
| **Real-Time** | "live", "chat", "collaborative", "< 100ms" | WebSocket + Redis pub/sub + in-memory |
| **Search** | "autocomplete", "full-text", "relevance" | Elasticsearch + inverted index + ranking |
| **Global Consistency** | "payment", "inventory", "booking" | SQL + 2PC or Saga + strong consistency |
| **Top-K / Trending** | "trending", "most popular", "leaderboard" | Count-Min Sketch + Kafka streams |
| **Social Feed** | "news feed", "timeline", "follow" | Fan-out on write (small following) or read |
| **File Storage** | "upload", "S3-like", "blob" | Object store + CDN + chunked upload |
| **Collaboration** | "Google Docs", "real-time edits", "CRDT" | OT/CRDT + WebSocket + presence |

---

## 12 System Templates — Quick Reference

| System | Key Insight | Main Challenge |
|--------|-----------|---------------|
| **YouTube** | Encode on ingest, CDN on egress | Video transcoding pipeline |
| **Twitter Feed** | Pre-compute feeds for small following | Fan-out: celebrity problem (100M followers) |
| **WhatsApp** | Messages per conversation, not per user | Delivery guarantees, offline queue |
| **Uber** | Driver location in Redis, geohash query | Real-time matching, surge pricing |
| **TinyURL** | Hash collision handling, redirect at CDN | Short ID generation, analytics |
| **Rate Limiter** | Token bucket in Redis, Lua atomics | Distributed consistency |
| **Metrics System** | Time-series DB, downsampling | Retention tiers, high write QPS |
| **TicketMaster** | Inventory lock prevents double-booking | Optimistic locking, flash sale |
| **AI Agent** | LLM + tools + memory | Context window, tool safety |
| **Typeahead** | Offline-computed prefix → suggestions | Cold start, staleness |
| **Google Docs** | OT for conflict resolution | Cursor positions, presence |
| **LeetCode** | Sandboxed code execution | Security, resource limits |

---

## Universal System Design Response Template

Use this structure for every question:

```markdown
**Requirements Clarification** (5 min)
- Functional: [what users can do]
- Non-functional: [QPS, latency, availability, consistency]
- Scope: [what's in/out of scope]

**Estimation** (3 min)
- Users: [DAU]
- Requests: [QPS = DAU × actions/day / 86400]
- Storage: [bytes/record × records/day × retention]
- Bandwidth: [QPS × response_size]

**High-Level Design** (10 min)
[ASCII diagram of major components]
- Client → Load Balancer → API Servers → DB/Cache
- Async processing via Queue/Kafka

**Deep Dive** (15 min)
- Hardest component: [explain in detail]
- Failure scenarios: [what breaks, how to recover]
- Trade-offs: "I chose X over Y because..."

**Wrap-Up** (2 min)
- "This design is optimized for [X]."
- "The trade-off is [Y] for [Z]."
- "To scale 10×, I would [next step]."
```

---

## Numbers to Always Have Ready

| Metric | Value |
|--------|-------|
| Seconds in a day | 86,400 |
| Seconds in a month | ~2.6M |
| Seconds in a year | ~31.5M |
| 1M requests/day → QPS | ~12 |
| 10M requests/day → QPS | ~115 |
| 100M requests/day → QPS | ~1,160 |
| 1B requests/day → QPS | ~11,600 |

| Data size | Value |
|-----------|-------|
| 1 tweet | ~280 bytes |
| 1 user profile | ~1 KB |
| 1 image thumbnail | ~100 KB |
| 1 minute of 720p video | ~150 MB |
| 1 billion records × 1KB | ~1 TB |
