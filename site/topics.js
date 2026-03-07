/* ═══════════════════════════════════════════════════════════════
   System Design Playbook — Topics
   39 sections across 10 categories
   ═══════════════════════════════════════════════════════════════ */
window.TOPICS = [

  /* ── FOUNDATION ─────────────────────────────────────────────── */

  {
    id:         "framework",
    title:      "The System Design Interview Framework",
    category:   "Foundation",
    icon:       "📐",
    difficulty: "beginner",
    summary:    "The universal 4-step approach that applies to every single question — from URL Shortener to YouTube.",
    subtopics:  [
      "Why Structure Matters",
      "Step 1 — Clarify Requirements (5–8 min)",
      "Step 2 — Estimate Scale (5 min)",
      "Step 3 — High-Level Design (10 min)",
      "Step 4 — Deep Dive & Trade-offs (15 min)",
    ],
    tags:  ["clarify", "estimate", "propose", "deep dive", "framework", "requirements", "trade-offs"],
    path:  "../docs/fundamentals/interview-framework.md"
  },

  {
    id:         "numbers",
    title:      "Numbers Every Engineer Must Know",
    category:   "Foundation",
    icon:       "🔢",
    difficulty: "beginner",
    summary:    "Latency hierarchy, scale reference points, and quick estimation formulas. The foundation for every architecture decision you justify.",
    subtopics:  [
      "Latency Numbers (Hierarchy of Speed)",
      "Scale Reference Points",
      "Quick Estimation Formula",
    ],
    tags:  ["latency", "qps", "throughput", "bandwidth", "back-of-envelope", "numbers", "estimation"],
    path:  "../docs/fundamentals/estimation-and-numbers.md"
  },

  {
    id:         "io",
    title:      "IO Fundamentals: Read vs Write",
    category:   "Foundation",
    icon:       "💾",
    difficulty: "mid",
    summary:    "The latency hierarchy, random vs sequential access, OS page cache, and write amplification. Why RAM is king.",
    subtopics:  [
      "The Latency Hierarchy (Why RAM is King)",
      "Random vs Sequential Access",
      "The OS Page Cache (The Hidden Cache)",
      "Write Amplification",
    ],
    tags:  ["io", "latency", "ram", "ssd", "hdd", "page cache", "b-tree", "lsm", "write amplification"],
    path:  "../docs/fundamentals/io-fundamentals.md"
  },

  {
    id:         "networking",
    title:      "Networking & Concurrency",
    category:   "Foundation",
    icon:       "🔌",
    difficulty: "mid",
    summary:    "TCP vs UDP, HTTP/1.1 vs HTTP/2 vs HTTP/3 (QUIC), and concurrency models — thread-per-request, event loop, goroutines.",
    subtopics:  [
      "TCP vs UDP",
      "HTTP Protocols (1.1 vs 2 vs 3 / QUIC)",
      "Concurrency Models (Thread-per-request, Event Loop, Goroutines)",
    ],
    tags:  ["tcp", "udp", "http2", "http3", "quic", "async", "blocking", "event loop", "goroutines"],
    path:  "../docs/fundamentals/networking-concurrency.md"
  },

  /* ── DATA STORAGE ────────────────────────────────────────────── */

  {
    id:         "databases",
    title:      "Database Selection Guide",
    category:   "Data Storage",
    icon:       "🗄️",
    difficulty: "beginner",
    summary:    "SQL vs NoSQL tension, and when to pick relational, key-value, wide-column, document, time-series, search, or OLAP stores.",
    subtopics:  [
      "The Core Tension: SQL vs NoSQL",
      "Relational Databases (SQL)",
      "Key-Value Stores",
      "Wide-Column Stores (Cassandra)",
      "Document Databases",
      "Time-Series Databases",
      "Search Databases",
      "OLAP / Analytics Databases",
    ],
    tags:  ["sql", "nosql", "postgres", "mongodb", "cassandra", "dynamodb", "redis", "elasticsearch", "polyglot"],
    path:  "../docs/data/databases.md"
  },

  {
    id:         "caching",
    title:      "Caching Deep Dive",
    category:   "Data Storage",
    icon:       "⚡",
    difficulty: "mid",
    summary:    "The 5 cache layers, read/write patterns, eviction policies, and the hardest problem: cache invalidation.",
    subtopics:  [
      "What Caching Does (and Why You Need It)",
      "The 5 Cache Layers",
      "Cache Read Patterns (Cache-aside, Read-through)",
      "Cache Write Patterns (Write-through, Write-behind)",
      "Eviction Policies (LRU, LFU, TTL)",
      "Cache Invalidation — The Hardest Problem",
    ],
    tags:  ["redis", "memcached", "cache-aside", "write-through", "ttl", "eviction", "lru", "lfu", "stampede", "hot key"],
    path:  "../docs/data/caching.md"
  },

  {
    id:         "queues",
    title:      "Message Queues & Event Streaming",
    category:   "Data Storage",
    icon:       "📨",
    difficulty: "mid",
    summary:    "Queue vs event log (Kafka), delivery guarantees, dead letter queues, and the outbox pattern for reliable messaging.",
    subtopics:  [
      "Why Queues Exist",
      "Message Queue vs Event Log (Kafka)",
      "Kafka Deep Dive (partitions, offsets, consumer groups)",
      "Delivery Guarantees (at-most-once, at-least-once, exactly-once)",
      "Dead Letter Queues (DLQ)",
    ],
    tags:  ["kafka", "sqs", "rabbitmq", "at-least-once", "exactly-once", "dlq", "outbox", "consumer group", "partition"],
    path:  "../docs/data/message-queues.md"
  },

  {
    id:         "storage",
    title:      "Storage & CDN",
    category:   "Data Storage",
    icon:       "🌐",
    difficulty: "beginner",
    summary:    "Object storage (S3) for files, block storage for databases, and CDNs for global low-latency delivery.",
    subtopics:  [
      "The Three Storage Types (Object, Block, File)",
      "CDN (Content Delivery Network)",
      "Pull CDN vs Push CDN",
      "Cache Invalidation & Versioned URLs",
    ],
    tags:  ["s3", "object storage", "cdn", "cloudfront", "cloudflare", "block storage", "ebs", "presigned url"],
    path:  "../docs/architecture/storage-and-cdn.md"
  },

  {
    id:         "dbinternals",
    title:      "Database Internals",
    category:   "Data Storage",
    icon:       "🔩",
    difficulty: "advanced",
    summary:    "B-tree vs LSM-tree, indexes, replication strategies, CDC, sharding, ACID vs BASE, and isolation levels.",
    subtopics:  [
      "B-tree vs LSM-tree — The Two Storage Engines",
      "Database Indexes — How They Actually Work",
      "Database Replication Strategies",
      "Change Data Capture (CDC)",
      "Sharding (Partitioning)",
      "ACID vs BASE",
      "Isolation Levels",
    ],
    tags:  ["b-tree", "lsm", "wal", "replication", "cdc", "sharding", "isolation", "mvcc", "sstable", "acid", "base"],
    path:  "../docs/data/database-internals.md"
  },

  /* ── API & NETWORKING ────────────────────────────────────────── */

  {
    id:         "api",
    title:      "API Design & API Gateway",
    category:   "API & Networking",
    icon:       "🔌",
    difficulty: "beginner",
    summary:    "REST vs gRPC vs GraphQL trade-offs, what the API Gateway handles, and rate limiting in depth.",
    subtopics:  [
      "REST vs gRPC vs GraphQL",
      "The API Gateway (auth, rate limiting, routing, TLS)",
      "Rate Limiting Algorithms (Token Bucket, Leaky Bucket, Sliding Window)",
    ],
    tags:  ["rest", "grpc", "graphql", "api gateway", "rate limiting", "token bucket", "openapi", "protobuf"],
    path:  "../docs/architecture/api-design.md"
  },

  {
    id:         "lb",
    title:      "Load Balancing & Networking",
    category:   "API & Networking",
    icon:       "⚖️",
    difficulty: "mid",
    summary:    "L4 vs L7 load balancing, algorithms (round-robin, least-connections, consistent hashing), health checks, and global routing.",
    subtopics:  [
      "L4 vs L7 Load Balancing",
      "Load Balancing Algorithms",
      "Health Checks & Failover",
      "Connection Draining (Graceful Shutdown)",
    ],
    tags:  ["load balancer", "round robin", "least connections", "consistent hashing", "health check", "l4", "l7", "nginx", "alb"],
    path:  "../docs/architecture/load-balancing.md"
  },

  {
    id:         "realtime",
    title:      "Real-time Communication",
    category:   "API & Networking",
    icon:       "🔴",
    difficulty: "mid",
    summary:    "Short polling, long polling, SSE, and WebSockets compared — plus how to scale stateful WebSocket servers.",
    subtopics:  [
      "The 4 Protocols Compared (Polling, Long-poll, SSE, WebSocket)",
      "Scaling WebSocket Servers (Redis Pub/Sub)",
    ],
    tags:  ["websocket", "sse", "long polling", "pubsub", "fanout", "presence", "chat", "redis pub/sub"],
    path:  "../docs/architecture/realtime-communication.md"
  },

  /* ── DISTRIBUTED SYSTEMS ─────────────────────────────────────── */

  {
    id:         "distributed",
    title:      "Distributed System Fundamentals",
    category:   "Distributed Systems",
    icon:       "🌐",
    difficulty: "mid",
    summary:    "CAP theorem, consistency models, consistent hashing, distributed transactions (Saga vs 2PC), quorum, and vector clocks.",
    subtopics:  [
      "CAP Theorem — The Fundamental Law",
      "Consistency Models (Strong, Eventual, Causal)",
      "Consistent Hashing — How Systems Distribute Data",
      "Distributed Transactions: Saga vs 2PC",
      "Idempotency — Critical for Reliability",
      "Quorum Consensus (N, R, W)",
      "Vector Clocks — Detecting Conflicts",
    ],
    tags:  ["cap theorem", "consistency", "availability", "partition tolerance", "quorum", "vector clocks", "saga", "2pc", "consistent hashing"],
    path:  "../docs/distributed/distributed-fundamentals.md"
  },

  {
    id:         "patterns",
    title:      "Core Design Patterns",
    category:   "Distributed Systems",
    icon:       "🔄",
    difficulty: "mid",
    summary:    "Fan-out on write vs read (social feeds), CQRS, event sourcing, the outbox pattern, and inventory contention strategies.",
    subtopics:  [
      "Fan-Out: Write vs Read (Social Feed)",
      "CQRS — Command Query Responsibility Segregation",
      "Event Sourcing",
      "The Outbox Pattern (Reliable Event Publishing)",
      "Inventory Contention (Booking / Ticketing)",
    ],
    tags:  ["cqrs", "event sourcing", "fan-out", "outbox", "materialized view", "social feed", "booking", "optimistic locking"],
    path:  "../docs/distributed/core-design-patterns.md"
  },

  {
    id:         "microservices",
    title:      "Microservices vs Monolith",
    category:   "Distributed Systems",
    icon:       "🧱",
    difficulty: "mid",
    summary:    "When to split, when not to split; Docker containers vs VMs; Kubernetes orchestration (Pods, Deployments, Services, HPA, rolling updates); service discovery; sync vs async communication; service mesh; API contracts; and data management patterns.",
    subtopics:  [
      "Monolith vs Microservices Decision (when to split, Strangler Fig)",
      "Docker — Containers, Images, Dockerfile, layer caching",
      "Container vs VM — key differences and trade-offs",
      "Kubernetes — Pods, Deployments, Services, Ingress",
      "Kubernetes — HPA auto-scaling, ConfigMap/Secrets, Namespaces",
      "K8s Deployment Strategies — rolling update, blue/green, canary",
      "Docker + K8s CI/CD flow end-to-end",
      "Service Discovery — client-side, server-side, DNS (K8s built-in)",
      "Synchronous vs Asynchronous Communication",
      "Service Mesh — Istio/Envoy sidecar, mTLS, circuit breaking",
      "API Contracts & Bounded Contexts (DDD, Pact testing)",
      "Data Management — Database-per-Service, Saga, API Composition",
    ],
    tags:  ["microservices", "monolith", "docker", "kubernetes", "k8s", "containers", "pods", "hpa", "service mesh", "service discovery", "bounded context", "ddd", "strangler fig", "devops"],
    path:  "../docs/distributed/microservices-vs-monolith.md"
  },

  {
    id:         "resilience",
    title:      "Resilience Patterns",
    category:   "Distributed Systems",
    icon:       "🛡️",
    difficulty: "mid",
    summary:    "Timeouts, retries with exponential backoff and jitter, circuit breakers, fallbacks, backpressure, and load shedding.",
    subtopics:  [
      "Timeouts — The Most Important Single Rule",
      "Retries — Exponential Backoff and Jitter",
      "Circuit Breaker — Automatic Failure Isolation",
      "Fallbacks — What to Do When It Fails",
      "Backpressure — Don't Overwhelm the Consumer",
      "Load Shedding — Survival Mode",
    ],
    tags:  ["circuit breaker", "retry", "backoff", "jitter", "bulkhead", "timeout", "load shedding", "hystrix", "resilience4j"],
    path:  "../docs/distributed/resilience-patterns.md"
  },

  {
    id:         "locking",
    title:      "Distributed Locking",
    category:   "Distributed Systems",
    icon:       "🔒",
    difficulty: "advanced",
    summary:    "Why local locks don't work in distributed systems, Redis Redlock, and fencing tokens as the safety net.",
    subtopics:  [
      "Why Local Locks Don't Work",
      "Redis Redlock Algorithm",
      "Fencing Tokens — The Safety Net",
    ],
    tags:  ["distributed lock", "redlock", "lease", "fencing token", "mutual exclusion", "zookeeper", "redis"],
    path:  "../docs/advanced/distributed-locking.md"
  },

  {
    id:         "ratelimiting",
    title:      "Rate Limiting In Depth",
    category:   "API & Networking",
    icon:       "🚦",
    difficulty: "mid",
    summary:    "Every algorithm compared (Token Bucket, Leaky Bucket, Sliding Window), distributed rate limiting with Redis, and designing a standalone rate limiter service.",
    subtopics:  [
      "Token Bucket — Burst-Friendly Rate Limiting",
      "Leaky Bucket — Smooth Output Rate",
      "Fixed Window Counter (and why it's broken)",
      "Sliding Window Counter — Best of Both Worlds",
      "Distributed Rate Limiting Architecture",
      "Rate Limiter Response Headers & Failure Modes",
    ],
    tags:  ["rate limiting", "token bucket", "leaky bucket", "sliding window", "redis", "lua", "429", "throttle", "api gateway", "cloudflare"],
    path:  "../docs/architecture/rate-limiting.md"
  },

  /* ── SEARCH & ANALYTICS ──────────────────────────────────────── */

  {
    id:         "search",
    title:      "Search & Typeahead Systems",
    category:   "Search & Analytics",
    icon:       "🔍",
    difficulty: "mid",
    summary:    "Inverted index architecture for full-text search and prefix trie for typeahead/autocomplete at scale.",
    subtopics:  [
      "How Full-Text Search Works: Inverted Index",
      "Typeahead / Autocomplete Architecture",
      "Relevance Ranking (TF-IDF, BM25)",
    ],
    tags:  ["elasticsearch", "inverted index", "trie", "prefix", "ranking", "relevance", "typeahead", "autocomplete", "tf-idf"],
    path:  "../docs/search/search-and-typeahead.md"
  },

  {
    id:         "stream",
    title:      "Stream Processing & Top-K Systems",
    category:   "Search & Analytics",
    icon:       "📊",
    difficulty: "advanced",
    summary:    "Top-K algorithms (Count-Min Sketch, Misra-Gries), Lambda vs Kappa architecture, Flink, and windowing.",
    subtopics:  [
      "The Top-K Problem",
      "Count-Min Sketch & Heavy Hitters",
      "Lambda vs Kappa Architecture",
      "Windowing (Tumbling, Sliding, Session)",
      "Event Time vs Processing Time",
    ],
    tags:  ["flink", "kafka streams", "spark", "count-min sketch", "hyperloglog", "lambda", "kappa", "windowing", "trending"],
    path:  "../docs/search/stream-processing.md"
  },

  {
    id:         "geo",
    title:      "Geo & Location Systems",
    category:   "Search & Analytics",
    icon:       "📍",
    difficulty: "advanced",
    summary:    "Proximity queries, geohash encoding, quadtrees, and Uber-style real-time driver matching architecture.",
    subtopics:  [
      "The Core Problem: Proximity Queries",
      "Geohash — Encoding Location as a String",
      "Quadtree — Dynamic Spatial Indexing",
      "Uber-Style Real-Time Driver Matching",
    ],
    tags:  ["geohash", "quadtree", "r-tree", "proximity", "nearby", "geofencing", "location", "uber", "spatial index"],
    path:  "../docs/search/geo-systems.md"
  },

  /* ── SCALE & RELIABILITY ─────────────────────────────────────── */

  {
    id:         "observability",
    title:      "Observability & Monitoring",
    category:   "Scale & Reliability",
    icon:       "📡",
    difficulty: "mid",
    summary:    "Metrics, logs, and traces — the three pillars of observability. SLOs, error budgets, and what to mention in every interview.",
    subtopics:  [
      "The Three Pillars: Metrics, Logs, Traces",
      "RED Metrics (Rate, Errors, Duration)",
      "SLOs, SLAs, and Error Budgets",
      "Distributed Tracing (OpenTelemetry)",
    ],
    tags:  ["metrics", "logging", "tracing", "slo", "sla", "alerting", "prometheus", "grafana", "opentelemetry", "jaeger"],
    path:  "../docs/scale/observability.md"
  },

  {
    id:         "hascaling",
    title:      "High Availability & Auto Scaling",
    category:   "Scale & Reliability",
    icon:       "📈",
    difficulty: "mid",
    summary:    "Active-passive vs active-active failover, auto-scaling signals, and multi-region architecture patterns.",
    subtopics:  [
      "High Availability Patterns (Active-Passive, Active-Active)",
      "Auto Scaling — Elastic Infrastructure",
      "Multi-Region Architecture — Going Global",
    ],
    tags:  ["ha", "failover", "autoscaling", "active-active", "active-passive", "rto", "rpo", "multi-region", "global"],
    path:  "../docs/scale/high-availability-scaling.md"
  },

  {
    id:         "idgen",
    title:      "Unique ID Generation",
    category:   "Scale & Reliability",
    icon:       "🆔",
    difficulty: "mid",
    summary:    "Why auto-increment fails at scale, and when to use UUID v4, UUID v7 / ULID, Twitter Snowflake, or a ticket server.",
    subtopics:  [
      "Why Database Auto-Increment Fails at Scale",
      "UUID v4 (Random) vs UUID v7 / ULID (Time-ordered)",
      "Twitter Snowflake — The Industry Standard",
      "Ticket Server (Database Sequences)",
    ],
    tags:  ["snowflake", "uuid", "ulid", "id generation", "distributed id", "twitter snowflake", "monotonic"],
    path:  "../docs/scale/id-generation.md"
  },

  {
    id:         "pagination",
    title:      "API Pagination",
    category:   "Scale & Reliability",
    icon:       "📄",
    difficulty: "mid",
    summary:    "Why offset pagination fails at scale, and how cursor-based / keyset pagination gives O(log N) performance at any depth.",
    subtopics:  [
      "Why Pagination Matters",
      "Offset Pagination — The Trap",
      "Cursor-Based Pagination",
      "Keyset Pagination (The Right Answer)",
    ],
    tags:  ["pagination", "cursor", "keyset", "offset", "infinite scroll", "page depth", "performance"],
    path:  "../docs/scale/pagination.md"
  },

  {
    id:         "notifications",
    title:      "Notification System Design",
    category:   "Scale & Reliability",
    icon:       "🔔",
    difficulty: "mid",
    summary:    "Reliable multi-channel delivery (push, SMS, email) with fan-out at scale, idempotency, user preferences, retry with DLQ, and 35K notifications/second architecture.",
    subtopics:  [
      "Why Notification Systems Are Hard",
      "Notification Channels & Providers (APNs, FCM, Twilio, SendGrid)",
      "High-Level Architecture (Kafka fan-out)",
      "User Preference Service",
      "Fan-out: One Event → Millions of Users",
      "Retry Strategy & Dead Letter Queue",
      "Token Management & Deduplication",
    ],
    tags:  ["notifications", "push", "sms", "email", "fcm", "apns", "fan-out", "kafka", "idempotency", "dlq", "twilio", "sendgrid"],
    path:  "../docs/scale/notification-system.md"
  },

  /* ── SECURITY ────────────────────────────────────────────────── */

  {
    id:         "security",
    title:      "Security & Authentication",
    category:   "Security",
    icon:       "🔐",
    difficulty: "mid",
    summary:    "Session-based vs JWT auth, OAuth 2.0 authorization code flow, and the full API security checklist.",
    subtopics:  [
      "Authentication: Sessions vs JWT",
      "OAuth 2.0 — Authorization Code Flow",
      "API Security Checklist (TLS, RBAC, rate limiting, secrets)",
    ],
    tags:  ["jwt", "oauth", "oidc", "rbac", "abac", "session", "tls", "api key", "mfa", "refresh token"],
    path:  "../docs/security/security-and-authentication.md"
  },

  {
    id:         "privacy",
    title:      "Privacy & Data Compliance",
    category:   "Security",
    icon:       "🛡️",
    difficulty: "mid",
    summary:    "PII classification and handling, encryption at rest and in transit, GDPR right-to-erasure, and data residency.",
    subtopics:  [
      "PII (Personally Identifiable Information) Handling",
      "Encryption Strategies (at rest, in transit, field-level)",
      "GDPR, CCPA — Compliance Essentials",
      "Data Residency & Retention Policies",
    ],
    tags:  ["gdpr", "ccpa", "pii", "data residency", "encryption", "tokenization", "right to erasure", "audit log"],
    path:  "../docs/security/privacy-and-compliance.md"
  },

  /* ── AI & ADVANCED ───────────────────────────────────────────── */

  {
    id:         "advanced",
    title:      "Advanced Data Patterns",
    category:   "AI & Advanced",
    icon:       "🔁",
    difficulty: "advanced",
    summary:    "Pre-computation and materialized views, ETL vs ELT, hot spot problem, and backfill/reprocessing patterns.",
    subtopics:  [
      "Pre-computation and Materialized Views",
      "ETL vs ELT — Data Pipeline Design",
      "Hot Key / Hot Spot Problem",
      "Backfill & Reprocessing",
    ],
    tags:  ["cqrs", "materialized view", "etl", "elt", "hot partition", "backfill", "reprocessing", "write salting"],
    path:  "../docs/scale/advanced-data-patterns.md"
  },

  {
    id:         "ml",
    title:      "Machine Learning in System Design",
    category:   "AI & Advanced",
    icon:       "🤖",
    difficulty: "advanced",
    summary:    "The full ML system architecture: data pipeline, feature store, recommendation systems, and model serving infrastructure.",
    subtopics:  [
      "The ML System Architecture (5 layers)",
      "Feature Store — The Most Important ML Infrastructure",
      "Recommendation System Architecture",
      "Model Serving Infrastructure (online, batch, fallback)",
    ],
    tags:  ["machine learning", "feature store", "model serving", "training", "mlops", "drift", "recommendation", "embeddings"],
    path:  "../docs/advanced/ml-in-system-design.md"
  },

  {
    id:         "agents",
    title:      "AI Agent System Design",
    category:   "AI & Advanced",
    icon:       "🧠",
    difficulty: "advanced",
    summary:    "Agent anatomy (planner, tools, memory), cognitive architectures, multi-agent patterns, safety, and LLM-as-a-Judge evaluation.",
    subtopics:  [
      "Core Agent Anatomy (Planner, Tool Executor, Memory)",
      "Cognitive Architectures (ReAct, CoT, Reflection)",
      "Multi-Agent Patterns (Orchestrator-Worker, Planner-Critic)",
      "Tool Use & Safety Patterns",
      "Evaluation (LLM-as-a-Judge)",
    ],
    tags:  ["llm", "agent", "rag", "tool use", "memory", "guardrails", "orchestrator", "multi-agent", "react", "chain-of-thought"],
    path:  "../docs/advanced/ai-agent-system-design.md"
  },

  {
    id:         "probabilistic",
    title:      "Probabilistic Data Structures",
    category:   "AI & Advanced",
    icon:       "🎲",
    difficulty: "advanced",
    summary:    "Bloom filters, HyperLogLog, and Count-Min Sketch — when approximation beats exactness at massive scale.",
    subtopics:  [
      "Bloom Filter — \"Have I seen this before?\"",
      "HyperLogLog — Counting Unique Items",
      "Count-Min Sketch — Frequency Counting",
    ],
    tags:  ["bloom filter", "hyperloglog", "count-min sketch", "approximate", "probabilistic", "cardinality", "false positive"],
    path:  "../docs/advanced/probabilistic-data-structures.md"
  },

  /* ── SPECIALIZED SYSTEMS ─────────────────────────────────────── */

  {
    id:         "collab",
    title:      "Real-time Collaboration (Google Docs)",
    category:   "Specialized Systems",
    icon:       "📝",
    difficulty: "advanced",
    summary:    "Concurrent edits, Operational Transformation (OT) vs CRDTs, and the full Google Docs-style system architecture.",
    subtopics:  [
      "The Core Problem: Concurrent Edits",
      "Operational Transformation (OT)",
      "CRDT — The Simpler Alternative",
      "Google Docs System Architecture",
    ],
    tags:  ["ot", "crdt", "operational transform", "conflict", "offline", "sync", "google docs", "presence", "version vector"],
    path:  "../docs/advanced/collaboration-editing.md"
  },

  {
    id:         "webhooks",
    title:      "Webhooks System Design",
    category:   "Specialized Systems",
    icon:       "🎣",
    difficulty: "mid",
    summary:    "Reliable webhook delivery: signed payloads, exponential backoff retries, idempotency keys, and the full architecture.",
    subtopics:  [
      "The Challenge (delivery guarantees, fan-out, security)",
      "Webhook Architecture (queue-backed, signed, retried)",
    ],
    tags:  ["webhook", "signed payload", "hmac", "retry", "idempotent", "delivery", "event", "at-least-once"],
    path:  "../docs/advanced/webhooks.md"
  },

  {
    id:         "mobile",
    title:      "Mobile System Design",
    category:   "Specialized Systems",
    icon:       "📱",
    difficulty: "mid",
    summary:    "Offline-first architecture, delta sync, push notifications (APNs/FCM), and battery/bandwidth constraints.",
    subtopics:  [
      "Offline Support & Sync (local-first)",
      "Push Notifications (APNs, FCM, fanout strategy)",
      "Battery Optimization",
    ],
    tags:  ["mobile", "offline", "sync", "push notification", "battery", "delta sync", "apns", "fcm", "bandwidth"],
    path:  "../docs/advanced/mobile-system-design.md"
  },

  /* ── REFERENCE ───────────────────────────────────────────────── */

  {
    id:         "low-level-design",
    title:      "Low-Level System Design (LLD)",
    category:   "Reference",
    icon:       "🏗️",
    difficulty: "intermediate",
    summary:    "Object-oriented design for interviews: SOLID principles, 13 design patterns with code (Singleton, Factory, Builder, Observer, Strategy, State, Command, Decorator, Composite), 7 classic LLD questions fully implemented (LRU Cache, Parking Lot, Elevator, Rate Limiter, KV Store, Pub/Sub, ATM), concurrency patterns, and a design-pattern selector table.",
    subtopics:  [
      "LLD Interview Framework (6-step approach)",
      "SOLID Principles — one rule + violation signal per principle",
      "Singleton — thread-safe double-checked locking",
      "Factory — decouple creation from usage",
      "Builder — method chaining for complex objects",
      "Decorator — add behaviour without subclassing",
      "Composite — tree structures, uniform interface",
      "Observer / EventBus — one-to-many notification",
      "Strategy — swap algorithms at runtime",
      "State — eliminate if/elif with state classes",
      "Command — encapsulate requests, enable undo/redo",
      "LRU Cache — HashMap + Doubly Linked List",
      "Parking Lot — inheritance, Spot/Vehicle/Ticket",
      "Elevator System — State + SCAN scheduling",
      "Rate Limiter — Token Bucket with threading.Lock",
      "In-Memory KV Store — lazy TTL expiry",
      "Pub/Sub Message Broker — topic-based delivery",
      "ATM — full State machine walkthrough",
      "Concurrency patterns — Lock, RLock, Condition, Queue",
      "Design Pattern Selector table",
      "LLD Interview Cheat Sheet (12 questions mapped to patterns)",
    ],
    tags:  ["lld", "oop", "design patterns", "solid", "singleton", "factory", "observer", "strategy", "state", "lru cache", "parking lot", "elevator", "concurrency", "object oriented", "interview"],
    path:  "../docs/reference/low-level-design.md"
  },

  {
    id:         "leetcode-patterns",
    title:      "LeetCode Question Patterns",
    category:   "Reference",
    icon:       "🧩",
    difficulty: "intermediate",
    summary:    "19 patterns with code templates covering every major LeetCode archetype: pattern chooser, arrays & hashing (two-sum, Dutch flag), two pointers (3Sum), sliding window, stack, binary search (left/right bound, peak), linked list (Nth from end, Floyd's), trees (LCA, path DFS), heap, backtracking (grid search), tries, graphs (cycle detection), advanced graphs, DP (state machine, palindrome, knapsack, bitmask), greedy, intervals, monotonic deque, segment tree / BIT, combinatorics — plus a full complexity cheat sheet.",
    subtopics:  [
      "Pattern 0 — The Pattern Chooser (use first, every time)",
      "Pattern 1 — Arrays & Hashing (frequency map, prefix sum, two-sum hash, Dutch flag)",
      "Pattern 2 — Two Pointers (l/r shrink, slow/fast write, 3Sum)",
      "Pattern 3 — Sliding Window (variable, fixed, exactly-K trick)",
      "Pattern 4 — Stack & Monotonic Stack (next greater, parentheses, histogram)",
      "Pattern 5 — Binary Search (answer space, rotated array, left/right bound, peak)",
      "Pattern 6 — Linked List (reverse, cycle, merge, Nth from end, Floyd's)",
      "Pattern 7 — Trees (postorder DFS, BFS, BST, LCA, path tracking)",
      "Pattern 8 — Heap / Priority Queue (top K, K-way merge, two heaps median)",
      "Pattern 9 — Backtracking (subsets, permutations, combination sum, grid search)",
      "Pattern 10 — Tries (insert/search, autocomplete, Word Search II)",
      "Pattern 11 — Graphs Unweighted (BFS, grid DFS, topo sort, bipartite, cycle detection)",
      "Pattern 12 — Advanced Graphs (Dijkstra, 0-1 BFS, DSU/Kruskal, Bellman-Ford)",
      "Pattern 13 — DP: 1D (robber, ways, Kadane, LIS, stock state machine, palindrome)",
      "Pattern 14 — DP: 2D / Knapsack (grid, LCS, edit distance, 0/1 & unbounded)",
      "Pattern 15 — DP: Interval & Bitmask (burst balloons, TSP, subset assignment)",
      "Pattern 16 — Greedy (reachability, interval scheduling, heap greedy)",
      "Pattern 17 — Intervals (merge, insert, sweep line / difference array)",
      "Pattern 18 — Monotonic Deque (sliding window max/min, DP optimization)",
      "Pattern 19 — Segment Tree & BIT (range queries with point updates)",
      "Pattern 20 — Math & Bit Manipulation (GCD, mod, combinatorics, XOR, subset bits)",
      "Time & Space Complexity Cheat Sheet (all patterns)",
      "Pattern Combinations for Hard Problems",
    ],
    tags:  ["leetcode", "algorithms", "patterns", "dp", "graphs", "backtracking", "binary search", "heap", "sliding window", "trie", "union-find", "interview", "coding interview", "two pointers"],
    path:  "../docs/reference/leetcode-patterns.md"
  },

  {
    id:         "cheatsheet",
    title:      "Common Scenarios & Solutions",
    category:   "Reference",
    icon:       "🎯",
    difficulty: "beginner",
    summary:    "13 scenario cheat sheets with consistent structure: trigger words → core pattern → numbered steps → key numbers → trade-offs. Covers read-heavy, write-heavy, real-time, search/geo, consistency, top-K, fan-out, file storage, collaborative editing, rate limiting, notifications, auth/sessions, and unique ID generation.",
    subtopics:  [
      "Constraint Map — identify the dominant constraint fast",
      "§1 Read-Heavy Systems (Cache-Aside + CDN + Read Replicas)",
      "§2 Write-Heavy / High Ingestion (Queue → Batch → LSM DB)",
      "§3 Real-Time & Low Latency (WebSocket + Redis Pub/Sub)",
      "§4 Search & Discovery (Inverted Index / Geohash / Quadtree)",
      "§5 Global Consistency — Money & Inventory (SQL + Pessimistic Lock)",
      "§6 Count / Top-K at Scale (Count-Min Sketch, HLL, Flink windows)",
      "§7 Fan-out / Social Feed (Hybrid push/pull, celebrity threshold)",
      "§8 Large File / Blob Storage (Chunked upload, pre-signed URL, dedup)",
      "§9 Collaborative Editing (OT vs CRDT, WebSocket, append-only log)",
      "§10 Rate Limiting (Token Bucket in Redis, API Gateway enforcement)",
      "§11 Notification Pipeline (Async event-driven, APNs/FCM/Twilio)",
      "§12 Authentication & Sessions (JWT vs session tokens, OAuth 2.0)",
      "§13 Unique ID Generation (Snowflake, Base62, UUID vs ULID)",
      "Quick Reference Table — all 17 scenarios in one view",
    ],
    tags:  ["cheat sheet", "patterns", "quick reference", "read-heavy", "write-heavy", "real-time", "rate limiting", "notifications", "auth", "jwt", "snowflake", "fan-out", "top-k", "interview"],
    path:  "../docs/reference/scenario-cheat-sheet.md"
  },

  {
    id:         "templates",
    title:      "Reusable Design Templates",
    category:   "Reference",
    icon:       "📋",
    difficulty: "beginner",
    summary:    "12 interview-ready blueprints covering every major system design archetype. Each template includes: requirements checklist, scale estimates, architecture components, step-by-step design, deep-dive on the hard parts, trade-offs table, and interview talking points.",
    subtopics:  [
      "Template 1 — Read-Heavy Content (YouTube, Netflix, Dropbox)",
      "Template 2 — Social Feed / Fan-out (Twitter, Instagram)",
      "Template 3 — Real-time Chat (WhatsApp, Slack, Discord)",
      "Template 4 — Location-Based Service (Uber, Yelp, Maps)",
      "Template 5 — URL Shortener / ID Generation (TinyURL)",
      "Template 6 — Rate Limiter (API quotas, throttling)",
      "Template 7 — Realtime Monitoring & Metrics (Datadog, Prometheus)",
      "Template 8 — Booking & Ticketing (TicketMaster, Airbnb)",
      "Template 9 — AI Agent System (Devin, Cursor, Copilot)",
      "Template 10 — Typeahead / Search Autocomplete",
      "Template 11 — Collaborative Editing (Google Docs, Figma)",
      "Template 12 — Code Execution & Sandboxing (LeetCode, CI)",
    ],
    tags:  ["template", "blueprint", "youtube", "twitter", "whatsapp", "uber", "url shortener", "rate limiter", "ticketmaster", "interview", "trade-offs", "scale"],
    path:  "../docs/reference/reusable-design-templates.md"
  }

];
