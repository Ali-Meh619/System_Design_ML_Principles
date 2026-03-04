# Real-time Communication

> Chat (WhatsApp), live scores, live comments, collaborative editing — all require data to flow from server to client instantly. Choose the right protocol for the use case.

---

## The 4 Protocols Compared

**Real-time Protocol Comparison**

| Protocol | How it works | Direction | Overhead | Best for |
|----------|-------------|-----------|---------|---------|
| **Short Polling** | Client asks server "anything new?" every N seconds. Simple HTTP GET. | Client → Server (pull) | High — constant requests even when nothing changed | Avoid for anything real-time. Only for infrequent background updates. |
| **Long Polling** | Client sends request. Server holds it open until new data arrives, then responds. Client immediately sends next request. | Client → Server (pull) | Medium — lower request count but connections held open | Chat apps needing broad compatibility. Used by early Facebook chat. |
| **Server-Sent Events (SSE)** | Client opens one persistent HTTP connection. Server streams events to client as they happen. Automatic reconnection. | Server → Client (push, one-way) | Low — single persistent connection | Live feeds, notifications, progress updates, live dashboards. Client doesn't need to send data back. |
| **WebSocket** | HTTP connection upgraded to persistent, full-duplex TCP connection. Both sides can send at any time. | Both directions simultaneously | Low — persistent connection with tiny overhead per message | Chat, multiplayer games, collaborative editing, live trading. Any bidirectional real-time communication. |

---

## Scaling WebSocket Servers

WebSocket connections are **stateful** — a specific user's connection lives on a specific server. This creates a scaling challenge: if User A is connected to Server 1 and User B to Server 2, how does Server 1 deliver a message from B to A? The answer: a **pub/sub broker** (usually Redis Pub/Sub) sits between WebSocket servers. When Server 2 receives B's message, it publishes it to the Redis "user_A" channel. Server 1, which has the connection to A, is subscribed to that channel and delivers the message.

```
Architecture for Chat at Scale:

User A ←→ WS Server 1 ←→ [Redis Pub/Sub] ←→ WS Server 2 ←→ User B

When B sends message to A:
1. WS Server 2 receives message from B
2. WS Server 2 publishes to Redis channel: "user:A:messages"
3. WS Server 1 (subscribed to "user:A:messages") receives the message
4. WS Server 1 delivers message through A's open WebSocket connection

→ Works across any number of WS servers, horizontally scalable
```

For large-scale chat (WhatsApp, Slack), use **consistent hashing at the load balancer** to route all connections for the same user/chat room to the same server. This reduces pub/sub traffic for the common case where sender and receiver are on the same server.

---

## WebSocket Connection Lifecycle

```
1. HTTP Upgrade Request:
   GET /chat HTTP/1.1
   Upgrade: websocket
   Connection: Upgrade
   Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==

2. Server Accepts:
   HTTP/1.1 101 Switching Protocols
   Upgrade: websocket
   Connection: Upgrade
   Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=

3. Now: persistent TCP connection, frames sent in both directions
   → Text frames (JSON messages)
   → Binary frames (encoded data)
   → Ping/Pong frames (heartbeat)
   → Close frames (graceful shutdown)
```

**Heartbeat mechanism:** Client sends a Ping frame every 30 seconds; server responds with Pong. If no Pong received within 10 seconds, connection is dead — reconnect. This detects network failures that TCP doesn't (e.g., mobile switching from WiFi to LTE).

---

## Chat System Architecture (WhatsApp/Slack)

**End-to-end message flow:**

1. **Connection:** Client opens WebSocket to Chat Server. Load balancer uses consistent hashing (user_id) to route to same server per user. Chat Server registers `user_id → server_address` in Redis.

2. **Send message:** 
   - Client → WebSocket → Chat Server
   - Chat Server persists message to Cassandra (partition key: `conversation_id`, clustering key: `timestamp DESC`)
   - Chat Server publishes to Redis Pub/Sub channel `"conversation:{id}"`

3. **Deliver message:**
   - All Chat Servers subscribed to `"conversation:{id}"` receive the event
   - Each server checks if it holds the recipient's WebSocket
   - Delivers via WebSocket if recipient is online

4. **Offline delivery:**
   - If recipient offline: store in Redis `"user:{id}:offline_messages"` list
   - On reconnect: flush all pending messages to the client

5. **Read receipts:**
   - `sent` → message in Cassandra
   - `delivered` → recipient's server received it
   - `read` → recipient opened the conversation
   - State changes published back via WebSocket

---

## Server-Sent Events (SSE) Deep Dive

SSE is simpler than WebSocket for one-directional server-to-client streaming:

```javascript
// Server (Node.js)
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send event
  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  
  // Subscribe to updates
  const unsubscribe = eventBus.subscribe('user:' + userId, sendEvent);
  
  // Cleanup on disconnect
  req.on('close', unsubscribe);
});

// Client (browser)
const eventSource = new EventSource('/events');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateUI(data);
};
// Auto-reconnects on disconnect
```

**SSE advantages over WebSocket for one-way push:**
- Works over standard HTTP/2 (multiplexed — no extra connection)
- Native browser reconnection with `Last-Event-ID` header
- Works through HTTP proxies and load balancers without special config
- Simpler server implementation

---

## Notification System Architecture

For push notifications (mobile apps):

```
Event occurs (new message)
    ↓
Backend detects: recipient is offline
    ↓
Look up device tokens for user (stored in DB at login)
    ↓
Call platform push service:
  - iOS: Apple Push Notification service (APNs)
  - Android: Firebase Cloud Messaging (FCM)
    ↓
Platform delivers to device (wakes radio efficiently)
    ↓
App displays notification
```

> 💡 **Key insight:** Your backend never communicates directly with the device for push notifications. You push to Apple/Google servers, which maintain a persistent connection to each device. This is far more battery-efficient than the device maintaining its own connection to your backend.

---

## Interview Talking Points

- "I'd use WebSocket for the chat feature — it's full-duplex, low overhead, and supports sub-50ms delivery. The load balancer uses consistent hashing on user_id to route all messages for a user to the same WebSocket server."
- "For real-time dashboards showing aggregate metrics (not user-specific), SSE is simpler than WebSocket — it's one-directional, works over HTTP/2, and auto-reconnects."
- "When a WebSocket server dies, users need to reconnect. The client detects this via missed heartbeat and reconnects to any available server. The new server loads the user's state from Redis/Cassandra."
- "WhatsApp's 1B+ users per server architecture: they use Erlang/BEAM VM, which can support 2M+ concurrent connections per server due to its lightweight process model (similar to goroutines)."
