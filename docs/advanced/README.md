# 🧠 AI & Advanced Topics

> The cutting edge of system design. These topics appear at staff/principal engineer interviews, and increasingly at senior-level interviews as AI systems become mainstream.

---

## Topics in This Category

| # | Topic | Difficulty | What You'll Learn |
|---|-------|-----------|------------------|
| 1 | [Advanced Data Patterns](../scale/advanced-data-patterns.md) | 🔴 Advanced | CQRS, event sourcing, hot spots, backfill |
| 2 | [Machine Learning in System Design](ml-in-system-design.md) | 🔴 Advanced | ML system architecture, feature store, model serving |
| 3 | [AI Agent System Design](ai-agent-system-design.md) | 🔴 Advanced | Agent anatomy, cognitive architectures, multi-agent patterns |
| 4 | [Probabilistic Data Structures](probabilistic-data-structures.md) | 🔴 Advanced | Bloom filter, HyperLogLog, Count-Min Sketch |
| 5 | [Distributed Locking](distributed-locking.md) | 🔴 Advanced | Redis Redlock, fencing tokens |

---

## When These Topics Come Up

| Topic | Interview context |
|-------|-----------------|
| Probabilistic data structures | "Design a system that counts unique visitors without storing every user ID" |
| ML system design | "Design a recommendation system / feed ranking / fraud detection" |
| AI agents | "Design an autonomous coding assistant (like Cursor/Devin)" |
| Distributed locking | "Design a ticket booking system where two users can't book the same seat" |
| Advanced data patterns | "Design a real-time analytics dashboard with historical data" |

---

## Probabilistic Data Structures — The "Big Three"

| Structure | Problem it solves | False positive? | Space |
|-----------|-----------------|----------------|-------|
| **Bloom Filter** | "Have I seen this URL before?" (no false negatives) | Yes, ~1% | O(n) bits |
| **HyperLogLog** | "How many unique visitors today?" | ~1% error | ~12KB for 2^64 values |
| **Count-Min Sketch** | "How many times has this URL been clicked?" | Over-counts slightly | O(k × width) |

**When to use:**
- At 1M items: store exactly (< 50MB)
- At 100M items: consider approximation
- At 1B+ items: **must** use probabilistic structures

---

## ML System Architecture Layers

```
1. Data Pipeline
   └─ Collect raw events → Feature engineering → Feature Store

2. Training
   └─ Feature Store → Model Training → Model Registry

3. Serving
   └─ Model Registry → Online Serving API
                     → Batch Prediction Job

4. Monitoring
   └─ Track: prediction quality, feature drift, latency, errors

5. Feedback Loop
   └─ User actions → Labels → Retrain triggers
```

**Feature Store is the most important ML infrastructure:**
- Provides the same features to both training and serving
- Prevents **training-serving skew** (different data → different predictions)

---

## AI Agent Design — Core Components

```
┌─────────────────────────────────────────────────┐
│                   AI Agent                       │
│                                                  │
│  [Planner/LLM] ←──→ [Memory]                    │
│       │                  ├─ Short-term (context) │
│       ▼                  └─ Long-term (vector DB)│
│  [Tool Executor]                                 │
│       ├─ Web search                              │
│       ├─ Code execution                          │
│       ├─ File system                             │
│       └─ API calls                               │
└─────────────────────────────────────────────────┘
```

**Key design patterns:**
- **ReAct**: Reason → Act → Observe → Repeat (most common)
- **Reflection**: Agent critiques its own output and improves
- **Multi-agent**: Orchestrator delegates to specialized sub-agents

---

## Advanced Data Patterns Quick Reference

| Pattern | When to use |
|---------|------------|
| **CQRS** | Read patterns diverge significantly from write patterns |
| **Event Sourcing** | Need full audit trail, time travel, or event replay |
| **Materialized View** | Expensive aggregations needed at query time |
| **Hot Partition fix** | Add randomness to partition key (write salting) |
| **Backfill** | Reprocess historical data with idempotent jobs + checkpointing |

---

## Practice Questions

1. Design a "trending content" feature for a social platform with 10M posts/day. Use only probabilistic data structures for frequency counting.

2. Design a recommendation system for Netflix. Cover: data collection, feature engineering, offline training, online serving, A/B testing, and feedback loop.

3. An AI coding assistant needs to maintain context across a 10,000-line codebase. Design its memory system — what stays in context, what goes to long-term memory, and how retrieval works.

4. Design a distributed lock service that guarantees mutual exclusion across 100 servers. What happens when the Redis primary fails during the lock hold period?
