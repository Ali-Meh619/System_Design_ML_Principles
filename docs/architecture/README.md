# 🔌 API & Networking

> APIs are the public face of every system. Load balancers are the gatekeepers. Real-time protocols are what make modern apps feel alive. This category covers the networking layer that every system design answer needs.

---

## Why This Category Is Essential

Every system design interview eventually hits these questions:
- "How does the client talk to the backend?" → API design
- "How do you handle 1M requests/second?" → Load balancing  
- "How do you prevent abuse?" → Rate limiting
- "How do chat apps / live dashboards work?" → Real-time communication

These aren't advanced topics — they're expected knowledge for mid-level and senior engineers.

---

## Topics in This Category

| # | Topic | Difficulty | What You'll Learn |
|---|-------|-----------|------------------|
| 1 | [API Design & API Gateway](api-design.md) | 🟢 Beginner | REST vs gRPC vs GraphQL, API Gateway responsibilities |
| 2 | [Load Balancing & Networking](load-balancing.md) | 🟡 Mid | L4 vs L7, algorithms, health checks, global routing |
| 3 | [Rate Limiting In Depth](rate-limiting.md) | 🟡 Mid | All 5 algorithms, distributed rate limiting, full system design |
| 4 | [Real-time Communication](realtime-communication.md) | 🟡 Mid | Polling vs SSE vs WebSocket, scaling WebSockets |
| 5 | [Storage & CDN](storage-and-cdn.md) | 🟢 Beginner | Object/block/file storage, CDN architecture |

---

## API Protocol Comparison

| Protocol | Format | Best For | Trade-off |
|----------|--------|---------|----------|
| **REST** | JSON over HTTP | Public APIs, web clients | Verbose, multiple round-trips |
| **gRPC** | Protocol Buffers (binary) | Internal microservices, mobile | Binary (not human-readable), HTTP/2 required |
| **GraphQL** | JSON over HTTP | Flexible client queries, reduce over-fetching | Complex server-side, harder caching |
| **WebSocket** | Binary or text, persistent | Real-time bidirectional | Stateful (hard to scale) |
| **SSE** | Text over HTTP (one-way) | Server-push notifications, feeds | One-directional only |

> 💡 **Interview Rule:** REST for external APIs. gRPC between internal services. WebSocket only when you need bidirectional real-time. GraphQL when clients have highly variable query needs (e.g., mobile vs desktop).

---

## Load Balancing Algorithm Cheat Sheet

| Algorithm | How It Works | Best For |
|-----------|-------------|---------|
| **Round Robin** | Requests distributed in order 1-2-3-1-2-3 | Stateless servers with equal capacity |
| **Least Connections** | Route to server with fewest active connections | Long-lived connections (WebSocket) |
| **IP Hash** | Hash client IP → always same server | Stateful sessions (sticky sessions) |
| **Weighted Round Robin** | More powerful servers get more traffic | Mixed-capacity server pools |
| **Consistent Hashing** | Hash request key → minimal reshuffling on scaling | Distributed caches, sharding |

---

## Rate Limiting Algorithm Quick Pick

| Situation | Best Algorithm |
|-----------|--------------|
| General API (allow burst) | Token Bucket |
| Protect downstream service (smooth rate) | Leaky Bucket |
| Simple per-minute limits | Sliding Window Counter |
| Strict "no boundary exploit" | Sliding Window Log |

---

## Real-time Protocol Decision Tree

```
Do you need bidirectional communication (client can send to server)?
│
├─ YES → WebSocket
│        (chat, collaborative editing, live games)
│
└─ NO → Do you need server push (server → client only)?
          │
          ├─ YES, infrequently (every 5–30 seconds) → Long Polling
          │   (simple to implement, works behind proxies)
          │
          ├─ YES, continuously → SSE (Server-Sent Events)
          │   (news feeds, live scores, progress updates)
          │
          └─ NO (client pulls) → Short Polling
              (acceptable only for low-frequency updates)
```

---

## API Gateway Responsibilities

When designing a system, mention the API Gateway handles:

1. **Authentication** — validate JWT/API keys before requests reach services
2. **Rate Limiting** — per-user, per-IP, per-endpoint limits
3. **Load Balancing** — distribute to backend instances
4. **SSL Termination** — handle TLS, backends use plain HTTP internally
5. **Request Routing** — path-based routing to different microservices
6. **Request/Response Transform** — protocol translation (HTTP to gRPC)
7. **Observability** — unified logging, metrics, tracing
8. **Circuit Breaking** — stop sending to failing backends

> 💡 **Popular choices:** AWS API Gateway (managed), Kong (open source), Nginx/Envoy (self-managed), Cloudflare Workers (edge).

---

## CDN Decision Guide

**Use a CDN when:**
- Serving static files (images, JS, CSS, videos)
- Your users are globally distributed
- Response time is more important than freshness

**Pull CDN** (recommended): Origin serves content on cache miss, CDN caches automatically.  
**Push CDN**: You upload content to CDN proactively — better for large files with known access patterns.

**Cache invalidation:** Use versioned URLs (`/assets/app-v3.2.1.js`) instead of purging — purging is slow and error-prone.

---

## Practice Questions

1. Design the API layer for a mobile app that needs to fetch a user's personalized news feed, post a comment, and receive live notifications. What protocols do you use for each?

2. Your API gateway is rate limiting at 100 req/min per user. A user makes 90 requests at 0:59 and 90 requests at 1:01. With a fixed-window counter, do they get rate-limited? With a sliding window counter?

3. Your WebSocket server handles 100K concurrent connections. You want to scale to 3 instances. How do chat messages get delivered to users on different server instances?

4. A CDN serves your homepage at 95% hit rate. Your origin gets 5,000 requests/day. How many total page views are being served?
