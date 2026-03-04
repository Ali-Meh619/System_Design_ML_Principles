# Real-time Collaboration (Google Docs)

> The hardest distributed system problem: multiple users editing the same document simultaneously, each seeing each other's changes in real-time with zero conflicts.

---

## The Core Problem: Concurrent Edits

Alice types "Hello" and Bob simultaneously types "World" in the same document. Without coordination, depending on network order, some users see "HelloWorld" and others see "WorldHello" — the document is inconsistent. The system must resolve these concurrent edits deterministically so all users converge to the same document state.

---

## Operational Transformation (OT)

**Operational Transformation** is the algorithm that powers Google Docs and most production collaborative editors. Each edit is modeled as an **operation**: `Insert(position, text)` or `Delete(position, length)`. When two concurrent operations arrive, OT **transforms** them against each other to account for the fact that each operation was made against a different document state.

```
Example:
Document: "Hello"
Alice: Insert(5, " World")  → "Hello World"  (position 5 = after "Hello")
Bob:   Insert(0, "Say ")    → "Say Hello"    (position 0 = beginning)

If applied in order Alice→Bob:
  After Alice: "Hello World"
  Bob's op was made against "Hello". Now apply to "Hello World":
  Transform Bob's Insert(0, "Say ") given Alice's Insert(5, " World"):
    Bob's position (0) is before Alice's position (5) → no change needed
  Apply: Insert(0, "Say ") to "Hello World" = "Say Hello World" ✓

If applied in order Bob→Alice:
  After Bob: "Say Hello"
  Alice's op was made against "Hello". Transform against Bob's Insert(0, "Say "):
    Alice's position (5) is after Bob's Insert at position 0 (adds 4 chars)
    Transform: position = 5 + 4 = 9
  Apply: Insert(9, " World") to "Say Hello" = "Say Hello World" ✓

Both orderings converge to "Say Hello World" ✓
```

> 💡 **In the interview:** You don't need to implement OT. Know that it exists, what problem it solves, and that there's a server-side transform function. The key insight: operations are transformed before application, not text, so all clients converge.

---

## CRDT — The Simpler Alternative

**CRDTs (Conflict-free Replicated Data Types)** are data structures mathematically designed to automatically resolve conflicts. Instead of transforming operations, CRDTs use special data types where any merge is commutative, associative, and idempotent — meaning you can apply operations in any order and always get the same result. No central coordination needed.

The most common CRDT for text editing is the **Logoot / LSEQ** algorithm: instead of character positions (which change when other text is inserted), each character is assigned a unique, globally-ordered fractional identifier. Characters keep their identity regardless of concurrent insertions — no transformation needed.

**OT vs CRDT**

| Aspect | OT | CRDT |
|--------|-----|------|
| Coordination | Requires central server to order operations | Peer-to-peer. Works offline. No central server required. |
| Implementation | Complex transform functions. Hard to get right. | Complex data structure design. Simpler application code. |
| Memory | Compact — operations and document state | Can be large — tombstones for deleted characters |
| Used by | Google Docs, Etherpad, Firepad | Figma, Automerge, Yjs (Notion partially), Apple Notes |

---

## Google Docs System Architecture

**Real-time Collaborative Document Architecture:**

1. **WebSocket connection:** Client opens WebSocket to Document Server on load. Each document has one authoritative server handling its operations (consistent hashing by doc_id).

2. **Operation pipeline:** User types → local optimistic apply (immediately visible to user) → Send op to Document Server via WebSocket → Server transforms against concurrent ops → Apply + broadcast to all other clients

3. **Persistence:** Operations appended to Kafka log (immutable audit trail). Periodic snapshots to S3 (full document state every N operations). Redis holds current document state for fast initial load.

4. **Version vector:** Each client tracks a version vector (document version when their op was made). Server uses this to determine which concurrent ops to transform against.

5. **Presence:** Separate lightweight service tracks cursor positions. Published to Redis Pub/Sub. Other clients receive cursor updates as separate low-priority WebSocket messages.

6. **Offline support:** Operations queued locally. On reconnect, send queued ops with version vectors. Server transforms and applies.

---

## Optimistic Concurrency for Collaborative Editing

```
Client sends edit:
{
  "op_type": "insert",
  "position": 42,
  "content": "Hello",
  "document_version": 15,  // version when op was created
  "client_id": "user_alice"
}

Server processing:
1. Accept op (optimistic)
2. Check: ops received since version 15?
   → Yes: Bob inserted " World" at position 40 (op #16)
3. Transform Alice's op against Bob's:
   → Alice's position 42 becomes 42 + 6 = 48 (shifted by " World")
4. Apply transformed op to document
5. Broadcast transformed op to all clients (including Alice)
6. Alice receives: {op: insert at 48, ...} — corrects her local view
```

This is **optimistic concurrency**: clients apply changes immediately locally (fast UX), then receive the server's authoritative transformed version.

---

## Conflict-Free Data Types for Collaborative Apps

| CRDT Type | What it supports | Use Case |
|-----------|----------------|---------|
| **G-Counter** | Only increments | View count, upvote count |
| **PN-Counter** | Increment + decrement | Like count (allow unlike) |
| **G-Set** | Add-only set | Tags, labels |
| **2P-Set** | Add + remove (once) | Shopping cart items |
| **OR-Set** (Observed-Remove) | Add + remove (multiple times) | Collaborative whiteboard objects |
| **LWW-Map** (Last-Write-Wins) | Map with per-key LWW conflict resolution | User settings, configuration |
| **RGA / LSEQ** | Ordered text sequence | Text document editing (Google Docs-level) |

---

## Cursor and Presence Tracking

Showing other users' cursors in real-time is a separate (simpler) problem:

```
Architecture:
1. User moves cursor → send cursor_position via WebSocket
2. Server receives position: {user_id, doc_id, position, color}
3. Server publishes to Redis Pub/Sub: "presence:doc_abc"
4. All Document Servers subscribed to "presence:doc_abc" receive it
5. Each server broadcasts to connected users
6. Other clients render Alice's cursor at position X in red

Key: presence data is NOT persisted. Ephemeral only.
If Redis restarts, cursor positions are lost — users resend on reconnect.
Cursors expire after 30 seconds of inactivity (TTL in Redis).
```

---

## Interview Talking Points

- "OT requires a central server to serialize operations. All clients connect to the same Document Server (consistent hashing on doc_id). The server transforms concurrent ops and broadcasts."
- "CRDT for offline-first apps (Figma, Notion): no central server needed, edits merge automatically. Tradeoff: larger memory footprint (tombstones for deleted chars)."
- "Optimistic UI: show the user's edit immediately, then receive the server's transformed op to correct any conflicts. Latency feels like 0ms even though server round-trip is 50ms."
- "Persistence: append-only op log in Kafka (full audit trail), plus periodic snapshots to S3. On reload, apply snapshot + all ops since the snapshot. Cap snapshot every 100 ops."
