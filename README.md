<div align="center">

<br>

# ⚡ System Design & Machine Learning Playbook

### An interactive reference guide for engineers preparing for System Design, Cloud, and ML interviews.

<br>

<div align="center">
  <a href="https://ali-meh619.github.io/System_Design_ML_Principles/">
    <img src="https://img.shields.io/badge/🚀_Click_Here_to_Open_the-Interactive_Website-0d9488?style=for-the-badge&logo=vercel" alt="Open Interactive Website" />
  </a>
</div>

<br>

[![Stars](https://img.shields.io/github/stars/Ali-Meh619/System_Design_ML_Principles?style=for-the-badge&color=FFD700&logo=github)](https://github.com/Ali-Meh619/System_Design_ML_Principles/stargazers)
[![Forks](https://img.shields.io/github/forks/Ali-Meh619/System_Design_ML_Principles?style=for-the-badge&color=0d9488&logo=github)](https://github.com/Ali-Meh619/System_Design_ML_Principles/network/members)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Topics](https://img.shields.io/badge/Topics-48-purple?style=for-the-badge)](docs/)
[![Interactive](https://img.shields.io/badge/Site-Live-success?style=for-the-badge&logo=github)](https://ali-meh619.github.io/System_Design_ML_Principles/)

<br>

**[🌐 Open Interactive Site](https://ali-meh619.github.io/System_Design_ML_Principles/)** &nbsp;·&nbsp;
**[📚 Browse All Topics](docs/)** &nbsp;·&nbsp;
**[🎯 Start Here](docs/foundation/interview-framework.md)** &nbsp;·&nbsp;
**[🤝 Contribute](CONTRIBUTING.md)**

<br>

</div>

---

## ✨ How To Use This Repo

Most interview resources are either too scattered or too theoretical. This repo is organized around three practical tracks:

| Track | Best for | Start here |
|-------|----------|------------|
| **Core System Design** | Distributed systems, cloud/platform, APIs, storage, scaling | [docs/](docs/) |
| **AI & Machine Learning** | ML system design, agents, classic ML, deep learning, LLMs | [docs/machine-learning/README.md](docs/machine-learning/README.md) |
| **Reference & Practice Appendix** | Templates, cheat sheets, LeetCode patterns, LLD | [docs/reference/README.md](docs/reference/README.md) |

Use the interactive site when you want navigation, quiz mode, and progress tracking. Use the Markdown docs when you want dense references you can skim before an interview.

## 🚀 What Makes It Useful

| Feature | Description |
|---------|-------------|
| 🎯 **48 interview-ready topics** | Core system design, cloud/platform, AI/ML, security, and interview reference material |
| 🌙 **Dark / Light mode** | Persisted preference, instant toggle with `d` |
| ✅ **Progress tracking** | Mark topics as read. Your progress saves locally. |
| 🔖 **Bookmarks** | Save topics to revisit. Accessible from any page. |
| 🃏 **Quiz / Flashcard mode** | Randomized flashcard review across all 48 topics |
| 📖 **Inline reader** | Read every topic without leaving the page — with prev/next navigation |
| ⌨️ **Keyboard-first** | `/` search, `q` quiz, `b` bookmarks, `?` shortcuts |
| 📊 **Visual progress bar** | See your overall completion at a glance |
| 🗺️ **3 learning paths** | Beginner, Mid-Level, and Advanced tracks |
| 🔍 **Live search** | Searches title, category, summary, and tags |
| 🎨 **Category color coding** | Every domain has its own visual identity |
| 🚀 **Zero setup** | Open in browser. No install. No build step. |

---

## 🗂️ Topic Coverage (48 Topics)

<details>
<summary><strong>🟠 Foundation (4)</strong></summary>

- 📐 [The System Design Interview Framework](docs/foundation/interview-framework.md) — 4-step universal structure: Clarify → Estimate → Design → Deep Dive
- 🔢 [Numbers Every Engineer Must Know](docs/foundation/estimation-and-numbers.md) — Latency hierarchy, scale reference points, back-of-envelope formulas
- 💾 [IO Fundamentals: Read vs Write](docs/foundation/io-fundamentals.md) — Latency hierarchy, random vs sequential access, OS page cache, write amplification
- 🔌 [Networking & Concurrency](docs/foundation/networking-concurrency.md) — TCP vs UDP, HTTP/1.1 vs HTTP/2 vs HTTP/3 (QUIC), event loop, goroutines

</details>

<details>
<summary><strong>🟣 Data Storage (5)</strong></summary>

- 🗄️ [Database Selection Guide](docs/data/databases.md) — SQL vs NoSQL tension, 7 database types with when-to-use decision matrix
- ⚡ [Caching Deep Dive](docs/data/caching.md) — 5 cache layers, read/write patterns, eviction, cache invalidation strategies
- 📨 [Message Queues & Event Streaming](docs/data/message-queues.md) — Queue vs Kafka event log, delivery guarantees, DLQ, outbox pattern
- 🌐 [Storage & CDN](docs/data/storage-and-cdn.md) — Object/block/file storage, CDN pull vs push, cache invalidation
- 🔩 [Database Internals](docs/data/database-internals.md) — B-tree vs LSM, indexes, replication, CDC, sharding, ACID vs BASE, isolation levels

</details>

<details>
<summary><strong>🔵 API & Networking (4)</strong></summary>

- 🔌 [API Design & API Gateway](docs/api-networking/api-design.md) — REST vs gRPC vs GraphQL, gateway responsibilities, rate limiting algorithms
- ⚖️ [Load Balancing & Networking](docs/api-networking/load-balancing.md) — L4 vs L7, round-robin/least-connections/consistent hashing, health checks
- 🔴 [Real-time Communication](docs/api-networking/realtime-communication.md) — Polling, SSE, WebSockets compared; scaling stateful WS servers with Redis pub/sub
- 🚦 [Rate Limiting In Depth](docs/api-networking/rate-limiting.md) — Every algorithm compared, distributed Redis implementation, failure modes

</details>

<details>
<summary><strong>☁️ Cloud & Platform (5)</strong></summary>

- ☁️ [Cloud Fundamentals & Shared Responsibility](docs/cloud-platform/cloud-fundamentals.md) — Regions, availability zones, managed services, shared responsibility, environment boundaries
- 🖥️ [Compute & Deployment Patterns](docs/cloud-platform/compute-deployment-patterns.md) — VMs vs containers vs Kubernetes vs serverless, autoscaling, canary/blue-green rollout
- 🌍 [Cloud Networking & Traffic Management](docs/cloud-platform/cloud-networking-traffic-management.md) — VPCs, subnets, DNS, CDN/WAF, API gateways, service-to-service traffic
- 🪪 [IAM, Secrets & Governance](docs/cloud-platform/iam-secrets-governance.md) — Least privilege, workload identity, secret rotation, KMS, audit and guardrails
- 📉 [Reliability, Observability & Cost](docs/cloud-platform/reliability-observability-cost.md) — Multi-AZ vs multi-region, RTO/RPO, SLOs, budget alarms, cost-aware scaling

</details>

<details>
<summary><strong>🟢 Distributed Systems (5)</strong></summary>

- 🌐 [Distributed System Fundamentals](docs/distributed/distributed-fundamentals.md) — CAP, consistency models, consistent hashing, Saga vs 2PC, quorum, vector clocks
- 🔄 [Core Design Patterns](docs/distributed/core-design-patterns.md) — Fan-out (social feed), CQRS, event sourcing, outbox pattern, inventory contention
- 🧱 [Microservices vs Monolith](docs/distributed/microservices-vs-monolith.md) — When to decompose, service discovery, sync vs async communication
- 🛡️ [Resilience Patterns](docs/distributed/resilience-patterns.md) — Timeouts, retries + jitter, circuit breaker, fallbacks, backpressure, load shedding
- 🔒 [Distributed Locking](docs/distributed/distributed-locking.md) — Why local locks fail, Redis Redlock, fencing tokens

</details>

<details>
<summary><strong>🟡 Search & Analytics (4)</strong></summary>

- 🔍 [Search & Typeahead Systems](docs/search/search-and-typeahead.md) — Inverted index, prefix trie autocomplete, relevance ranking (TF-IDF, BM25)
- 📊 [Stream Processing & Top-K Systems](docs/search/stream-processing.md) — Count-Min Sketch, Lambda vs Kappa architecture, Flink, windowing
- 📍 [Geo & Location Systems](docs/search/geo-systems.md) — Geohash, quadtree, proximity queries, Uber-style driver matching
- 🎲 [Probabilistic Data Structures](docs/search/probabilistic-data-structures.md) — Bloom filter, HyperLogLog, Count-Min Sketch at massive scale

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
<summary><strong>🔴 Security (4)</strong></summary>

- 🔐 [Security & Authentication](docs/security/security-and-authentication.md) — Sessions vs JWT, OAuth 2.0 flow, API security checklist
- 🪪 [Authorization, SSO & MFA](docs/security/authorization-sso-mfa.md) — RBAC/ABAC/ReBAC, OIDC vs SAML, step-up authentication, passkeys
- 🛡️ [Privacy & Data Compliance](docs/security/privacy-and-compliance.md) — PII handling, encryption strategies, GDPR/CCPA, data residency
- 🔑 [Secrets Management & Threat Modeling](docs/security/secrets-management-threat-modeling.md) — secret rotation, API keys, KMS/HSM, STRIDE, attack paths

</details>

<details>
<summary><strong>🩷 AI & Machine Learning (5)</strong></summary>

- 🤖 [Machine Learning in System Design](docs/machine-learning/ml-in-system-design.md) — feature store, recommendation and ranking systems, rollout strategy, drift, serving latency, rollback
- 🧠 [AI Agent System Design](docs/machine-learning/ai-agent-system-design.md) — planner/reactor loops, retrieval, tool reliability, memory, budgets, safety
- 📈 [Classic Machine Learning](docs/machine-learning/classic-ml.md) — Bias-variance, bagging vs boosting, data leakage, XGBoost, SVM, PCA, class imbalance
- 🔬 [Deep Learning](docs/machine-learning/deep-learning.md) — Weight init, backprop, Adam/AdamW, BatchNorm, CNN (ResNet), LSTM, full Transformer deep-dive
- 💬 [LLM Interview Questions](docs/machine-learning/llm-interviews.md) — Transformers, RAG, LoRA/QLoRA, RLHF/DPO, decoding strategies, KV cache, CoT, hallucinations

</details>

<details>
<summary><strong>🩵 Specialized Systems (2)</strong></summary>

- 📝 [Real-time Collaboration (Google Docs)](docs/specialized/collaboration-editing.md) — OT vs CRDT, operation logs, full Google Docs architecture
- 🎣 [Webhooks System Design](docs/specialized/webhooks.md) — Signed delivery, exponential retry, idempotency keys, full architecture

</details>

<details>
<summary><strong>🟦 Reference (4)</strong></summary>

- 🎯 [Common Scenarios & Solutions](docs/reference/scenario-cheat-sheet.md) — 17 scenario cheat sheets covering classic patterns plus multi-tenant SaaS, webhooks, recommendation/ranking, and multi-region reliability
- 📋 [Reusable Design Templates](docs/reference/reusable-design-templates.md) — 12 full blueprints with architecture diagrams: YouTube, Twitter, WhatsApp, Uber, TinyURL, Rate Limiter, Metrics, TicketMaster, AI Agent, Typeahead, Google Docs, LeetCode
- 🧩 [LeetCode Question Patterns](docs/reference/leetcode-patterns.md) — 21 algorithm patterns with code templates: arrays, two pointers, sliding window, trees, graphs, DP, backtracking, tries, segment tree, and more
- 🏗️ [Low-Level System Design (LLD)](docs/reference/low-level-design.md) — SOLID principles, 10 design patterns with code, 11 classic LLD questions (LRU Cache, Parking Lot, Elevator, Rate Limiter, ATM, Tic-Tac-Toe, Logger, Library)

</details>

---

## 🛤️ Learning Paths

Pick a path based on your experience level, then use the **[interactive site](https://ali-meh619.github.io/System_Design_ML_Principles/)** to track your progress.

### 🌱 Beginner — Build your foundation (6 topics)

```
Interview Framework → Numbers to Know → Database Selection → Caching Deep Dive → API Design & Gateway → Rate Limiting
```

### 🚀 Mid-Level — Master distributed systems and platform basics (9 topics)

```
Distributed Fundamentals → Cloud Fundamentals → Compute & Deployment → Resilience Patterns → Observability → High Availability → Microservices → Notifications → Authorization / MFA
```

### 🏆 Advanced — Push beyond the standard interview (8 topics)

```
AI Agent System Design → ML System Design → Cloud Networking → IAM / Governance → Reliability, Observability & Cost → Real-time Collaboration → Probabilistic DS → DB Internals
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

<br>

## 🚀 Quick Start

**Option A — Interactive site (recommended)**

> **[Open the full Interactive Website here 🌐](https://ali-meh619.github.io/System_Design_ML_Principles/)**

No install. Works offline after first load. Progress saves to your browser.
Includes an inline reader, quiz/flashcard mode, dark mode, and bookmarks.

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
├── docs/                       # 48 topic documents
│   ├── foundation/             # Interview framework, estimation, I/O, networking
│   ├── api-networking/         # APIs, load balancing, rate limiting, realtime
│   ├── cloud-platform/         # Cloud foundations, deployment, networking, IAM, reliability
│   ├── data/                   # Databases, caching, queues, internals
│   ├── distributed/            # CAP, consistency, microservices, resilience, patterns
│   ├── search/                 # Full-text search, typeahead, geo, stream processing
│   ├── scale/                  # Observability, HA, ID gen, pagination, notifications
│   ├── security/               # Auth, AuthZ, privacy, secrets, threat modeling
│   ├── machine-learning/       # ML systems, agents, Classic ML, DL, LLMs
│   ├── specialized/            # Collaboration and webhook-heavy systems
│   └── reference/              # Templates, cheat sheets, LeetCode, LLD
└── assets/                     # Architecture diagram images
```

---

## 📖 Recommended Topic Structure

The strongest docs in this repo use a consistent interview-prep structure. Not every legacy page is identical yet, but new and upgraded docs aim to follow this pattern:

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
2. **Follow the recommended topic structure** above — especially defaults, trade-offs, failure modes, and metrics
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
