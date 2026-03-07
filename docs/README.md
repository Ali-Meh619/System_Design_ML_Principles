# System Design Playbook — Documentation

> **39 in-depth topics** covering everything from interview frameworks to AI agent architectures. Each file is designed to be a complete reference — not a summary.

---

## 🗺️ Navigate by Category

| Category | Topics | Level | Description |
|----------|--------|-------|-------------|
| [📐 Foundation](fundamentals/README.md) | 4 | 🟢–🟡 | Interview structure, estimation, I/O, networking |
| [🗄️ Data Storage](data/README.md) | 5 | 🟢–🔴 | Databases, caching, queues, CDN, internals |
| [🔌 API & Networking](architecture/README.md) | 5 | 🟢–🟡 | REST/gRPC/GraphQL, load balancing, rate limiting, WebSocket |
| [🌐 Distributed Systems](distributed/README.md) | 5 | 🟡–🔴 | CAP, consistency, patterns, microservices, resilience |
| [🔍 Search & Analytics](search/README.md) | 3 | 🟡–🔴 | Inverted index, typeahead, stream processing, geo |
| [📈 Scale & Reliability](scale/README.md) | 6 | 🟡–🔴 | Observability, HA, IDs, pagination, notifications |
| [🔐 Security](security/README.md) | 2 | 🟡 | Auth, OAuth 2.0, encryption, GDPR |
| [🧠 AI & Advanced](advanced/README.md) | 5 | 🔴 | ML systems, AI agents, probabilistic structures |
| [📋 Reference](reference/README.md) | 2 | 🟢 | Cheat sheets, design templates |

---

## 📚 All 39 Topics

### 📐 Foundation
- [Interview Framework — The Universal 4-Step Approach](fundamentals/interview-framework.md)
- [Numbers Every Engineer Must Know](fundamentals/estimation-and-numbers.md)
- [IO Fundamentals: Read vs Write](fundamentals/io-fundamentals.md)
- [Networking & Concurrency](fundamentals/networking-concurrency.md)

### 🗄️ Data Storage
- [Database Selection Guide](data/databases.md)
- [Caching Deep Dive](data/caching.md)
- [Message Queues & Event Streaming](data/message-queues.md)
- [Storage & CDN](architecture/storage-and-cdn.md)
- [Database Internals](data/database-internals.md)

### 🔌 API & Networking
- [API Design & API Gateway](architecture/api-design.md)
- [Load Balancing & Networking](architecture/load-balancing.md)
- [Rate Limiting In Depth](architecture/rate-limiting.md) ⭐ New
- [Real-time Communication](architecture/realtime-communication.md)

### 🌐 Distributed Systems
- [Distributed System Fundamentals](distributed/distributed-fundamentals.md)
- [Core Design Patterns (Fan-out, CQRS, Outbox)](distributed/core-design-patterns.md)
- [Microservices vs Monolith](distributed/microservices-vs-monolith.md)
- [Resilience Patterns](distributed/resilience-patterns.md)
- [Distributed Locking](advanced/distributed-locking.md)

### 🔍 Search & Analytics
- [Search & Typeahead Systems](search/search-and-typeahead.md)
- [Stream Processing & Top-K Systems](search/stream-processing.md)
- [Geo & Location Systems](search/geo-systems.md)

### 📈 Scale & Reliability
- [Observability & Monitoring](scale/observability.md)
- [High Availability & Auto Scaling](scale/high-availability-scaling.md)
- [Unique ID Generation](scale/id-generation.md)
- [API Pagination](scale/pagination.md)
- [Advanced Data Patterns](scale/advanced-data-patterns.md)
- [Notification System Design](scale/notification-system.md) ⭐ New

### 🔐 Security
- [Security & Authentication](security/security-and-authentication.md)
- [Privacy & Data Compliance](security/privacy-and-compliance.md)

### 🧠 AI & Advanced Topics
- [Machine Learning in System Design](advanced/ml-in-system-design.md)
- [AI Agent System Design](advanced/ai-agent-system-design.md)
- [Probabilistic Data Structures](advanced/probabilistic-data-structures.md)
- [Real-time Collaboration (Google Docs)](advanced/collaboration-editing.md)
- [Webhooks System Design](advanced/webhooks.md)
- [Mobile System Design](advanced/mobile-system-design.md)

### 📋 Reference
- [Common Scenarios & Cheat Sheets](reference/scenario-cheat-sheet.md)
- [Reusable Design Templates (12 blueprints)](reference/reusable-design-templates.md)
- [LeetCode Question Patterns](reference/leetcode-patterns.md)
- [Low-Level System Design (LLD)](reference/low-level-design.md)

