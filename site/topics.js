window.TOPICS = [
  /* ── Fundamentals ── */
  {
    title:      "Interview Framework",
    category:   "Fundamentals",
    icon:       "🎯",
    difficulty: "beginner",
    summary:    "Four-step structure for handling ambiguous prompts with clear trade-offs.",
    tags:       ["clarify", "estimate", "propose", "deep dive", "clarification", "framework"],
    path:       "../docs/fundamentals/interview-framework.md"
  },
  {
    title:      "Estimation and Numbers",
    category:   "Fundamentals",
    icon:       "📊",
    difficulty: "beginner",
    summary:    "QPS, storage, and latency references used to justify architecture choices.",
    tags:       ["qps", "throughput", "latency", "bandwidth", "back-of-envelope", "numbers"],
    path:       "../docs/fundamentals/estimation-and-numbers.md"
  },

  /* ── Architecture ── */
  {
    title:      "IO, Networking, and Concurrency",
    category:   "Architecture",
    icon:       "⚡",
    difficulty: "mid",
    summary:    "Transport and concurrency model selection for scalable services.",
    tags:       ["tcp", "udp", "http", "async", "blocking", "thread pool", "event loop"],
    path:       "../docs/architecture/io-networking-concurrency.md"
  },
  {
    title:      "API Design and Load Balancing",
    category:   "Architecture",
    icon:       "🔌",
    difficulty: "beginner",
    summary:    "REST/gRPC/GraphQL trade-offs plus gateway and load balancer strategy.",
    tags:       ["rest", "grpc", "graphql", "api gateway", "round robin", "consistent hashing"],
    path:       "../docs/architecture/api-and-load-balancing.md"
  },

  /* ── Data ── */
  {
    title:      "Database Selection",
    category:   "Data",
    icon:       "🗄️",
    difficulty: "beginner",
    summary:    "How to pick relational, document, key-value, wide-column, and search stores.",
    tags:       ["sql", "nosql", "postgres", "mongodb", "cassandra", "dynamodb", "polyglot"],
    path:       "../docs/data/databases.md"
  },
  {
    title:      "Caching",
    category:   "Data",
    icon:       "⚡",
    difficulty: "mid",
    summary:    "Cache layers, read/write patterns, invalidation, and hot-key mitigation.",
    tags:       ["redis", "memcached", "cache-aside", "write-through", "ttl", "eviction", "lru"],
    path:       "../docs/data/caching.md"
  },
  {
    title:      "Queues and Streaming",
    category:   "Data",
    icon:       "📨",
    difficulty: "mid",
    summary:    "Event semantics, DLQs, retries, and outbox pattern fundamentals.",
    tags:       ["kafka", "sqs", "rabbitmq", "at-least-once", "exactly-once", "dlq", "outbox"],
    path:       "../docs/data/queues-and-streaming.md"
  },
  {
    title:      "Advanced Data Patterns",
    category:   "Data",
    icon:       "🔄",
    difficulty: "advanced",
    summary:    "CQRS, event sourcing, materialized views, and backfill workflows.",
    tags:       ["cqrs", "event sourcing", "materialized view", "etl", "elt", "hot partition"],
    path:       "../docs/data/advanced-data-patterns.md"
  },
  {
    title:      "Database Internals",
    category:   "Data",
    icon:       "🔬",
    difficulty: "advanced",
    summary:    "B-tree vs LSM, replication, CDC, and isolation-level implications.",
    tags:       ["b-tree", "lsm", "wal", "replication", "cdc", "isolation", "mvcc", "sstable"],
    path:       "../docs/data/database-internals.md"
  },
  {
    title:      "ID Generation and Pagination",
    category:   "Data",
    icon:       "🔢",
    difficulty: "mid",
    summary:    "Snowflake/UUID choices and scalable cursor/keyset pagination.",
    tags:       ["snowflake", "uuid", "ulid", "cursor", "keyset", "offset", "pagination"],
    path:       "../docs/data/id-generation-and-pagination.md"
  },

  /* ── Distributed ── */
  {
    title:      "Distributed Fundamentals",
    category:   "Distributed",
    icon:       "🌐",
    difficulty: "mid",
    summary:    "CAP, consistency models, quorum math, and consistent hashing basics.",
    tags:       ["cap theorem", "consistency", "availability", "partition tolerance", "quorum", "vector clocks"],
    path:       "../docs/distributed/distributed-fundamentals.md"
  },
  {
    title:      "Consistency and Transactions",
    category:   "Distributed",
    icon:       "⚖️",
    difficulty: "advanced",
    summary:    "Saga vs 2PC, conflict handling, and invariants-first design.",
    tags:       ["saga", "2pc", "two phase commit", "idempotency", "conflict", "crdt", "lww"],
    path:       "../docs/distributed/consistency-and-transactions.md"
  },
  {
    title:      "Microservices vs Monolith",
    category:   "Distributed",
    icon:       "🏗️",
    difficulty: "mid",
    summary:    "Boundary and team heuristics for service decomposition decisions.",
    tags:       ["microservices", "monolith", "service mesh", "decompose", "bounded context", "ddd"],
    path:       "../docs/distributed/microservices-vs-monolith.md"
  },
  {
    title:      "Distributed Locking",
    category:   "Distributed",
    icon:       "🔐",
    difficulty: "advanced",
    summary:    "Lease-based locks, fencing tokens, and safer alternatives.",
    tags:       ["distributed lock", "redlock", "lease", "fencing token", "mutual exclusion", "zookeeper"],
    path:       "../docs/distributed/distributed-locking.md"
  },

  /* ── Reliability ── */
  {
    title:      "Resilience Patterns",
    category:   "Reliability",
    icon:       "🛡️",
    difficulty: "mid",
    summary:    "Timeouts, retries, breakers, load shedding, and fallback design.",
    tags:       ["circuit breaker", "retry", "backoff", "jitter", "bulkhead", "timeout", "load shedding"],
    path:       "../docs/reliability/resilience-patterns.md"
  },
  {
    title:      "Observability",
    category:   "Reliability",
    icon:       "👁️",
    difficulty: "mid",
    summary:    "Metrics, logs, traces, SLO mapping, and incident visibility.",
    tags:       ["metrics", "logging", "tracing", "slo", "sla", "alerting", "prometheus", "opentelemetry"],
    path:       "../docs/reliability/observability.md"
  },
  {
    title:      "High Availability and Scaling",
    category:   "Reliability",
    icon:       "📈",
    difficulty: "mid",
    summary:    "Failover architecture, autoscaling signals, and regional resilience.",
    tags:       ["ha", "failover", "autoscaling", "active-active", "active-passive", "rto", "rpo", "multi-region"],
    path:       "../docs/reliability/high-availability-and-scaling.md"
  },

  /* ── Security ── */
  {
    title:      "Security and Authentication",
    category:   "Security",
    icon:       "🔒",
    difficulty: "beginner",
    summary:    "Auth models, authorization controls, API hardening, and auditability.",
    tags:       ["jwt", "oauth", "oidc", "rbac", "abac", "session", "tls", "api key", "mfa"],
    path:       "../docs/security/security-and-authentication.md"
  },
  {
    title:      "Privacy and Compliance",
    category:   "Security",
    icon:       "📋",
    difficulty: "mid",
    summary:    "PII handling, retention/deletion, data residency, and encryption policies.",
    tags:       ["gdpr", "ccpa", "pii", "data residency", "encryption", "tokenization", "right to erasure"],
    path:       "../docs/security/privacy-and-compliance.md"
  },

  /* ── Systems ── */
  {
    title:      "Search and Typeahead",
    category:   "Systems",
    icon:       "🔍",
    difficulty: "mid",
    summary:    "Inverted index architecture, prefix queries, and relevance metrics.",
    tags:       ["elasticsearch", "inverted index", "trie", "prefix", "ranking", "relevance", "typeahead"],
    path:       "../docs/systems/search-and-typeahead.md"
  },
  {
    title:      "Realtime Communication",
    category:   "Systems",
    icon:       "💬",
    difficulty: "mid",
    summary:    "WebSockets/SSE/long polling and connection scaling patterns.",
    tags:       ["websocket", "sse", "long polling", "pubsub", "fanout", "presence", "chat"],
    path:       "../docs/systems/realtime-communication.md"
  },
  {
    title:      "Collaboration Editing",
    category:   "Systems",
    icon:       "✏️",
    difficulty: "advanced",
    summary:    "OT vs CRDT with operation logs and conflict-safe sync.",
    tags:       ["ot", "crdt", "operational transform", "conflict", "offline", "sync", "google docs"],
    path:       "../docs/systems/collaboration-editing.md"
  },
  {
    title:      "Geo Systems",
    category:   "Systems",
    icon:       "🗺️",
    difficulty: "advanced",
    summary:    "Geohash and spatial indexing for proximity and mobility use cases.",
    tags:       ["geohash", "quadtree", "r-tree", "proximity", "nearby", "geofencing", "location"],
    path:       "../docs/systems/geo-systems.md"
  },
  {
    title:      "Webhooks",
    category:   "Systems",
    icon:       "🔗",
    difficulty: "mid",
    summary:    "Secure signed delivery, retries, and idempotent consumption.",
    tags:       ["webhook", "signed payload", "hmac", "retry", "idempotent", "delivery", "event"],
    path:       "../docs/systems/webhooks.md"
  },
  {
    title:      "Mobile System Design",
    category:   "Systems",
    icon:       "📱",
    difficulty: "mid",
    summary:    "Offline-first sync, push strategy, and battery/network constraints.",
    tags:       ["mobile", "offline", "sync", "push notification", "battery", "delta sync", "apns", "fcm"],
    path:       "../docs/systems/mobile-system-design.md"
  },

  /* ── AI ── */
  {
    title:      "ML in System Design",
    category:   "AI",
    icon:       "🤖",
    difficulty: "advanced",
    summary:    "Data-to-serving pipeline, feature stores, and model operations.",
    tags:       ["machine learning", "feature store", "model serving", "training", "mlops", "drift", "pipeline"],
    path:       "../docs/ai/ml-in-system-design.md"
  },
  {
    title:      "AI Agent System Design",
    category:   "AI",
    icon:       "🧠",
    difficulty: "advanced",
    summary:    "Planner/tool/memory architecture with guardrails and evaluations.",
    tags:       ["llm", "agent", "rag", "tool use", "memory", "guardrails", "orchestrator", "multi-agent"],
    path:       "../docs/ai/ai-agent-system-design.md"
  },
  {
    title:      "Probabilistic Data Structures",
    category:   "AI",
    icon:       "🎲",
    difficulty: "advanced",
    summary:    "Bloom filters, HyperLogLog, and Count-Min sketch at scale.",
    tags:       ["bloom filter", "hyperloglog", "count-min sketch", "approximate", "probabilistic", "cardinality"],
    path:       "../docs/ai/probabilistic-data-structures.md"
  },

  /* ── Templates ── */
  {
    title:      "Reusable Design Templates",
    category:   "Templates",
    icon:       "📐",
    difficulty: "beginner",
    summary:    "Reference blueprints for common interview system categories.",
    tags:       ["template", "blueprint", "reference", "content platform", "feed", "booking", "rate limiter"],
    path:       "../docs/templates/reusable-design-templates.md"
  },
  {
    title:      "Scenario Cheat Sheet",
    category:   "Templates",
    icon:       "📝",
    difficulty: "beginner",
    summary:    "Fast pattern lookup for read-heavy, realtime, search, and global systems.",
    tags:       ["cheat sheet", "patterns", "quick reference", "read-heavy", "write-heavy", "global"],
    path:       "../docs/templates/scenario-cheat-sheet.md"
  },

  /* ── Playbooks ── */
  {
    title:      "Interview Day Playbook",
    category:   "Playbooks",
    icon:       "🎪",
    difficulty: "beginner",
    summary:    "Practical sequence to execute during real interview rounds.",
    tags:       ["interview", "playbook", "preparation", "mental model", "execution", "day-of"],
    path:       "../playbooks/interview-day-playbook.md"
  },
  {
    title:      "30-Minute Round",
    category:   "Playbooks",
    icon:       "⏱️",
    difficulty: "beginner",
    summary:    "Tight workflow for short interview rounds with mandatory outputs.",
    tags:       ["30 min", "short", "time-boxed", "workflow", "outputs", "bottleneck"],
    path:       "../playbooks/system-design-30min.md"
  },
  {
    title:      "60-Minute Round",
    category:   "Playbooks",
    icon:       "⏰",
    difficulty: "mid",
    summary:    "Expanded deep-dive workflow for full-length interview sessions.",
    tags:       ["60 min", "full length", "deep dive", "data model", "multi-region", "consistency"],
    path:       "../playbooks/system-design-60min.md"
  },
  {
    title:      "Decision Matrix",
    category:   "Playbooks",
    icon:       "🔀",
    difficulty: "mid",
    summary:    "Quick decision aid for database, service boundary, consistency, and messaging.",
    tags:       ["decision", "matrix", "trade-off", "database", "consistency", "messaging", "service boundary"],
    path:       "../playbooks/decision-matrix.md"
  }
];
