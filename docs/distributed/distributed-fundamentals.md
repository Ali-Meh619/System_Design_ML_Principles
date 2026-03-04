# Distributed System Fundamentals

> The theoretical foundations behind every design decision. CAP theorem, consistency models, consensus, and distributed transactions — these govern all trade-offs.

---

## CAP Theorem — The Fundamental Law

The **CAP theorem** states that a distributed system can guarantee at most 2 of 3 properties simultaneously: **Consistency** (every read sees the most recent write), **Availability** (every request gets a response, even if some nodes are down), and **Partition Tolerance** (the system continues working even when some network messages are lost or delayed). The key insight: in a real distributed system, **network partitions are inevitable** — the internet is unreliable. Therefore, every real distributed system must be Partition Tolerant, leaving you to choose between Consistency and Availability when a partition occurs.

**CP vs AP Systems**

| Choice | Behavior during partition | Examples | Use when |
|--------|--------------------------|---------|---------|
| **CP (Consistent + Partition Tolerant)** | Returns error or waits rather than returning stale data. Sacrifices availability for correctness. | HBase, Zookeeper, etcd, MongoDB (with majority writes) | Financial transactions, inventory management, leader election — anywhere data correctness is critical |
| **AP (Available + Partition Tolerant)** | Always responds but may return stale data. Reconciles after partition heals. | Cassandra, DynamoDB (default), CouchDB | Social feeds, product catalogs, DNS — where temporary staleness is acceptable |

---

## Consistency Models

Consistency is not binary — there's a spectrum from strong to weak, each with different performance implications.

**Consistency Level Spectrum**

| Level | Guarantee | Performance | Example |
|-------|-----------|-------------|---------|
| **Strong Consistency** | Every read returns the most recent write. Like a single-server system. | Slowest — requires synchronizing all replicas before responding | Bank account balance, stock inventory |
| **Linearizability** | Operations appear to happen instantaneously at a single point in time. Strongest form. | Very slow at scale | Distributed lock services (etcd, Zookeeper) |
| **Causal Consistency** | If A causes B, all nodes see A before B. Unrelated operations may be out of order. | Moderate | Comments system: reply always appears after the original post |
| **Eventual Consistency** | If no new updates are made, eventually all replicas converge to the same value. No timing guarantee. | Fastest — writes succeed immediately, propagate asynchronously | DNS, social media like counts, user profiles |

---

## Consistent Hashing — How Systems Distribute Data

**Consistent hashing** solves the problem of distributing data across servers in a way that minimizes reshuffling when servers are added or removed. Regular hash (key % N servers) means adding one server remaps ~50% of all keys — catastrophic for a cache. Consistent hashing maps keys to a ring of 2^32 positions. Servers are also placed on the ring at multiple positions (**virtual nodes**). A key maps to the nearest server clockwise. Adding a server only remaps 1/N of keys — the ones between the new server and its predecessor.

```
Consistent Hash Ring (simplified):

         0
        /|\
      /  |  \
  ServerC  ServerA
    |    ring   |
  ServerB------/

Key "user_123" hashes to position 180°
→ Maps to the nearest server clockwise = ServerB

Adding ServerD at position 150°:
→ Only keys between position 130° and 150° (previously going to ServerB)
  now go to ServerD. All other keys unchanged.
→ vs. regular hash: ALL keys remapped (catastrophic for cache)
```

Used by: Cassandra (data partitioning), DynamoDB, Memcached, CDN routing, load balancers for session affinity.

---

## Distributed Transactions: Saga vs 2PC

**Handling Multi-Service Transactions**

| Approach | How it works | Pros | Cons | Use for |
|----------|-------------|------|------|---------|
| **2PC (Two-Phase Commit)** | Phase 1: coordinator asks all participants "can you commit?" Phase 2: if all say yes, coordinator tells all to commit. | ACID-like guarantee. All-or-nothing. | Coordinator is SPOF. All participants block until coordinator responds. Slow. Doesn't work well across microservices. | Single database systems, same-datacenter transactions |
| **Saga Pattern** | Break transaction into a sequence of local steps. Each step has a compensating action. If step 3 fails, compensating actions undo steps 1 and 2. | No locking. Works across microservices. Resilient to failures. | Eventual consistency — brief window where partial state is visible. More complex to implement. | E-commerce checkout (reserve stock → charge payment → ship). Any multi-service business workflow. |

