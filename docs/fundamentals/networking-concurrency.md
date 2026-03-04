# Networking & Concurrency

> How data moves between servers and how servers handle simultaneous requests. TCP vs UDP, HTTP versions, and Thread vs Event Loop models.

---

## TCP vs UDP

**Transport Layer Protocols**

| Protocol | Mechanism | Pros | Cons | Use Case |
|----------|-----------|------|------|----------|
| **TCP** | Connection-oriented. 3-way handshake. Guarantees order and delivery (retransmits lost packets). | Reliable. No data loss. Ordered. | Slow start (handshake). Head-of-line blocking (one lost packet delays everything). Overhead. | Web (HTTP), Email, File Transfer, Database connections. |
| **UDP** | Connectionless. Fire-and-forget. Packets sent individually. | Lowest latency. No handshake. No retransmission delays. | Unreliable. Packets can arrive out of order or be lost. | Video streaming (zoom), Gaming, DNS, Voice over IP (VoIP). |

---

## HTTP Protocols (1.1 vs 2 vs 3)

The web is built on HTTP, but the version matters for performance.

- **HTTP/1.1:** Text-based. One request per connection (unless pipelined, which is rare). "Keep-alive" reuses connection but suffers from **Head-of-Line Blocking** (slow request blocks subsequent ones).
- **HTTP/2:** Binary. **Multiplexing** allows multiple requests/responses in parallel over a single TCP connection. Server Push. Solves HTTP/1.1 blocking but still suffers from TCP blocking.
- **HTTP/3 (QUIC):** Built on UDP. Solves TCP Head-of-Line blocking. Faster connection setup (0-RTT). Better for mobile networks (switching Wi-Fi to 4G without reconnecting).

**HTTP Version Comparison**

| Version | Transport | Multiplexing | Head-of-Line Blocking | Best For |
|---------|-----------|--------------|----------------------|----------|
| HTTP/1.1 | TCP | No (one req per connection) | Yes — severe | Legacy systems |
| HTTP/2 | TCP | Yes (multiple streams) | TCP-level blocking remains | Web APIs, gRPC |
| HTTP/3 (QUIC) | UDP | Yes + independent streams | None | Mobile, global users, video |

---

## Concurrency Models (Server Architecture)

How does your server handle 10,000 concurrent connections? This depends on the concurrency model.

**Thread vs Event Loop**

| Model | How it works | Memory | Best for | Examples |
|-------|-------------|--------|----------|----------|
| **Thread per Request** | Allocates a dedicated OS thread for each client connection. Blocks on IO. | High (1MB stack per thread). 10k users = 10GB RAM just for stacks. | CPU-bound tasks. Traditional blocking code. | Java (Spring Boot default), Apache Tomcat, Python (Flask/Django default). |
| **Event Loop (Non-blocking I/O)** | Single thread handles all connections. "Call me back when DB responds." Never blocks. | Low. 10k users = minimal RAM. | IO-bound tasks (Waiting for DB/Network). High concurrency. | Node.js, Nginx, Redis. |
| **Goroutines / Green Threads** | Lightweight user-space threads managed by runtime, not OS. Multiplexed onto OS threads. | Very Low (2KB stack). | High concurrency + Blocking-style code (easier to write). | Go (Golang), Elixir (Erlang processes). |

---

## The C10K Problem

The "C10K problem" (10,000 concurrent connections) was a famous engineering challenge in the early 2000s. Traditional thread-per-connection servers couldn't scale beyond a few thousand concurrent clients due to memory exhaustion and context-switching overhead. The solutions:

1. **Event-driven servers** (Nginx, Node.js) — handle thousands of connections in a single thread via async I/O.
2. **Goroutines** (Go) — 2KB green threads that scale to millions on a single machine.
3. **Connection pooling** — reuse connections rather than creating one per request.

---

## DNS & The Name Resolution Chain

When a client connects to `api.example.com`, the full chain is:

```
1. Browser cache (instant — remembers from last visit)
2. OS resolver cache (/etc/hosts, system DNS cache)
3. Recursive DNS resolver (ISP or 8.8.8.8)
4. Root nameserver (knows who manages .com)
5. TLD nameserver (knows who manages example.com)
6. Authoritative nameserver for example.com → returns IP address
7. Browser connects to IP address
```

**DNS TTL** (Time To Live) controls how long caches store the result. Low TTL (60s) = fast failover but more DNS load. High TTL (3600s) = fewer queries but slow DNS-based failover.

---

## SSL/TLS Handshake

Every HTTPS connection requires a TLS handshake before data can flow. Understanding this cost matters for system design:

| Phase | What happens | Round trips |
|-------|-------------|-------------|
| TCP 3-way handshake | SYN → SYN-ACK → ACK | 1 RTT |
| TLS 1.2 handshake | Client Hello → Server Hello → Certificate → Key Exchange | 2 RTT |
| TLS 1.3 handshake | Client Hello → Server Hello (combined) | 1 RTT |
| TLS 1.3 with 0-RTT | Session resumption — no extra roundtrip | 0 RTT |

> 💡 **Tip:** API Gateways terminate TLS at the edge. Backend services receive plain HTTP internally, saving TLS overhead on every internal call. The API Gateway holds the SSL certificate.

---

## Network Topology in Data Centers

| Layer | What it is | Latency |
|-------|-----------|---------|
| Same process (in-process call) | Function call | Nanoseconds |
| Same machine (loopback) | localhost connection | ~0.1ms |
| Same rack (top-of-rack switch) | Intra-rack network hop | ~0.2ms |
| Same data center (cross-rack) | Intra-DC hop | ~0.5–5ms |
| Same region (cross-AZ) | AWS us-east-1a → us-east-1b | ~1–3ms |
| Cross-region (US → Europe) | Trans-Atlantic | ~80–120ms |
| Cross-region (US → Asia) | Trans-Pacific | ~150–200ms |

**Design rule:** Cross-region synchronous calls add 150ms+ to every request. Avoid them in the critical path. Use asynchronous replication for cross-region consistency.

---

## Interview Talking Points

- "I'd use WebSockets for real-time chat. HTTP/2 for the REST API (multiplexing reduces connection overhead). gRPC (HTTP/2 + protobuf) for internal microservice calls."
- "Node.js is ideal for the WebSocket server because it handles thousands of concurrent open connections with minimal memory — it's purely IO-bound work."
- "Go would work well here: goroutines are 500× cheaper than OS threads, and we need to fan out to 10,000 follower connections per event."
- "I'd terminate TLS at the API Gateway. All internal service-to-service calls use plain HTTP within the private VPC."
