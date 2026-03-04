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

## 🗂️ Topic Coverage

<details>
<summary><strong>📚 Fundamentals (2)</strong></summary>

- 🎯 [Interview Framework](docs/fundamentals/interview-framework.md) — 4-step structure: Clarify → Estimate → Propose → Deep dive
- 📊 [Estimation and Numbers](docs/fundamentals/estimation-and-numbers.md) — QPS, storage, latency ladder, capacity planning

</details>

<details>
<summary><strong>🏗️ Architecture (2)</strong></summary>

- ⚡ [IO, Networking, and Concurrency](docs/architecture/io-networking-concurrency.md) — Blocking vs async, TCP vs UDP, HTTP/2 vs HTTP/3
- 🔌 [API Design and Load Balancing](docs/architecture/api-and-load-balancing.md) — REST/gRPC/GraphQL, API gateway, consistent hashing

</details>

<details>
<summary><strong>🗄️ Data (6)</strong></summary>

- 🗄️ [Database Selection](docs/data/databases.md) — Relational, document, key-value, wide-column, search
- ⚡ [Caching](docs/data/caching.md) — Cache-aside, write-through, LRU/LFU, cache stampede
- 📨 [Queues and Streaming](docs/data/queues-and-streaming.md) — At-least-once, exactly-once, DLQ, outbox pattern
- 🔄 [Advanced Data Patterns](docs/data/advanced-data-patterns.md) — CQRS, event sourcing, materialized views
- 🔬 [Database Internals](docs/data/database-internals.md) — B-tree vs LSM, WAL, replication, isolation levels
- 🔢 [ID Generation and Pagination](docs/data/id-generation-and-pagination.md) — Snowflake IDs, keyset pagination

</details>

<details>
<summary><strong>🌐 Distributed (4)</strong></summary>

- 🌐 [Distributed Fundamentals](docs/distributed/distributed-fundamentals.md) — CAP, consistency, quorum, vector clocks
- ⚖️ [Consistency and Transactions](docs/distributed/consistency-and-transactions.md) — Saga vs 2PC, conflict resolution
- 🏗️ [Microservices vs Monolith](docs/distributed/microservices-vs-monolith.md) — When to decompose, hidden costs
- 🔐 [Distributed Locking](docs/distributed/distributed-locking.md) — Lease-based locks, fencing tokens, safer alternatives

</details>

<details>
<summary><strong>🛡️ Reliability (3)</strong></summary>

- 🛡️ [Resilience Patterns](docs/reliability/resilience-patterns.md) — Circuit breaker, retry, bulkhead, load shedding
- 👁️ [Observability](docs/reliability/observability.md) — Metrics, logs, traces, SLO mapping, alerting
- 📈 [High Availability and Scaling](docs/reliability/high-availability-and-scaling.md) — Active-active, autoscaling, multi-region

</details>

<details>
<summary><strong>🔒 Security (2)</strong></summary>

- 🔒 [Security and Authentication](docs/security/security-and-authentication.md) — JWT, OAuth, RBAC/ABAC, API hardening
- 📋 [Privacy and Compliance](docs/security/privacy-and-compliance.md) — GDPR, PII, data residency, encryption

</details>

<details>
<summary><strong>⚙️ Systems (6)</strong></summary>

- 🔍 [Search and Typeahead](docs/systems/search-and-typeahead.md) — Inverted index, prefix trie, relevance ranking
- 💬 [Realtime Communication](docs/systems/realtime-communication.md) — WebSocket, SSE, pub-sub, connection scaling
- ✏️ [Collaboration Editing](docs/systems/collaboration-editing.md) — OT vs CRDT, offline sync, conflict semantics
- 🗺️ [Geo Systems](docs/systems/geo-systems.md) — Geohash, quadtree, proximity queries, geofencing
- 🔗 [Webhooks](docs/systems/webhooks.md) — Signed delivery, retry policies, idempotent consumption
- 📱 [Mobile System Design](docs/systems/mobile-system-design.md) — Offline-first, delta sync, push notifications

</details>

<details>
<summary><strong>🤖 AI (3)</strong></summary>

- 🤖 [ML in System Design](docs/ai/ml-in-system-design.md) — Feature stores, model serving, MLOps, drift detection
- 🧠 [AI Agent System Design](docs/ai/ai-agent-system-design.md) — Planner/tool/memory, guardrails, multi-agent patterns
- 🎲 [Probabilistic Data Structures](docs/ai/probabilistic-data-structures.md) — Bloom filter, HyperLogLog, Count-Min sketch

</details>

<details>
<summary><strong>📐 Templates (2) + 🎯 Playbooks (4)</strong></summary>

- 📐 [Reusable Design Templates](docs/templates/reusable-design-templates.md) — Content platform, social feed, chat, booking
- 📝 [Scenario Cheat Sheet](docs/templates/scenario-cheat-sheet.md) — Fast lookup for read-heavy, realtime, global systems
- 🎪 [Interview Day Playbook](playbooks/interview-day-playbook.md) — Practical execution sequence for the real interview
- ⏱️ [30-Minute Round](playbooks/system-design-30min.md) — Time-boxed workflow with mandatory outputs
- ⏰ [60-Minute Round](playbooks/system-design-60min.md) — Expanded deep-dive workflow for full sessions
- 🔀 [Decision Matrix](playbooks/decision-matrix.md) — Quick decision aid: DB, service boundary, consistency, messaging

</details>

---

## 🛤️ Learning Paths

Pick a path based on your experience level, then use the **[interactive site](https://ali-meh619.github.io/System_Design_Principles/site/)** to track your progress.

### 🌱 Beginner — Build your foundation

```
Interview Framework → Estimation & Numbers → Database Selection → Caching → API Design
```

### 🚀 Mid-Level — Master distributed systems

```
Distributed Fundamentals → Consistency & Transactions → Resilience Patterns → Observability → HA & Scaling
```

### 🏆 Advanced — Push beyond the standard interview

```
AI Agent System Design → Collaboration Editing → Probabilistic Data Structures → Privacy & Compliance → Distributed Locking
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
