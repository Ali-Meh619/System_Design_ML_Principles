<div align="center">

<br>

# ⚡ System Design Playbook

### The most comprehensive, interactive system design reference — built for engineers preparing for technical interviews.

<br>

[![Stars](https://img.shields.io/github/stars/Ali-Meh619/System_Design_Principles?style=for-the-badge&color=FFD700&logo=github)](https://github.com/Ali-Meh619/System_Design_Principles/stargazers)
[![Forks](https://img.shields.io/github/forks/Ali-Meh619/System_Design_Principles?style=for-the-badge&color=0d9488&logo=github)](https://github.com/Ali-Meh619/System_Design_Principles/network/members)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Topics](https://img.shields.io/badge/Topics-34-purple?style=for-the-badge)](docs/)
[![Interactive](https://img.shields.io/badge/Site-Live-success?style=for-the-badge&logo=vercel)](https://ali-meh619.github.io/System_Design_Principles/site/)

<br>

**[🌐 Live Interactive Site](https://ali-meh619.github.io/System_Design_Principles/site/)** &nbsp;·&nbsp;
**[📚 Browse All Topics](docs/)** &nbsp;·&nbsp;
**[🎯 Start Here](docs/fundamentals/interview-framework.md)** &nbsp;·&nbsp;
**[🤝 Contribute](CONTRIBUTING.md)**

<br>

</div>

---

## ✨ What makes this different?

Most system design resources are either scattered blog posts or 400-page books. This repo gives you **everything in one place** — structured, searchable, and interactive.

| Feature | Description |
|---------|-------------|
| 🎯 **34 interview-ready topics** | Every domain: distributed systems, databases, security, AI, and more |
| 🌙 **Dark / Light mode** | Persisted preference, instant toggle with `d` |
| ✅ **Progress tracking** | Mark topics as read. Your progress saves locally. |
| 🔖 **Bookmarks** | Save topics to revisit. Accessible from any page. |
| 🃏 **Quiz / Flashcard mode** | Randomized flashcard review across all 34 topics |
| ⌨️ **Keyboard-first** | `/` search, `q` quiz, `b` bookmarks, `?` shortcuts |
| 📊 **Visual progress bar** | See your overall completion at a glance |
| 🗺️ **3 learning paths** | Beginner, Mid-Level, and Advanced tracks |
| 🔍 **Live search** | Searches title, category, summary, and tags |
| 🎨 **Category color coding** | Every domain has its own visual identity |
| 🚀 **Zero setup** | Open in browser. No install. No build step. |

---

## 🗂️ Topic Coverage (35 Topics)

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
- 📨 [Message Queues & Event Streaming](docs/data/queues-and-streaming.md) — Queue vs Kafka event log, delivery guarantees, DLQ, outbox pattern
- 🌐 [Storage & CDN](docs/architecture/storage-and-cdn.md) — Object/block/file storage, CDN pull vs push, cache invalidation
- 🔩 [Database Internals](docs/data/database-internals.md) — B-tree vs LSM, indexes, replication, CDC, sharding, ACID vs BASE, isolation levels

</details>

<details>
<summary><strong>🔵 API & Networking (3)</strong></summary>

- 🔌 [API Design & API Gateway](docs/architecture/api-design.md) — REST vs gRPC vs GraphQL, gateway responsibilities, rate limiting algorithms
- ⚖️ [Load Balancing & Networking](docs/architecture/load-balancing.md) — L4 vs L7, round-robin/least-connections/consistent hashing, health checks
- 🔴 [Real-time Communication](docs/systems/realtime-communication.md) — Polling, SSE, WebSockets compared; scaling stateful WS servers with Redis pub/sub

</details>

<details>
<summary><strong>🟢 Distributed Systems (5)</strong></summary>

- 🌐 [Distributed System Fundamentals](docs/distributed/distributed-fundamentals.md) — CAP, consistency models, consistent hashing, Saga vs 2PC, quorum, vector clocks
- 🔄 [Core Design Patterns](docs/architecture/core-design-patterns.md) — Fan-out (social feed), CQRS, event sourcing, outbox pattern, inventory contention
- 🧱 [Microservices vs Monolith](docs/distributed/microservices-vs-monolith.md) — When to decompose, service discovery, sync vs async communication
- 🛡️ [Resilience Patterns](docs/reliability/resilience-patterns.md) — Timeouts, retries + jitter, circuit breaker, fallbacks, backpressure, load shedding
- 🔒 [Distributed Locking](docs/distributed/distributed-locking.md) — Why local locks fail, Redis Redlock, fencing tokens

</details>

<details>
<summary><strong>🟡 Search & Analytics (3)</strong></summary>

- 🔍 [Search & Typeahead Systems](docs/systems/search-and-typeahead.md) — Inverted index, prefix trie autocomplete, relevance ranking (TF-IDF, BM25)
- 📊 [Stream Processing & Top-K Systems](docs/data/stream-processing.md) — Count-Min Sketch, Lambda vs Kappa architecture, Flink, windowing
- 📍 [Geo & Location Systems](docs/systems/geo-systems.md) — Geohash, quadtree, proximity queries, Uber-style driver matching

</details>

<details>
<summary><strong>🟢 Scale & Reliability (4)</strong></summary>

- 📡 [Observability & Monitoring](docs/reliability/observability.md) — Metrics, logs, traces (the three pillars), SLOs, error budgets, OpenTelemetry
- 📈 [High Availability & Auto Scaling](docs/reliability/high-availability-and-scaling.md) — Active-passive vs active-active, autoscaling signals, multi-region patterns
- 🆔 [Unique ID Generation](docs/data/id-generation.md) — UUID v4/v7/ULID, Twitter Snowflake, ticket servers — when to use each
- 📄 [API Pagination](docs/data/pagination.md) — Why offset pagination fails, cursor-based and keyset pagination at scale

</details>

<details>
<summary><strong>🔴 Security (2)</strong></summary>

- 🔐 [Security & Authentication](docs/security/security-and-authentication.md) — Sessions vs JWT, OAuth 2.0 flow, API security checklist
- 🛡️ [Privacy & Data Compliance](docs/security/privacy-and-compliance.md) — PII handling, encryption strategies, GDPR/CCPA, data residency

</details>

<details>
<summary><strong>🩷 AI & Advanced (4)</strong></summary>

- 🔁 [Advanced Data Patterns](docs/data/advanced-data-patterns.md) — Pre-computation, materialized views, ETL vs ELT, hot spot problem, backfill
- 🤖 [Machine Learning in System Design](docs/ai/ml-in-system-design.md) — 5-layer ML pipeline, feature store, recommendation systems, model serving
- 🧠 [AI Agent System Design](docs/ai/ai-agent-system-design.md) — Planner/tool/memory anatomy, multi-agent patterns, safety, LLM-as-a-Judge
- 🎲 [Probabilistic Data Structures](docs/ai/probabilistic-data-structures.md) — Bloom filter, HyperLogLog, Count-Min Sketch at massive scale

</details>

<details>
<summary><strong>🩵 Specialized Systems (3)</strong></summary>

- 📝 [Real-time Collaboration (Google Docs)](docs/systems/collaboration-editing.md) — OT vs CRDT, operation logs, full Google Docs architecture
- 🎣 [Webhooks System Design](docs/systems/webhooks.md) — Signed delivery, exponential retry, idempotency keys, full architecture
- 📱 [Mobile System Design](docs/systems/mobile-system-design.md) — Offline-first, delta sync, push notifications (APNs/FCM), battery constraints

</details>

<details>
<summary><strong>🟦 Reference (2)</strong></summary>

- 🎯 [Common Scenarios & Solutions](docs/templates/scenario-cheat-sheet.md) — 9 cheat-sheet patterns: read-heavy, write-heavy, realtime, search, Top-K, fan-out, files, global consistency, collaboration
- 📋 [Reusable Design Templates](docs/templates/reusable-design-templates.md) — 12 complete blueprints: YouTube, Twitter feed, WhatsApp, Uber, TinyURL, Rate Limiter, Metrics, TicketMaster, AI Agent, Typeahead, Google Docs, LeetCode

</details>

---

## 🛤️ Learning Paths

Pick a path based on your experience level, then use the **[interactive site](https://ali-meh619.github.io/System_Design_Principles/site/)** to track your progress.

### 🌱 Beginner — Build your foundation

```
Interview Framework → Numbers to Know → Database Selection → Caching Deep Dive → API Design & Gateway
```

### 🚀 Mid-Level — Master distributed systems

```
Distributed Fundamentals → Resilience Patterns → Observability & Monitoring → High Availability & Scaling → Microservices vs Monolith
```

### 🏆 Advanced — Push beyond the standard interview

```
AI Agent System Design → Real-time Collaboration → Probabilistic Data Structures → Stream Processing & Top-K → Distributed Locking
```

---

## ⌨️ Keyboard Shortcuts

Open the [interactive site](https://ali-meh619.github.io/System_Design_Principles/site/) and press `?` to see all shortcuts, or use these immediately:

| Key | Action |
|-----|--------|
| `/` | Focus search |
| `d` | Toggle dark mode |
| `q` | Start quiz / flashcard mode |
| `b` | Toggle bookmarks panel |
| `?` | Show all keyboard shortcuts |
| `Esc` | Clear search / close panel |
| `Space` | Reveal quiz answer |
| `→` / `←` | Next / previous quiz card |

---

## 🚀 Quick Start

**Option A — Interactive site (recommended)**

```
https://ali-meh619.github.io/System_Design_Principles/site/
```

No install. Works offline after first load. Progress saves to your browser.

**Option B — Read docs directly**

```bash
git clone https://github.com/Ali-Meh619/System_Design_Principles.git
# Then open site/index.html in your browser
# Or browse docs/ for the markdown source files
```

**Option C — GitHub (read in-browser)**

Navigate to [docs/](docs/) and click any topic. GitHub renders Markdown beautifully.

---

## 📁 Repository Structure

```
System_Design_Principles/
├── site/                   # Interactive web app
│   ├── index.html          # Main SPA — dark mode, quiz, bookmarks
│   ├── styles.css          # Full design system with dark mode
│   ├── app.js              # All interactive features
│   └── topics.js           # Topic data with icons, difficulty, tags
├── docs/                   # 34 topic documents
│   ├── fundamentals/       # Interview framework, estimation
│   ├── architecture/       # APIs, networking, load balancing
│   ├── data/               # Databases, caching, queues (6 docs)
│   ├── distributed/        # CAP, consistency, locking (4 docs)
│   ├── reliability/        # Resilience, observability, HA
│   ├── security/           # Auth, privacy, compliance
│   ├── systems/            # Search, realtime, geo (6 docs)
│   ├── ai/                 # ML, agents, probabilistic structures
│   └── templates/          # Design templates, cheat sheets
├── playbooks/              # Interview execution guides
│   ├── interview-day-playbook.md
│   ├── system-design-30min.md
│   ├── system-design-60min.md
│   └── decision-matrix.md
└── .github/                # PR templates, issue templates
```

---

## 📖 Doc Format

Every topic document follows a consistent structure optimized for interview preparation:

```markdown
## Problem
What are we solving? When does this come up?

## Options
What are the main approaches? (with trade-off table)

## Recommended Default
What to pick and why, with the caveats.

## Failure Modes
What breaks? How do you detect and recover?

## Metrics
What do you measure to know it's working?

## Interview Answer Sketch
The concise answer you'd give under time pressure.
```

---

## 🤝 Contributing

Contributions make this better for everyone. Here's how:

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

[⭐ Star on GitHub](https://github.com/Ali-Meh619/System_Design_Principles) &nbsp;·&nbsp; [🌐 Open Interactive Site](https://ali-meh619.github.io/System_Design_Principles/site/) &nbsp;·&nbsp; [🐛 Report Issue](https://github.com/Ali-Meh619/System_Design_Principles/issues)

</div>
