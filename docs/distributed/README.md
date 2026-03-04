# 🌐 Distributed Systems

> The hardest category — and the most frequently tested. CAP theorem, consensus, distributed transactions, resilience patterns, and microservices architecture. Mastering this separates senior from staff engineers.

---

## Why Distributed Systems Is the Core Interview Category

Every large-scale system is a distributed system. Every design decision in a distributed system comes with trade-offs that don't exist on a single machine. Interviewers test this category hardest because it reveals whether you actually understand:

- Why you can't have consistency AND availability during a network partition
- Why a simple retry loop can corrupt data
- Why a service that's "up" can still cause a cascade failure

---

## Topics in This Category

| # | Topic | Difficulty | What You'll Learn |
|---|-------|-----------|------------------|
| 1 | [Distributed System Fundamentals](distributed-fundamentals.md) | 🟡 Mid | CAP theorem, consistency models, consistent hashing, Saga vs 2PC |
| 2 | [Core Design Patterns](core-design-patterns.md) | 🟡 Mid | Fan-out, CQRS, event sourcing, outbox pattern |
| 3 | [Microservices vs Monolith](microservices-vs-monolith.md) | 🟡 Mid | When to split, service discovery, sync vs async communication |
| 4 | [Resilience Patterns](resilience-patterns.md) | 🟡 Mid | Timeouts, retries, circuit breaker, backpressure |
| 5 | [Distributed Locking](../advanced/distributed-locking.md) | 🔴 Advanced | Redis Redlock, fencing tokens |

---

## CAP Theorem — The Foundation

```
         Consistency
              /\
             /  \
            /    \
           /  CA  \
          / ──────  \
         /  CP | AP  \
        /──────────────\
Availability ────── Partition
                    Tolerance
```

**In a distributed system, you ALWAYS have partition tolerance (P). So the real choice is:**

| Choice | What you get | Real-world examples |
|--------|-------------|-------------------|
| **CP** (Consistency + Partition) | Always correct, may be unavailable | Bank transactions, inventory management |
| **AP** (Availability + Partition) | Always responds, may show stale data | Twitter likes, YouTube view counts |

> ⚠️ **Interview trap:** Saying "I'll choose CA" is wrong. In a network partition, you must choose CP or AP. There is no CA distributed system.

---

## Consistency Models

| Model | Guarantee | Example |
|-------|----------|---------|
| **Strong (Linearizable)** | Reads always see latest write | Google Spanner, Zookeeper |
| **Eventual** | Reads eventually see latest write | Cassandra default, DynamoDB |
| **Causal** | See writes in causal order | MongoDB sessions |
| **Read-your-writes** | You see your own writes | Facebook profiles |
| **Monotonic reads** | Never see older data than before | Most caches |

---

## Consistent Hashing Intuition

```
Traditional hashing (mod N):
  Adding a server → rehash EVERYTHING → cache miss storm

Consistent hashing:
  Servers placed on a ring
  Each key goes to next server clockwise
  Adding a server → only rehash K/N keys
  (K = total keys, N = number of servers)
```

**Use consistent hashing when:** building distributed caches, sharded databases, or any system where adding/removing nodes is expected.

---

## Distributed Transaction Patterns

| Pattern | How it works | When to use |
|---------|-------------|-------------|
| **2PC (Two-Phase Commit)** | Coordinator asks all nodes to prepare, then commit | Strong consistency, low scale (SQL) |
| **Saga** | Each service does its work and publishes events; compensating transactions on failure | Microservices, eventual consistency OK |
| **Outbox Pattern** | Write to local DB + outbox table atomically; worker publishes outbox events to Kafka | Reliable event publishing without 2PC |

**Saga vs 2PC decision:**

```
Do you need strict ACID across services?
├─ YES → Use 2PC (but accept availability cost and complexity)
└─ NO  → Use Saga (eventual consistency, compensating transactions)
         Most distributed systems choose Saga.
```

---

## Resilience Pattern Summary

Every distributed call should have ALL of these:

```
Client calls Service B:
  1. Timeout set (e.g., 500ms)
  2. Retry with exponential backoff + jitter (max 3 attempts)
  3. Circuit breaker (opens after 5 failures in 30s)
  4. Fallback (return cached data or graceful error)
```

| Pattern | Prevents | Default values |
|---------|---------|---------------|
| **Timeout** | Hanging requests | 100ms–2s depending on SLA |
| **Retry + backoff** | Transient failures | 3 retries, 2× backoff, ±jitter |
| **Circuit breaker** | Cascade failures | Open after 5 failures in 30s |
| **Bulkhead** | One slow service killing all | Separate thread pools per service |
| **Load shedding** | Overload collapse | Drop non-critical requests at 80% capacity |

---

## Microservices vs Monolith Decision

```
Should I use microservices?
│
├─ Team size < 10 engineers → Monolith first
│
├─ Clear domain boundaries exist → Consider microservices
│
├─ Different scaling needs per component → Microservices
│
├─ Compliance requires isolation → Microservices
│
└─ You're at MVP stage → Monolith. Always. Ship faster.
```

**Migration strategy:** Strangler Fig pattern — extract one service at a time from the monolith, route traffic progressively.

---

## Interview Answer Checklist

When designing any distributed system, cover:

- [ ] **Consistency level**: strong vs eventual — explain trade-off
- [ ] **Failure scenarios**: what happens if service X goes down?
- [ ] **Retry strategy**: idempotency + exponential backoff
- [ ] **Circuit breaker**: prevent cascade failure
- [ ] **Data replication**: how does data reach all nodes?
- [ ] **Partition tolerance**: which partition behavior do you choose?

---

## Practice Questions

1. Your payment service calls an inventory service and a shipping service. If the inventory reservation succeeds but the shipping call fails, how do you roll back? Walk through the Saga pattern.

2. You're designing a distributed cache with 10 nodes. A new node is added. With traditional `mod N` hashing, what percentage of cache keys need to be remapped? With consistent hashing?

3. Service A calls Service B. Service B is slow due to a database issue. Without a circuit breaker, what happens to Service A? Trace the cascade failure.

4. Cassandra by default offers eventual consistency. Your e-commerce app needs to read the exact current inventory count. What consistency level do you set and what is the trade-off?
