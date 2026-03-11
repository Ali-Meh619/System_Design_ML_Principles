/* ═══════════════════════════════════════════════════════════════
   System Design & ML Playbook — Topics
   48 sections across 11 categories
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
    path:  "../docs/foundation/interview-framework.md"
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
    path:  "../docs/foundation/estimation-and-numbers.md"
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
    path:  "../docs/foundation/io-fundamentals.md"
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
    path:  "../docs/foundation/networking-concurrency.md"
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
    path:  "../docs/data/storage-and-cdn.md"
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
    path:  "../docs/api-networking/api-design.md"
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
    path:  "../docs/api-networking/load-balancing.md"
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
    path:  "../docs/api-networking/realtime-communication.md"
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
    path:  "../docs/api-networking/rate-limiting.md"
  },

  /* ── CLOUD & PLATFORM ─────────────────────────────────────────── */

  {
    id:         "cloudfundamentals",
    title:      "Cloud Fundamentals & Shared Responsibility",
    category:   "Cloud & Platform",
    icon:       "☁️",
    difficulty: "beginner",
    summary:    "Regions, availability zones, managed services, shared responsibility, and the default cloud boundaries that make designs sound real.",
    subtopics:  [
      "Regions, Availability Zones, and Failure Domains",
      "Shared Responsibility Model",
      "Managed Services vs Self-Managed Systems",
      "Environment and Account Boundaries",
    ],
    tags:  ["cloud", "aws", "gcp", "azure", "multi-az", "shared responsibility", "managed services", "region", "availability zone"],
    path:  "../docs/cloud-platform/cloud-fundamentals.md"
  },

  {
    id:         "computedeployment",
    title:      "Compute & Deployment Patterns",
    category:   "Cloud & Platform",
    icon:       "🖥️",
    difficulty: "mid",
    summary:    "VMs vs containers vs Kubernetes vs serverless, stateless services, autoscaling signals, and rollout patterns like rolling, canary, and blue-green.",
    subtopics:  [
      "Choosing Between VMs, Containers, Kubernetes, and Serverless",
      "Stateless Service Design",
      "Autoscaling Signals",
      "Rolling, Canary, Blue-Green, and Shadow Deployments",
    ],
    tags:  ["containers", "kubernetes", "k8s", "serverless", "vm", "autoscaling", "canary", "blue-green", "deployment"],
    path:  "../docs/cloud-platform/compute-deployment-patterns.md"
  },

  {
    id:         "cloudnetworking",
    title:      "Cloud Networking & Traffic Management",
    category:   "Cloud & Platform",
    icon:       "🌍",
    difficulty: "mid",
    summary:    "VPCs, subnets, DNS, CDN/WAF, API gateways, internal service communication, and traffic shaping patterns that keep boundaries clean.",
    subtopics:  [
      "VPCs, Public Subnets, and Private Subnets",
      "North-South vs East-West Traffic",
      "DNS, CDN, WAF, Load Balancer, and API Gateway",
      "Service Discovery and Internal Routing",
    ],
    tags:  ["vpc", "subnet", "dns", "cdn", "waf", "nat", "api gateway", "service discovery", "networking"],
    path:  "../docs/cloud-platform/cloud-networking-traffic-management.md"
  },

  {
    id:         "iamgovernance",
    title:      "IAM, Secrets & Governance",
    category:   "Cloud & Platform",
    icon:       "🪪",
    difficulty: "mid",
    summary:    "Least privilege, human vs workload identity, secret storage, KMS-backed encryption, and governance controls that reduce blast radius.",
    subtopics:  [
      "Principals, Roles, and Policies",
      "Human Identity vs Workload Identity",
      "Secrets and Key Management",
      "Guardrails, Audit, and Governance",
    ],
    tags:  ["iam", "least privilege", "rbac", "roles", "secrets", "kms", "audit", "governance", "workload identity"],
    path:  "../docs/cloud-platform/iam-secrets-governance.md"
  },

  {
    id:         "cloudreliability",
    title:      "Reliability, Observability & Cost",
    category:   "Cloud & Platform",
    icon:       "📉",
    difficulty: "advanced",
    summary:    "Multi-AZ vs multi-region, RTO/RPO, SLO-driven operations, restore testing, budget alarms, and cost-aware platform decisions.",
    subtopics:  [
      "Failure Scope and High Availability",
      "RTO, RPO, and Disaster Recovery",
      "Metrics, Logs, Traces, and SLOs",
      "Right-Sizing, Egress, and Budget Guardrails",
    ],
    tags:  ["multi-region", "multi-az", "rto", "rpo", "slo", "observability", "budget", "egress", "cost optimization"],
    path:  "../docs/cloud-platform/reliability-observability-cost.md"
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
    path:  "../docs/distributed/distributed-locking.md"
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

  {
    id:         "probabilistic",
    title:      "Probabilistic Data Structures",
    category:   "Search & Analytics",
    icon:       "🎲",
    difficulty: "advanced",
    summary:    "Bloom filters, HyperLogLog, and Count-Min Sketch — when approximation beats exactness at massive scale.",
    subtopics:  [
      "Bloom Filter — \"Have I seen this before?\"",
      "HyperLogLog — Counting Unique Items",
      "Count-Min Sketch — Frequency Counting",
    ],
    tags:  ["bloom filter", "hyperloglog", "count-min sketch", "approximate", "probabilistic", "cardinality", "false positive"],
    path:  "../docs/search/probabilistic-data-structures.md"
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
    summary:    "Session-based vs JWT auth, OAuth 2.0 authorization code flow, gateway enforcement, and the core API security checklist.",
    subtopics:  [
      "Authentication: Sessions vs JWT",
      "OAuth 2.0 — Authorization Code Flow",
      "API Security Checklist (TLS, RBAC, rate limiting, secrets)",
      "Recommended Default + Failure Modes",
    ],
    tags:  ["jwt", "oauth", "oidc", "rbac", "abac", "session", "tls", "api key", "mfa", "refresh token"],
    path:  "../docs/security/security-and-authentication.md"
  },

  {
    id:         "authz-sso-mfa",
    title:      "Authorization, SSO & MFA",
    category:   "Security",
    icon:       "🪪",
    difficulty: "mid",
    summary:    "RBAC vs ABAC vs ReBAC, enterprise SSO with OIDC/SAML, MFA choices, and step-up authentication for high-risk actions.",
    subtopics:  [
      "Authorization Models — RBAC, ABAC, ReBAC",
      "SSO Architecture — OIDC vs SAML",
      "MFA Choices — TOTP, passkeys, push, SMS",
      "Recommended Default + Failure Modes",
    ],
    tags:  ["authz", "rbac", "abac", "rebac", "sso", "oidc", "saml", "mfa", "passkeys", "okta", "entra", "step-up auth"],
    path:  "../docs/security/authorization-sso-mfa.md"
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

  {
    id:         "secrets-threat-modeling",
    title:      "Secrets Management & Threat Modeling",
    category:   "Security",
    icon:       "🔑",
    difficulty: "advanced",
    summary:    "Secret storage and rotation, API key architecture, KMS/HSM usage, envelope encryption, and STRIDE-based threat modeling.",
    subtopics:  [
      "Secret Storage — Vault, Secrets Manager, workload identity",
      "API Keys — generation, scoping, rotation, revocation",
      "Envelope Encryption — DEK + KMS",
      "Threat Modeling — assets, trust boundaries, STRIDE",
    ],
    tags:  ["secrets", "kms", "hsm", "vault", "api keys", "rotation", "threat modeling", "stride", "envelope encryption", "blast radius"],
    path:  "../docs/security/secrets-management-threat-modeling.md"
  },

  /* ── AI & MACHINE LEARNING ──────────────────────────────────── */

  {
    id:         "advanced",
    title:      "Advanced Data Patterns",
    category:   "Scale & Reliability",
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
    category:   "AI & Machine Learning",
    icon:       "🤖",
    difficulty: "advanced",
    summary:    "Production ML system design: feature stores, recommendation and ranking pipelines, rollout strategy, drift monitoring, rollback, and latency-cost-quality trade-offs.",
    subtopics:  [
      "The ML System Architecture (5 layers)",
      "Feature Store — The Most Important ML Infrastructure",
      "Recommendation System Architecture",
      "Ranking Metrics — NDCG, MRR, CTR",
      "Multi-Stage Ranking Architecture",
      "Explore vs Exploit; Diversity vs Relevance",
      "Offline vs Online Evaluation",
      "Deployment & Rollout Strategy",
      "Monitoring, Drift & Retraining",
    ],
    tags:  ["machine learning", "feature store", "model serving", "training", "mlops", "drift", "recommendation", "ranking", "ndcg", "mrr", "retrieval", "reranking", "embeddings"],
    path:  "../docs/machine-learning/ml-in-system-design.md"
  },

  {
    id:         "agents",
    title:      "AI Agent System Design",
    category:   "AI & Machine Learning",
    icon:       "🧠",
    difficulty: "advanced",
    summary:    "Agent anatomy, planner-vs-reactor trade-offs, retrieval, tool reliability, memory compaction, LangGraph, AutoGen, MCP, and evaluation.",
    subtopics:  [
      "Core Agent Anatomy (Planner, Tool Executor, Memory)",
      "Cognitive Architectures (ReAct, CoT, Reflection)",
      "Multi-Agent Patterns (Orchestrator-Worker, Planner-Critic)",
      "Agent Frameworks & Tooling (LangGraph, AutoGen, MCP)",
      "Tool Reliability, Retries & Idempotency",
      "Memory Pruning & Cost Control",
      "Evaluation (LLM-as-a-Judge)",
    ],
    tags:  ["llm", "agent", "rag", "tool use", "memory", "guardrails", "langchain", "langgraph", "mcp", "autogen", "orchestrator", "multi-agent", "react", "chain-of-thought"],
    path:  "../docs/machine-learning/ai-agent-system-design.md"
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
    path:  "../docs/specialized/collaboration-editing.md"
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
    path:  "../docs/specialized/webhooks.md"
  },

  /* ── AI & MACHINE LEARNING ──────────────────────────────────── */

  {
    id:         "classic-ml",
    title:      "Classic Machine Learning",
    category:   "AI & Machine Learning",
    icon:       "📈",
    difficulty: "intermediate",
    summary:    "Interview-focused ML foundations: bias-variance tradeoff, bagging vs boosting, data leakage (types + prevention checklist), L1/L2 regularization, evaluation metrics, Random Forests vs XGBoost/LightGBM, SVM kernel trick, K-means, PCA, cross-validation, class imbalance, missing value mechanisms (MCAR/MAR/MNAR), high-dimensional features (filter/wrapper/embedded methods), and hyperparameter tuning.",
    subtopics:  [
      "Bias-Variance Tradeoff — diagnosing underfitting vs overfitting",
      "L1/L2/Elastic Net Regularization — why L1 creates sparsity",
      "Evaluation Metrics — Precision, Recall, F1, ROC-AUC vs PR-AUC, Log Loss",
      "Decision Trees — Gini vs Entropy, max_depth, pruning",
      "Bagging vs Boosting — variance vs bias reduction, parallel vs sequential",
      "AdaBoost — weighted sampling, weighted vote",
      "Random Forests — Bootstrap sampling, OOB error, feature importance",
      "Gradient Boosting — residual fitting, shrinkage, XGBoost vs LightGBM",
      "SVM — Max-margin hyperplane, kernel trick (RBF, Polynomial), C vs γ",
      "Logistic Regression — Log-odds, binary CE, multiclass (Softmax)",
      "K-Means — Elbow method, Silhouette score, K-means++ init, limitations",
      "PCA — Eigenvectors, explained variance, when to use vs not",
      "Cross-Validation — Stratified k-fold, time-series split",
      "Data Leakage — Target leakage, train-test contamination, temporal & group leakage",
      "Class Imbalance — class_weight, SMOTE, Focal Loss (modulating factor), threshold tuning, PR-AUC",
      "Missing Values — MCAR/MAR/MNAR mechanisms, KNN imputation, MICE, indicator columns",
      "High-Dimensional Features — Filter/Wrapper/Embedded methods, curse of dimensionality",
      "Categorical Encoding — One-hot, Target Encoding, Hashing",
      "Feature Scaling — StandardScaler, RobustScaler, when trees don't need scaling",
      "Hyperparameter Tuning — Grid vs Random vs Bayesian (Optuna)",
      "SHAP & Feature Importance — permutation vs impurity vs SHAP values",
    ],
    tags:  ["ml", "machine learning", "regression", "classification", "random forest", "xgboost", "svm", "pca", "metrics", "bias variance", "regularization", "smote", "feature engineering", "interview"],
    path:  "../docs/machine-learning/classic-ml.md"
  },

  {
    id:         "deep-learning",
    title:      "Deep Learning",
    category:   "AI & Machine Learning",
    icon:       "🧠",
    difficulty: "intermediate",
    summary:    "Neural networks from first principles: activation functions, weight initialization (Xavier vs He), backpropagation & vanishing gradients, Adam/AdamW, BatchNorm vs LayerNorm, Dropout, CNNs (ResNet), LSTMs, and a full deep-dive on the Transformer (self-attention math, causal masking, RoPE positional encoding, Pre-Norm vs Post-Norm, FFN/SwiGLU, encoder vs decoder, FlashAttention, ViT).",
    subtopics:  [
      "Activation Functions — ReLU, GELU, Sigmoid, Tanh, Softmax; dying ReLU problem",
      "Weight Initialization — Xavier (tanh), He/Kaiming (ReLU), why zero-init breaks symmetry",
      "Backpropagation — Chain rule, vanishing/exploding gradients, gradient clipping",
      "SGD vs Adam vs AdamW — Momentum, adaptive LR, decoupled weight decay",
      "Learning Rate Scheduling — Warmup, cosine annealing, one-cycle",
      "Dropout — Training vs inference; p=0.5 for hidden layers",
      "Batch Normalization — Internal covariate shift, learnable γ/β, train vs inference",
      "Layer Normalization — Normalizes over features; for Transformers/RNNs",
      "Convolutions — Stride, padding, weight sharing, receptive field, dilated conv",
      "CNN Architectures — ResNet (skip connections), InceptionNet, EfficientNet",
      "LSTM Gates — Forget, input, output gates; cell state as gradient highway",
      "Transformer Full Architecture — Embedding, MHA, FFN, residuals, LayerNorm",
      "Scaled Dot-Product Attention — QKᵀ/√d step-by-step, why scale",
      "Multi-Head Attention — h parallel heads, concat + Wₒ projection",
      "Causal Masking — Upper-triangle -∞ mask for autoregressive decoding",
      "Positional Encoding — Sinusoidal vs RoPE (rotary) vs ALiBi",
      "Pre-Norm vs Post-Norm — Why modern LLMs switched to Pre-Norm + RMSNorm",
      "FFN & SwiGLU — 4× bottleneck, gated activation in LLaMA/Mistral",
      "Encoder vs Decoder vs Encoder-Decoder — BERT vs GPT vs T5",
      "Attention Complexity — O(n²) bottleneck, FlashAttention, sliding window",
      "Vision Transformer (ViT) — Patch tokenization, learned vs sinusoidal pos",
      "Transfer Learning — Feature extraction vs partial vs full fine-tuning",
      "Mixed Precision Training — FP16/BF16, gradient scaling, memory savings",
      "Debugging Training — Overfit single batch, loss curves, gradient norms",
    ],
    tags:  ["deep learning", "neural networks", "cnn", "rnn", "lstm", "backpropagation", "adam", "batchnorm", "resnet", "attention", "transfer learning", "mixed precision", "interview"],
    path:  "../docs/machine-learning/deep-learning.md"
  },

  {
    id:         "llm-interviews",
    title:      "LLM Interview Questions",
    category:   "AI & Machine Learning",
    icon:       "💬",
    difficulty: "advanced",
      summary:    "Modern GenAI for engineering interviews: Transformer architecture, pre-training (CLM vs MLM), instruction fine-tuning, catastrophic forgetting, LoRA & QLoRA, RAG, prompt engineering, RLHF vs DPO, LLM evaluation (perplexity, exact match), KV cache, mixed precision, quantization, and long-context.",
      subtopics:  [
        "Transformer Block — Embedding, MHA, FFN, LayerNorm, residuals (sketch from memory)",
        "Scaled Dot-Product Attention — QKᵀ/√dₖ softmax V; why scale?",
        "Multi-Head Attention — Parallel heads, concat, Wₒ projection",
        "Positional Encoding — Sinusoidal vs Learned vs RoPE vs ALiBi",
        "Causal LM (GPT) vs Masked LM (BERT) — Autoregressive vs bidirectional",
        "Instruction Fine-Tuning — SFT on (instruction, response) pairs",
        "Catastrophic Forgetting — Replay buffers, EWC, small LR",
        "LoRA — Low-rank ΔW = B·A; rank r; which layers to adapt",
        "QLoRA — 4-bit quantized base + BF16 LoRA; enables fine-tune on single GPU",
        "RAG Architecture — Chunking, embedding, vector DB, retriever, re-ranker, generator",
        "RAG Failure Modes — Bad retrieval, lost-in-the-middle, stale data, hallucination",
        "Advanced RAG — HyDE, hybrid search (BM25 + dense), RRF, parent-child chunks",
        "Prompt Engineering — Zero-shot, few-shot, ReAct, self-consistency",
        "Chain-of-Thought — Why it works (compute, error localisation, conditioning); when it fails",
        "RLHF — SFT → reward model → PPO; why it's complex and unstable",
        "DPO — Direct preference optimization; no RL, no reward model; simpler",
        "LLM Evaluation — Perplexity (and why it fails for reasoning models), Exact Match",
        "Mixed Precision Training & Inference — FP16 vs BF16 vs FP32",
        "KV Cache — Cache K/V of past tokens; PagedAttention (vLLM)",
        "Quantization — FP16 → INT8 → INT4 (GPTQ/AWQ); post-training quantization",
        "Speculative Decoding — Draft model generates; large model verifies in parallel",
        "Decoding Strategies — Greedy, Beam Search, Temperature, Top-k, Top-p (Nucleus), Repetition Penalty",
      "Dynamic Batching — Continuous batching, Prefill vs Decode phases, Chunked Prefill, PagedAttention",
      "Hallucination Mitigation — RAG, temperature=0, self-consistency, citations",
      "Lost in the Middle — Primacy/recency bias, accuracy by position, mitigations",
      "Attention Dilution — Softmax normalisation over longer sequences, design implications",
    ],
    tags:  ["llm", "genai", "transformers", "rag", "lora", "qlora", "fine-tuning", "catastrophic forgetting", "prompt engineering", "rlhf", "dpo", "kv cache", "mixed precision", "quantization", "perplexity", "hallucination", "attention", "interview"],
    path:  "../docs/machine-learning/llm-interviews.md"
  },

  /* ── REFERENCE ───────────────────────────────────────────────── */

  {
    id:         "low-level-design",
    title:      "Low-Level System Design (LLD)",
    category:   "Reference",
    icon:       "🏗️",
    difficulty: "intermediate",
    summary:    "Object-oriented design for interviews: SOLID principles, 10 design patterns with code, 11 classic LLD questions fully implemented (LRU Cache, Parking Lot, Elevator, Rate Limiter, KV Store, Tic-Tac-Toe, Logger, Library), concurrency patterns, and a design-pattern selector table.",
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
      "Tic-Tac-Toe — O(1) state array pattern",
      "Transactional KV Store — begin, commit, rollback",
      "Logging Framework — Chain of Responsibility",
      "Library Management — entity modeling & relationships",
      "Concurrency patterns — Lock, RLock, Condition, Queue",
      "Design Pattern Selector table",
      "LLD Interview Cheat Sheet (16 questions mapped to patterns)",
    ],
    tags:  ["lld", "oop", "design patterns", "solid", "singleton", "factory", "observer", "strategy", "state", "lru cache", "parking lot", "elevator", "tic-tac-toe", "concurrency", "object oriented", "interview"],
    path:  "../docs/reference/low-level-design.md"
  },

  {
    id:         "leetcode-patterns",
    title:      "LeetCode Question Patterns",
    category:   "Reference",
    icon:       "🧩",
    difficulty: "intermediate",
    summary:    "21 patterns with code templates covering every major LeetCode archetype: arrays & hashing, two pointers, sliding window, stack, binary search, linked list, trees, graphs, DP, greedy, intervals, segment tree / BIT, and more — plus a full complexity cheat sheet.",
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
    summary:    "17 scenario cheat sheets with a decision-first structure: constraint map, modifier map, numbered steps, key numbers, and trade-offs. Covers classic system design plus multi-tenant SaaS, webhooks, ranking/personalization, and multi-region reliability.",
    subtopics:  [
      "Constraint Map + Modifier Map — identify the dominant constraint fast",
      "Classic patterns: read-heavy, write-heavy, real-time, search/geo",
      "Correctness patterns: strong consistency, Top-K, social feed, file storage",
      "Operational patterns: collaboration, rate limiting, notifications, auth, unique IDs",
      "Modern patterns: multi-tenant SaaS, webhooks/integrations, recommendation/ranking",
      "Cloud/platform overlay: multi-region reliability, DR, data residency",
      "Quick Reference Table + common modifiers for combined interview scenarios",
    ],
    tags:  ["cheat sheet", "patterns", "quick reference", "read-heavy", "write-heavy", "real-time", "rate limiting", "notifications", "auth", "jwt", "snowflake", "fan-out", "top-k", "multi-tenant", "webhooks", "ranking", "multi-region", "cloud", "interview"],
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