---

## 🎯 Learning Paths

### Path 1: Interview in 2 Weeks (Beginner)

```
Week 1:
  Day 1 → Interview Framework + Numbers to Know
  Day 2 → Database Selection Guide
  Day 3 → Caching Deep Dive
  Day 4 → API Design + Load Balancing
  Day 5 → Distributed System Fundamentals
  Day 6 → CAP Theorem deep-dive + Consistency Models
  Day 7 → Review + Practice: Design a URL Shortener

Week 2:
  Day 8  → Resilience Patterns
  Day 9  → Observability + High Availability
  Day 10 → Message Queues + Kafka
  Day 11 → Storage + CDN
  Day 12 → Security & Authentication
  Day 13 → Common Scenarios Cheat Sheet
  Day 14 → Review + Practice: Design YouTube
```

### Path 2: Deep Expertise (Mid-Level → Senior)

```
1. Complete Path 1 first
2. Database Internals (B-tree vs LSM)
3. Distributed Locking
4. Stream Processing + Top-K
5. Geo Systems
6. Advanced Data Patterns (CQRS, Event Sourcing)
7. ID Generation + Pagination
8. Privacy & Compliance
9. Rate Limiting In Depth
10. Notification System Design
11. Reusable Design Templates (all 12 blueprints)
```

### Path 3: Staff/Principal Level

```
1. Complete Paths 1 + 2
2. ML in System Design
3. AI Agent System Design
4. Probabilistic Data Structures
5. Real-time Collaboration (CRDT vs OT)
6. Microservices vs Monolith (deep dive)
7. Mobile System Design
8. Webhooks at Scale
```

---

## ⚡ Quick Reference Tables

### Database Selection (30-Second Guide)

| Requirement | Database |
|------------|---------|
| Financial transactions, complex JOINs | PostgreSQL |
| Session storage, leaderboards, caching | Redis |
| 100K+ writes/second, time-series | Cassandra |
| Full-text search, faceted filters | Elasticsearch |
| Flexible schema, nested documents | MongoDB |
| Analytics, aggregations (OLAP) | BigQuery / ClickHouse |
| Serverless, auto-scale, global | DynamoDB |

### API Protocol Selection

| Situation | Protocol |
|----------|---------|
| Public REST API | REST + JSON |
| Internal microservices | gRPC + Protobuf |
| Flexible client queries | GraphQL |
| Real-time bidirectional | WebSocket |
| Server-push only | SSE |

### When You Need Caching

| Signal | Cache type |
|--------|-----------|
| Same DB query run repeatedly | Application cache (Redis) |
| Static files (JS, CSS, images) | CDN |
| Database query results | Redis with TTL |
| Session data | Redis with TTL |
| Computed aggregations | Materialized view |

### Consistency Choice Guide

| Use case | Consistency |
|---------|------------|
| Bank balance, inventory | Strong consistency |
| Social media likes | Eventual consistency |
| User's own posts | Read-your-writes |
| Analytics dashboards | Eventual (stale is fine) |
| Search results | Eventual |

---

## 🔥 Most Common Interview Questions by Topic

| Company | Favorite Topics |
|---------|---------------|
| **Google** | Search systems, distributed systems, CAP theorem, Bigtable-like designs |
| **Meta/Facebook** | News feed (fan-out), real-time messaging, social graph |
| **Amazon** | Shopping cart, inventory, payment, recommendation engine |
| **Uber/Lyft** | Geo systems, real-time matching, surge pricing |
| **Netflix/YouTube** | Video streaming, CDN, recommendation, transcoding |
| **Twitter** | Tweet feed, trending topics, search |
| **Stripe/PayPal** | Payment processing, idempotency, fraud detection |
| **Airbnb** | Booking/reservation, search, pricing |

---

## 📖 How to Use These Docs

1. **Use the interactive site** — [System Design Playbook](../site/index.html) — for navigation, progress tracking, and quiz mode
2. **Category READMEs** — Start each category by reading its README for the overview and learning sequence
3. **Deep-dive files** — Each `.md` file contains the full reference for that topic, including tables, code examples, and trade-off comparisons
4. **Cheat sheets** — For final review, use [Common Scenarios](reference/scenario-cheat-sheet.md) and [Design Templates](reference/reusable-design-templates.md)

---

## 🤝 Contributing

Found an error? Know a better way to explain something? See [CONTRIBUTING.md](../CONTRIBUTING.md).

Missing a topic? Open an issue with the title "Topic Request: [topic name]".

---

*Last updated: March 2026 | 39 topics across 10 categories*
