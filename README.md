<div align="center">

<br>

# ⚡ System Design & Machine Learning Playbook

### The most comprehensive, interactive system design and ML reference — built for engineers cracking technical interviews.

<br>

[![Stars](https://img.shields.io/github/stars/Ali-Meh619/System_Design_ML_Principles?style=for-the-badge&color=FFD700&logo=github)](https://github.com/Ali-Meh619/System_Design_ML_Principles/stargazers)
[![Forks](https://img.shields.io/github/forks/Ali-Meh619/System_Design_ML_Principles?style=for-the-badge&color=0d9488&logo=github)](https://github.com/Ali-Meh619/System_Design_ML_Principles/network/members)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Topics](https://img.shields.io/badge/Topics-42-purple?style=for-the-badge)](docs/)
[![Interactive](https://img.shields.io/badge/Site-Live-success?style=for-the-badge&logo=github)](https://ali-meh619.github.io/System_Design_ML_Principles/)

<br>

**[🌐 Live Interactive Site](https://ali-meh619.github.io/System_Design_ML_Principles/)** &nbsp;·&nbsp;
**[📚 Browse All Topics](docs/)** &nbsp;·&nbsp;
**[🎯 Start Here](docs/fundamentals/interview-framework.md)** &nbsp;·&nbsp;
**[🤝 Contribute](CONTRIBUTING.md)**

<br>

</div>

---

## ✨ What makes this different?

Most system design resources are scattered blog posts or 400-page books. This repo gives you **everything in one place** — structured, searchable, and interactive.

| Feature | Description |
|---------|-------------|
| 🎯 **42 interview-ready topics** | Every domain: distributed systems, machine learning, databases, security, and more |
| 🌙 **Dark / Light mode** | Persisted preference, instant toggle with `d` |
| ✅ **Progress tracking** | Mark topics as read. Your progress saves locally. |
| 🔖 **Bookmarks** | Save topics to revisit. Accessible from any page. |
| 🃏 **Quiz / Flashcard mode** | Randomized flashcard review across all 42 topics |
| 📖 **Inline reader** | Read every topic without leaving the page — with prev/next navigation |
| ⌨️ **Keyboard-first** | `/` search, `q` quiz, `b` bookmarks, `?` shortcuts |
| 📊 **Visual progress bar** | See your overall completion at a glance |
| 🗺️ **3 learning paths** | Beginner, Mid-Level, and Advanced tracks |
| 🔍 **Live search** | Searches title, category, summary, and tags |
| 🎨 **Category color coding** | Every domain has its own visual identity |
| 🚀 **Zero setup** | Open in browser. No install. No build step. |

---

## 🗂️ Topic Coverage (42 Topics)

<details>
<summary><strong>🟠 Foundation (4)</strong></summary>

- 📐 [The System Design Interview Framework](docs/fundamentals/interview-framework.md) — 4-step universal structure: Clarify → Estimate → Design → Deep Dive
- 🔢 [Numbers Every Engineer Must Know](docs/fundamentals/estimation-and-numbers.md) — Latency hierarchy, scale reference points, back-of-envelope formulas
- 💾 [IO Fundamentals: Read vs Write](docs/fundamentals/io-fundamentals.md) — Latency hierarchy, random vs sequential access, OS page cache, write amplification
- 🔌 [Networking & Concurrency](docs/fundamentals/networking-concurrency.md) — TCP vs UDP, HTTP/1.1 vs HTTP/2 vs HTTP/3 (QUIC), event loop, goroutines

</details>

<details>
<summary><strong>🟣 Data Storage (5)</strong></summary>

- 🗄️ [Database Selection Guide](docs/data/databases.md) — SQL vs NoSQL tension, 7 database types with when-to-use decision matrix
- ⚡ [Caching Deep Dive](docs/data/caching.md) — 5 cache layers, read/write patterns, eviction, cache invalidation strategies
- 📨 [Message Queues & Event Streaming](docs/data/message-queues.md) — Queue vs Kafka event log, delivery guarantees, DLQ, outbox pattern
- 🌐 [Storage & CDN](docs/architecture/storage-and-cdn.md) — Object/block/file storage, CDN pull vs push, cache invalidation
- 🔩 [Database Internals](docs/data/database-internals.md) — B-tree vs LSM, indexes, replication, CDC, sharding, ACID vs BASE, isolation levels

</details>

<details>
<summary><strong>🔵 API & Networking (4)</strong></summary>

- 🔌 [API Design & API Gateway](docs/architecture/api-design.md) — REST vs gRPC vs GraphQL, gateway responsibilities, rate limiting algorithms
- ⚖️ [Load Balancing & Networking](docs/architecture/load-balancing.md) — L4 vs L7, round-robin/least-connections/consistent hashing, health checks
- 🔴 [Real-time Communication](docs/architecture/realtime-communication.md) — Polling, SSE, WebSockets compared; scaling stateful WS servers with Redis pub/sub
- 🚦 [Rate Limiting In Depth](docs/architecture/rate-limiting.md) — Every algorithm compared, distributed Redis implementation, failure modes

</details>

<details>
<summary><strong>🟢 Distributed Systems (5)</strong></summary>

- 🌐 [Distributed System Fundamentals](docs/distributed/distributed-fundamentals.md) — CAP, consistency models, consistent hashing, Saga vs 2PC, quorum, vector clocks
- 🔄 [Core Design Patterns](docs/distributed/core-design-patterns.md) — Fan-out (social feed), CQRS, event sourcing, outbox pattern, inventory contention
- 🧱 [Microservices vs Monolith](docs/distributed/microservices-vs-monolith.md) — When to decompose, service discovery, sync vs async communication
- 🛡️ [Resilience Patterns](docs/distributed/resilience-patterns.md) — Timeouts, retries + jitter, circuit breaker, fallbacks, backpressure, load shedding
- 🔒 [Distributed Locking](docs/advanced/distributed-locking.md) — Why local locks fail, Redis Redlock, fencing tokens

</details>

<details>
<summary><strong>🟡 Search & Analytics (3)</strong></summary>

- 🔍 [Search & Typeahead Systems](docs/search/search-and-typeahead.md) — Inverted index, prefix trie autocomplete, relevance ranking (TF-IDF, BM25)
- 📊 [Stream Processing & Top-K Systems](docs/search/stream-processing.md) — Count-Min Sketch, Lambda vs Kappa architecture, Flink, windowing
- 📍 [Geo & Location Systems](docs/search/geo-systems.md) — Geohash, quadtree, proximity queries, Uber-style driver matching

</details>

<details>
<summary><strong>🟩 Scale & Reliability (6)</strong></summary>

- 📡 [Observability & Monitoring](docs/scale/observability.md) — Metrics, logs, traces (three pillars), SLOs, error budgets, OpenTelemetry
- 📈 [High Availability & Auto Scaling](docs/scale/high-availability-scaling.md) — Active-passive vs active-active, autoscaling signals, multi-region patterns
- 🆔 [Unique ID Generation](docs/scale/id-generation.md) — UUID v4/v7/ULID, Twitter Snowflake, ticket servers — when to use each
- 📄 [API Pagination](docs/scale/pagination.md) — Why offset pagination fails, cursor-based and keyset pagination at scale
- 🔔 [Notification System Design](docs/scale/notification-system.md) — Multi-channel delivery, fan-out at scale, idempotency, retry + DLQ
- 🔁 [Advanced Data Patterns](docs/scale/advanced-data-patterns.md) — Pre-computation, materialized views, ETL vs ELT, hot spot problem, backfill

</details>

<details>
<summary><strong>🔴 Security (2)</strong></summary>

- 🔐 [Security & Authentication](docs/security/security-and-authentication.md) — Sessions vs JWT, OAuth 2.0 flow, API security checklist
- 🛡️ [Privacy & Data Compliance](docs/security/privacy-and-compliance.md) — PII handling, encryption strategies, GDPR/CCPA, data residency

</details>

<details>
<summary><strong>🩷 AI & Advanced (4)</strong></summary>

- 🤖 [Machine Learning in System Design](docs/advanced/ml-in-system-design.md) — 5-layer ML pipeline, feature store, recommendation systems, model serving
- 🧠 [AI Agent System Design](docs/advanced/ai-agent-system-design.md) — Planner/tool/memory anatomy, multi-agent patterns, safety, LLM-as-a-Judge
- 🎲 [Probabilistic Data Structures](docs/advanced/probabilistic-data-structures.md) — Bloom filter, HyperLogLog, Count-Min Sketch at massive scale
- 📱 [Mobile System Design](docs/advanced/mobile-system-design.md) — Offline-first, delta sync, push notifications (APNs/FCM), battery constraints

</details>

<details>
<summary><strong>🪩 Machine Learning (3)</strong></summary>

- 📈 [Classic Machine Learning](docs/machine-learning/classic-ml.md) — Supervised/Unsupervised learning, Random Forests, SVMs, PCA, evaluation metrics
- 🧠 [Deep Learning](docs/machine-learning/deep-learning.md) — Neural networks, Backpropagation, CNNs, RNNs, optimizers, dropout
- 💬 [LLM Interview Questions](docs/machine-learning/llm-interviews.md) — Transformers, Attention mechanism, RAG, Fine-tuning, LoRA, Prompt Engineering

</details>

<details>
<summary><strong>🩵 Specialized Systems (3)</strong></summary>

- 📝 [Real-time Collaboration (Google Docs)](docs/advanced/collaboration-editing.md) — OT vs CRDT, operation logs, full Google Docs architecture
- 🎣 [Webhooks System Design](docs/advanced/webhooks.md) — Signed delivery, exponential retry, idempotency keys, full architecture
- 🔌 [Realtime Communication Patterns](docs/architecture/realtime-communication.md) — Polling, SSE, WebSockets, Redis pub/sub scaling

</details>

<details>
<summary><strong>🟦 Reference (2)</strong></summary>

- 🎯 [Common Scenarios & Solutions](docs/reference/scenario-cheat-sheet.md) — 9 cheat-sheet patterns: read-heavy, write-heavy, realtime, search, Top-K, fan-out, files, global consistency, collaboration
- 📋 [Reusable Design Templates](docs/reference/reusable-design-templates.md) — 12 full blueprints with architecture diagrams: YouTube, Twitter, WhatsApp, Uber, TinyURL, Rate Limiter, Metrics, TicketMaster, AI Agent, Typeahead, Google Docs, LeetCode

</details>

---

## 🛤️ Learning Paths

Pick a path based on your experience level, then use the **[interactive site](https://ali-meh619.github.io/System_Design_ML_Principles/)** to track your progress.

### 🌱 Beginner — Build your foundation (6 topics)

```
Interview Framework → Numbers to Know → Database Selection → Caching Deep Dive → API Design & Gateway → Rate Limiting
```

### 🚀 Mid-Level — Master distributed systems (7 topics)

```
Distributed Fundamentals → Resilience Patterns → Observability → High Availability → Microservices → Notifications → Message Queues
```

### 🏆 Advanced — Push beyond the standard interview (7 topics)

```
AI Agent System Design → Real-time Collaboration → Probabilistic DS → Stream Processing → Distributed Locking → ML System Design → DB Internals
```

---

## ⌨️ Keyboard Shortcuts

Open the [interactive site](https://ali-meh619.github.io/System_Design_ML_Principles/) and press `?` to see all shortcuts:

| Key | Action |
|-----|--------|
| `/` | Focus search |
| `d` | Toggle dark mode |
| `q` | Start quiz / flashcard mode |
| `b` | Toggle bookmarks panel |
| `?` | Show all keyboard shortcuts |
| `Esc` | Close reader / clear search / close panel |
| `Space` | Reveal quiz answer |
| `→` / `←` | Next / previous quiz card or topic |

---

## 🚀 Quick Start

**Option A — Interactive site (recommended)**

```
https://ali-meh619.github.io/System_Design_ML_Principles/
```

No install. Works offline after first load. Progress saves to your browser.

**Option B — Run locally**

```bash
git clone https://github.com/Ali-Meh619/System_Design_ML_Principles.git
cd System_Design_ML_Principles
# Open site/index.html in your browser — no server needed
```

**Option C — Read on GitHub**

Navigate to [docs/](docs/) and click any topic. GitHub renders Markdown natively.

---

## 📁 Repository Structure

```
System_Design_ML_Principles/
├── site/                       # Interactive web app (no build step)
│   ├── index.html              # Main SPA — dark mode, quiz, bookmarks, inline reader
│   ├── styles.css              # Full design system with dark/light mode
│   ├── app.js                  # All interactive features
│   └── topics.js               # Topic registry with icons, difficulty, tags, paths
├── docs/                       # 37 topic documents
│   ├── fundamentals/           # Interview framework, estimation, I/O, networking
│   ├── architecture/           # APIs, load balancing, rate limiting, realtime, CDN
│   ├── data/                   # Databases, caching, queues, internals
│   ├── distributed/            # CAP, consistency, microservices, resilience, patterns
│   ├── search/                 # Full-text search, typeahead, geo, stream processing
│   ├── scale/                  # Observability, HA, ID gen, pagination, notifications
│   ├── security/               # Auth, privacy, compliance
│   ├── advanced/               # ML, AI agents, probabilistic DS, collaboration
│   ├── machine-learning/       # Classic ML, Deep Learning, LLM interview questions
│   └── reference/              # Design templates (12 blueprints), scenario cheat sheet
└── assets/                     # Architecture diagram images
```

---

## 📖 Doc Format

Every topic document follows a consistent structure optimized for interview prep:

```markdown
## Problem
What are we solving? When does this come up in an interview?

## Options
What are the main approaches? (with trade-off table)

## Recommended Default
What to pick and why, with the specific caveats.

## Failure Modes
What breaks? How do you detect and recover?

## Metrics
What do you measure to know it's working?

## Interview Answer Sketch
The concise 2-minute answer you'd give under time pressure.
```

---

## 🤝 Contributing

Contributions make this better for everyone:

1. **Fork** the repo and create a branch: `git checkout -b feat/your-topic`
2. **Follow the doc format** above — every topic needs trade-offs and failure modes
3. **Add the topic** to `site/topics.js` with an icon, difficulty, and tags
4. **Open a PR** using the provided template

Every substantial addition should include:

- ✅ When to use
- ❌ When NOT to use
- 💥 Common failure modes
- 📊 Measurable success metrics

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

---

## ⭐ If this helped you

- **Star the repo** — it helps others discover it
- **Share it** with your team or study group
- **Open issues** for topics you'd like to see covered
- **Submit PRs** to improve existing content

---

## 📄 License

MIT © 2026. Free to use, share, and build on.

---

<div align="center">

**Built with ❤️ for engineers who take system design seriously.**

[⭐ Star on GitHub](https://github.com/Ali-Meh619/System_Design_ML_Principles) &nbsp;·&nbsp; [🌐 Open Interactive Site](https://ali-meh619.github.io/System_Design_ML_Principles/) &nbsp;·&nbsp; [🐛 Report Issue](https://github.com/Ali-Meh619/System_Design_ML_Principles/issues)

</div>