**Saga example (order checkout):**
```
Step 1: Reserve inventory    ←→ Compensate: Release inventory
Step 2: Charge payment       ←→ Compensate: Refund payment
Step 3: Schedule shipment    ←→ Compensate: Cancel shipment

If Step 3 fails:
→ Run Step 2 compensate (refund)
→ Run Step 1 compensate (release inventory)
→ Order is cleanly rolled back
```

---

## Idempotency — Critical for Reliability

Network calls fail. Clients retry. Without **idempotency**, retrying a "charge payment" request could charge the customer twice. Idempotency means an operation can be safely retried — doing it twice has the same effect as doing it once. Implement with **idempotency keys**: the client sends a unique request ID (e.g., UUID) with every mutation. The server stores that ID and the result. On retry, if the server sees a known ID, it returns the stored result without re-executing. This pattern is used by Stripe, PayPal, and every serious payment API.

```
POST /api/payments
Headers: Idempotency-Key: "a4e58f21-1b2c-4d5e-9f6a-..."
Body: { "amount": 100, "currency": "USD", "card": "..." }

On first call:
→ Server checks: key "a4e58f21..." not seen before
→ Process payment → charge $100
→ Store: { key: "a4e58f21...", result: "success", charge_id: "ch_123" }
→ Return: 200 { charge_id: "ch_123" }

On retry (network failed):
→ Server checks: key "a4e58f21..." already seen
→ Return stored result: 200 { charge_id: "ch_123" }
→ No duplicate charge!
```

---

## Quorum Consensus (N, R, W)

In leaderless replication (Dynamo-style), how do we ensure strong consistency? By configuring the quorum. Let **N** = number of replicas, **R** = read quorum (nodes needed for read), **W** = write quorum (nodes needed for write).

- **Strong Consistency Rule:** If **R + W > N**, then at least one node in the read set contains the latest write. This overlap guarantees consistency.
- **Balanced Config (N=3):** W=2, R=2 (2+2 > 3). Tolerates 1 node failure. Standard for Cassandra/DynamoDB.
- **Write Heavy (N=3):** W=1, R=3. Fast writes, slow reads. Risk of data loss if the written node dies before replication.
- **Read Heavy (N=3):** W=3, R=1. Slow writes (must update all), fast reads (just ask any node).

| Configuration | Write Speed | Read Speed | Consistency | Failure Tolerance |
|--------------|-------------|-----------|-------------|-------------------|
| W=1, R=3 (N=3) | Fast | Slow | Strong | Write node failure = data loss |
| W=2, R=2 (N=3) | Medium | Medium | Strong | 1 node failure tolerated |
| W=3, R=1 (N=3) | Slow | Fast | Strong | Read from any node |
| W=1, R=1 (N=3) | Fastest | Fastest | Eventual | High — no consistency guarantee |

---

## Vector Clocks — Detecting Conflicts

In multi-leader or leaderless systems, concurrent writes can happen on different nodes. Who wrote first? Physical timestamps are unreliable due to clock skew. **Vector clocks** use logical counters `[NodeA:1, NodeB:2]` to detect causality.

- If `Clock(A) < Clock(B)`, then A happened before B (no conflict, B overwrites A).
- If neither is strictly greater (e.g., `[1,0]` vs `[0,1]`), they are **concurrent conflicts**. The database keeps both versions ("siblings") and asks the client to resolve them (e.g., merge the shopping cart items).

---

## Leader Election

When a distributed system needs a single coordinator (one primary database, one job scheduler), it must elect a leader. The standard tools:

| Tool | Algorithm | Use Case |
|------|-----------|---------|
| **ZooKeeper** | ZAB (Zookeeper Atomic Broadcast) | Classic leader election. Used by Kafka, HBase for coordination. |
| **etcd** | Raft consensus | Kubernetes uses etcd for cluster state and leader election. |
| **Redis Redlock** | Redis SET NX with TTL | Distributed mutex. Simple but with limitations (see Distributed Locking section). |
| **Raft** (custom) | Raft protocol | CockroachDB, TiKV, Consul use Raft for internal consensus. |

---

## Interview Talking Points

- "This is an AP system — we prioritize availability. Cassandra with eventual consistency. Twitter like counts being slightly stale is acceptable."
- "For payment processing, we need CP — a failed payment that's retried must not charge twice. Idempotency keys on every payment request."
- "The Saga pattern handles our checkout flow: reserve inventory → charge payment → create shipment, each with a compensating transaction for rollback."
- "Consistent hashing for our cache cluster: adding a new Redis node only remaps 1/N of keys, not everything. Cache hit rate stays high during scaling."
