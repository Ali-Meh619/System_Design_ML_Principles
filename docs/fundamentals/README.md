# 📐 Foundation

> **Start here.** These 4 topics cover the universal framework, the numbers you must memorize, and the low-level intuition that makes every other system design topic click.

---

## Why Foundation Matters

Every system design interview failure traces back to a missing fundamental. Engineers who struggle with "Design YouTube" usually aren't missing knowledge about video encoding — they're missing the ability to **structure their thinking**, **estimate what size problem they're solving**, and **explain why latency matters**. That's what this category fixes.

---

## Topics in This Category

| # | Topic | Difficulty | What You'll Learn |
|---|-------|-----------|------------------|
| 1 | [The System Design Interview Framework](interview-framework.md) | 🟢 Beginner | 4-step universal structure for any question |
| 2 | [Numbers Every Engineer Must Know](estimation-and-numbers.md) | 🟢 Beginner | Latency hierarchy, back-of-envelope estimation |
| 3 | [IO Fundamentals: Read vs Write](io-fundamentals.md) | 🟡 Mid | RAM vs SSD vs disk, page cache, write amplification |
| 4 | [Networking & Concurrency](networking-concurrency.md) | 🟡 Mid | TCP/UDP, HTTP/1.1/2/3, concurrency models |

---

## Learning Sequence

```
Start Here
    │
    ▼
[Interview Framework] ──── Master this first.
    │                       Use it in EVERY answer.
    ▼
[Numbers to Know] ──────── Memorize the latency table.
    │                       Use it for estimation.
    ▼
[IO Fundamentals] ──────── Understand why RAM > SSD > HDD.
    │                       This explains caching decisions.
    ▼
[Networking & Concurrency] Understand TCP vs UDP,
                            HTTP/2 multiplexing, async I/O.
```

---

## Key Concepts Quick Reference

### The 4-Step Interview Framework

| Step | Time | Goal |
|------|------|------|
| **1. Clarify** | 5–8 min | Functional + non-functional requirements |
| **2. Estimate** | 5 min | QPS, storage, bandwidth |
| **3. Design** | 10 min | High-level architecture |
| **4. Deep Dive** | 15 min | Drill into the hardest parts |

### Latency Hierarchy (Memorize This!)

| Operation | Approximate Time |
|-----------|----------------|
| L1 cache reference | 1 ns |
| L2 cache reference | 10 ns |
| Main memory (RAM) | 100 ns |
| SSD random read | 100 µs |
| Network round-trip (same datacenter) | 500 µs |
| HDD seek | 10 ms |
| Network round-trip (cross-country) | 150 ms |
| Network round-trip (cross-continent) | 300 ms |

### Scale Reference Points

| Users | Architecture |
|-------|-------------|
| 1 | Single machine |
| 1,000 | Still single machine with DB |
| 10,000 | Add caching + read replica |
| 100,000 | Sharding or NoSQL |
| 1,000,000 | Full distributed system |
| 10,000,000+ | Specialized architecture per feature |

---

## Common Interview Mistakes (Foundation Failures)

| Mistake | Why it hurts | Fix |
|---------|-------------|-----|
| Jumping to solution without clarifying | Solving the wrong problem | Always spend 5–8 min on requirements |
| No estimation | Can't justify any architectural decision | Always estimate QPS + storage |
| Using "MB" and "GB" interchangeably | Wrong size decisions | Review powers of 2 table |
| Ignoring latency | Choosing the wrong database or cache strategy | Memorize the latency table |

---

## Practice Questions

After completing these 4 topics, test yourself:

1. A URL shortener gets 100M shortened URLs created per month. How many QPS is that? How much storage per year?
2. Your API server handles 10,000 RPS. Each request does 3 database reads of 1KB each. What's your minimum bandwidth?
3. A user loads a webpage. List 5 places where caching could help and what type of cache each is.
4. Without looking: what's the latency difference between RAM and SSD? Between same-datacenter and cross-continent?
