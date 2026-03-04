window.TOPICS = [
  {
    title: "Interview Framework",
    category: "Fundamentals",
    summary: "Four-step structure for handling ambiguous prompts with clear trade-offs.",
    path: "../docs/fundamentals/interview-framework.md"
  },
  {
    title: "Estimation and Numbers",
    category: "Fundamentals",
    summary: "QPS, storage, and latency references used to justify architecture choices.",
    path: "../docs/fundamentals/estimation-and-numbers.md"
  },
  {
    title: "IO, Networking, and Concurrency",
    category: "Architecture",
    summary: "Transport and concurrency model selection for scalable services.",
    path: "../docs/architecture/io-networking-concurrency.md"
  },
  {
    title: "API Design and Load Balancing",
    category: "Architecture",
    summary: "REST/gRPC/GraphQL trade-offs plus gateway and LB strategy.",
    path: "../docs/architecture/api-and-load-balancing.md"
  },
  {
    title: "Database Selection",
    category: "Data",
    summary: "How to pick relational, document, key-value, wide-column, and search stores.",
    path: "../docs/data/databases.md"
  },
  {
    title: "Caching",
    category: "Data",
    summary: "Cache layers, read/write patterns, invalidation, and hot-key mitigation.",
    path: "../docs/data/caching.md"
  },
  {
    title: "Queues and Streaming",
    category: "Data",
    summary: "Event semantics, DLQs, retries, and outbox pattern fundamentals.",
    path: "../docs/data/queues-and-streaming.md"
  },
  {
    title: "Advanced Data Patterns",
    category: "Data",
    summary: "CQRS, event sourcing, materialized views, and backfill workflows.",
    path: "../docs/data/advanced-data-patterns.md"
  },
  {
    title: "Database Internals",
    category: "Data",
    summary: "B-tree vs LSM, replication, CDC, and isolation-level implications.",
    path: "../docs/data/database-internals.md"
  },
  {
    title: "ID Generation and Pagination",
    category: "Data",
    summary: "Snowflake/UUID choices and scalable cursor/keyset pagination.",
    path: "../docs/data/id-generation-and-pagination.md"
  },
  {
    title: "Distributed Fundamentals",
    category: "Distributed",
    summary: "CAP, consistency models, quorum math, and consistent hashing basics.",
    path: "../docs/distributed/distributed-fundamentals.md"
  },
  {
    title: "Consistency and Transactions",
    category: "Distributed",
    summary: "Saga vs 2PC, conflict handling, and invariants-first design.",
    path: "../docs/distributed/consistency-and-transactions.md"
  },
  {
    title: "Microservices vs Monolith",
    category: "Distributed",
    summary: "Boundary and team heuristics for decomposition decisions.",
    path: "../docs/distributed/microservices-vs-monolith.md"
  },
  {
    title: "Distributed Locking",
    category: "Distributed",
    summary: "Lease-based locks, fencing tokens, and safer alternatives.",
    path: "../docs/distributed/distributed-locking.md"
  },
  {
    title: "Resilience Patterns",
    category: "Reliability",
    summary: "Timeouts, retries, breakers, load shedding, and fallback design.",
    path: "../docs/reliability/resilience-patterns.md"
  },
  {
    title: "Observability",
    category: "Reliability",
    summary: "Metrics, logs, traces, SLO mapping, and incident visibility.",
    path: "../docs/reliability/observability.md"
  },
  {
    title: "High Availability and Scaling",
    category: "Reliability",
    summary: "Failover architecture, autoscaling signals, and regional resilience.",
    path: "../docs/reliability/high-availability-and-scaling.md"
  },
  {
    title: "Security and Authentication",
    category: "Security",
    summary: "Auth models, authorization controls, API hardening, and auditability.",
    path: "../docs/security/security-and-authentication.md"
  },
  {
    title: "Privacy and Compliance",
    category: "Security",
    summary: "PII handling, retention/deletion, data residency, and encryption policies.",
    path: "../docs/security/privacy-and-compliance.md"
  },
  {
    title: "Search and Typeahead",
    category: "Systems",
    summary: "Inverted index architecture, prefix queries, and relevance metrics.",
    path: "../docs/systems/search-and-typeahead.md"
  },
  {
    title: "Realtime Communication",
    category: "Systems",
    summary: "WebSockets/SSE/long polling and connection scaling patterns.",
    path: "../docs/systems/realtime-communication.md"
  },
  {
    title: "Collaboration Editing",
    category: "Systems",
    summary: "OT vs CRDT with operation logs and conflict-safe sync.",
    path: "../docs/systems/collaboration-editing.md"
  },
  {
    title: "Geo Systems",
    category: "Systems",
    summary: "Geohash and spatial indexing for proximity and mobility use cases.",
    path: "../docs/systems/geo-systems.md"
  },
  {
    title: "Webhooks",
    category: "Systems",
    summary: "Secure signed delivery, retries, and idempotent consumption.",
    path: "../docs/systems/webhooks.md"
  },
  {
    title: "Mobile System Design",
    category: "Systems",
    summary: "Offline-first sync, push strategy, and battery/network constraints.",
    path: "../docs/systems/mobile-system-design.md"
  },
  {
    title: "ML in System Design",
    category: "AI",
    summary: "Data-to-serving pipeline, feature stores, and model operations.",
    path: "../docs/ai/ml-in-system-design.md"
  },
  {
    title: "AI Agent System Design",
    category: "AI",
    summary: "Planner/tool/memory architecture with guardrails and evaluations.",
    path: "../docs/ai/ai-agent-system-design.md"
  },
  {
    title: "Probabilistic Data Structures",
    category: "AI",
    summary: "Bloom filters, HyperLogLog, and Count-Min sketch at scale.",
    path: "../docs/ai/probabilistic-data-structures.md"
  },
  {
    title: "Reusable Design Templates",
    category: "Templates",
    summary: "Reference blueprints for common interview system categories.",
    path: "../docs/templates/reusable-design-templates.md"
  },
  {
    title: "Scenario Cheat Sheet",
    category: "Templates",
    summary: "Fast pattern lookup for read-heavy, realtime, search, and global systems.",
    path: "../docs/templates/scenario-cheat-sheet.md"
  },
  {
    title: "Interview Day Playbook",
    category: "Playbooks",
    summary: "Practical sequence to execute during real interview rounds.",
    path: "../playbooks/interview-day-playbook.md"
  },
  {
    title: "30-Minute Round",
    category: "Playbooks",
    summary: "Tight workflow for short interview rounds with mandatory outputs.",
    path: "../playbooks/system-design-30min.md"
  },
  {
    title: "60-Minute Round",
    category: "Playbooks",
    summary: "Expanded deep-dive workflow for full-length interview sessions.",
    path: "../playbooks/system-design-60min.md"
  },
  {
    title: "Decision Matrix",
    category: "Playbooks",
    summary: "Quick decision aid for database, service boundary, consistency, and messaging.",
    path: "../playbooks/decision-matrix.md"
  }
];
