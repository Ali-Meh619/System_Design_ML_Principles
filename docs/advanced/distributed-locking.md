# Distributed Locking

> Ensuring only one process performs a task at a time (e.g., processing a payment, running a cron job) in a cluster of servers.

---

## Why Local Locks Don't Work

Standard mutexes (`synchronized`, `threading.Lock`) only work within one process. In a distributed system with 50 servers, you need an external system to coordinate the lock.

**The problem without distributed locking:**
```
Server 1 checks: "Is this payment already processed?" → No
Server 2 checks: "Is this payment already processed?" → No (race condition!)

Server 1 processes payment → charges $100
Server 2 processes payment → charges $100 (duplicate!)

Total charged: $200 instead of $100
```

---

## Redis Redlock

**Redlock** is the standard algorithm for distributed locking with Redis. To acquire a lock:

1. Client generates a unique token (UUID).
2. Tries to write key `lock:resource_id` with value `token` and a TTL (e.g., 10s) using `SET NX PX`.
3. If successful, it holds the lock. It must finish work and release (delete key) within 10s.
4. If it takes longer, the lock auto-expires (safety). To prevent this, the client must use a "watchdog" thread to extend the TTL while working.
5. **Release:** Use a Lua script to check if the value matches the token before deleting. This prevents deleting a lock that has already expired and been acquired by someone else.

```
# Acquire lock
SET lock:payment:order_123 <unique_token> NX PX 10000
# NX = only set if Not eXists (atomic check-and-set)
# PX 10000 = expire in 10 seconds

# Release lock (Lua script — atomic)
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
```

**Why the Lua script for release?**
```
Without Lua script:
1. GET lock:payment:order_123 → returns "our_token" 
   [1 second pause here — GC, network, etc.]
2. Another process acquires the lock (TTL expired)
3. DEL lock:payment:order_123 → DELETES THEIR LOCK! Bug!

With Lua script:
- GET and conditional DEL are atomic — no race condition
```

---

## Multi-Node Redlock (5 Redis Nodes)

The single-node Redis lock has a problem: if Redis crashes between acquire and release, the lock is lost. For critical locks, use multi-node Redlock:

1. Get current time T1
2. Try to acquire lock on all 5 Redis nodes sequentially, each with a small timeout (50ms)
3. If lock acquired on 3+ nodes (majority) within valid time window: lock is acquired
4. Lock validity time = TTL - (T2 - T1) [elapsed time during acquisition]
5. Release: delete the key from all 5 nodes

**The quorum ensures that even if one Redis node fails, the majority still holds the lock.**

---

## Fencing Tokens — The Safety Net

What if a process pauses (GC pause) for 20 seconds? Its lock expires. Another worker acquires it. The first worker wakes up and writes to the DB. Now two workers are writing simultaneously (split brain). Distributed locks alone are unsafe for critical data.

Solution: **Fencing Tokens**. The lock service (Zookeeper) returns a monotonically increasing number (token) with each lock. The database rejects any write with a token older than the highest one it has seen.

```
Worker A gets Lock (Token = 33) → GC Pause...
Worker B gets Lock (Token = 34) → Writes to DB (DB records "last_token=34")
Worker A wakes up → Tries to write with Token 33
DB check: 33 < 34 → REJECT write.
```

This is called the **fencing token pattern** and is the only safe way to handle distributed critical sections when processes can pause unexpectedly.

---

## Zookeeper for Distributed Coordination

For stronger guarantees than Redis, use **Zookeeper** (or etcd):

```
Leader election with Zookeeper:
1. All servers try to create an ephemeral sequential znode: /election/node-NNNNNN
2. Each server lists children of /election/
3. Server with lowest sequence number = leader
4. Others watch the node just before them (not the leader)
5. If predecessor dies, the next-lowest takes over

Lock with Zookeeper:
1. Create ephemeral sequential znode: /locks/payment_123/lock-NNNNNN
2. If yours is lowest: you have the lock
3. Otherwise: watch the preceding znode (wait for it to be deleted)
4. When preceding lock released: your turn → you have the lock
5. When you're done: delete your znode → wakes up the next waiter
```

**Ephemeral nodes auto-delete when the session ends (server dies/disconnects)** — this prevents deadlocks from crashed lock holders.

---

## Distributed Locking Use Cases

| Use Case | Why distributed lock needed | Implementation |
|----------|---------------------------|----------------|
| **Payment processing** | Prevent double-charge on retry | Redis SET NX + idempotency key |
| **Cron job deduplication** | Only one server should run the 2am job | Redis SET NX at job start |
| **Inventory reservation** | Prevent overselling (10 users for last ticket) | Database-level `SELECT FOR UPDATE` (preferred for DB transactions) |
| **Leader election** | Only one service should be the primary | Zookeeper/etcd ephemeral nodes |
| **Cache stampede prevention** | Only one thread should rebuild expired cache | Redis SET NX as mutex |

---

## Redis vs Zookeeper vs Database for Locking

| System | Pros | Cons | Best for |
|--------|------|------|---------|
| **Redis (Redlock)** | Fast (~1ms). Simple. Battle-tested. | GC pauses can cause lock expiry. Async replication = data loss risk. | Short locks (<30s), high throughput, non-critical operations |
| **Zookeeper/etcd** | Linearizable — truly safe. Fencing tokens. Handles network partitions correctly. | Slower (~10ms). More complex to operate. | Critical locks (leader election, critical sections), long operations |
| **Database (SELECT FOR UPDATE)** | No extra infrastructure. ACID guarantees. | Slower. DB becomes bottleneck. | Locks within a single DB transaction, inventory management |

---

## Interview Talking Points

- "For the cron job scheduler: Redis SET NX with 10-minute TTL. Only one server acquires the lock and runs the job. If the server crashes, the TTL expires and another server picks it up."
- "For payment processing: I'd use idempotency keys instead of distributed locks. Locks are risky (GC pauses, network partitions). Idempotency is safer: check the key before processing, store result atomically."
- "The fencing token pattern is critical when processes can pause unexpectedly. Zookeeper provides monotonically increasing tokens. The DB only accepts writes with tokens ≥ the highest seen."
- "Redis Redlock requires a majority of N nodes (e.g., 3 of 5) to acknowledge the lock. One Redis node failure doesn't prevent lock acquisition."
