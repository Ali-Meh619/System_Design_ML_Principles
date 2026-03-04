# Networking & Concurrency

The protocols and models that determine how your services talk to each other and how many requests a single server can handle.

---

## TCP vs UDP

| | TCP | UDP |
|--|-----|-----|
| **Connection** | Connection-oriented (3-way handshake) | Connectionless |
| **Delivery** | Guaranteed, ordered, no duplicates | Best-effort, unordered, may duplicate |
| **Flow control** | Yes — sender slows down if receiver is overwhelmed | No |
| **Overhead** | Higher (headers, ACKs, retransmits) | Minimal |
| **Latency** | Higher (handshake + ACK round trips) | Lower |
| **Use cases** | HTTP/HTTPS, databases, file transfer, email | Video streaming, gaming, DNS, VoIP, WebRTC |

**Interview rule:** Default to TCP. Use UDP only when:
1. You need the absolute lowest latency and can tolerate occasional loss (video/audio streaming, multiplayer gaming).
2. You need broadcast/multicast (single packet → many receivers).
3. Your protocol is simple enough to implement its own reliability on top of UDP (QUIC/HTTP/3 does this).

---

## HTTP Protocols (1.1 vs 2 vs 3)

### HTTP/1.1
- **One request per TCP connection** (without pipelining, which browsers disabled due to head-of-line blocking).
- Browsers open 6 parallel connections per domain as a workaround.
- Text-based headers (verbose, repeated on every request).
- **Head-of-line blocking:** If one request stalls, it blocks all requests on that connection.

### HTTP/2
- **Multiplexing:** Multiple requests/responses interleaved over a single TCP connection.
- **Header compression** (HPACK): Repeated headers like `User-Agent` are compressed, reducing overhead 60–70%.
- **Server push:** Server can proactively send resources the client will need (e.g., push CSS before client asks).
- **Streams:** Each request is a stream with a priority weight.
- **Still has TCP head-of-line blocking:** A single lost TCP packet stalls all multiplexed streams.
- Widely supported; the default in modern systems.

### HTTP/3 (QUIC)
- **Built on UDP + QUIC** (Quick UDP Internet Connections — Google-developed protocol).
- **No TCP head-of-line blocking:** Lost packets only block the specific stream, not all streams.
- **Faster connection setup:** QUIC + TLS 1.3 handshake combined = 1 RTT (HTTP/2 = 2 RTTs for TCP + TLS).
- **Connection migration:** If your IP changes (mobile switching from WiFi to cellular), connection survives because QUIC connections are identified by connection ID, not IP:port.
- Used by: YouTube, Google Search, Facebook, Cloudflare.
- **Best for:** Mobile users with variable connectivity. High-loss networks.

| | HTTP/1.1 | HTTP/2 | HTTP/3 |
|--|---------|--------|--------|
| Transport | TCP | TCP | UDP (QUIC) |
| Multiplexing | No | Yes | Yes |
| Head-of-line blocking | Yes | TCP-level | No |
| Header compression | No | HPACK | QPACK |
| Connection setup | 2 RTT | 2 RTT | 1 RTT |

---

## Concurrency Models (Server Architecture)

How does a server handle thousands of simultaneous connections? The concurrency model determines throughput, memory usage, and complexity.

### Thread-per-Request
One OS thread per active request. Thread blocks during I/O (waiting for database, upstream service).

- **Pros:** Simple. Existing blocking libraries work unchanged.
- **Cons:** OS threads consume ~1–8 MB stack each. At 10,000 concurrent requests, that's 10–80 GB RAM just for thread stacks. Context switching overhead.
- **Best for:** CPU-bound workloads. Low-concurrency services. Legacy systems.
- **Used by:** Traditional Java (Spring MVC), .NET MVC, Ruby on Rails with Puma.

### Event Loop (Non-blocking I/O)
Single thread processes events. When an I/O operation starts (network read, disk read), the thread registers a callback and immediately moves on to the next event. I/O completion triggers the callback.

- **Pros:** One thread handles tens of thousands of concurrent connections with minimal memory.
- **Cons:** CPU-bound tasks block the event loop, starving all other connections. Must use async/await or callbacks everywhere.
- **Best for:** I/O-bound workloads with many concurrent connections (API servers, proxies, chat servers).
- **Used by:** Node.js, Nginx, Redis, Go's net/http (with goroutines, similar semantics).

### Worker Pool / Thread Pool
Fixed pool of worker threads. Incoming requests queued. Available workers pick up requests.

- **Pros:** Bounded resource usage. Works well when request processing is CPU-bound.
- **Cons:** Queue depth can grow unbounded under load. Thread switching overhead.
- **Used by:** Most web frameworks combine this with either model above.

### Go Goroutines (M:N Threading)
Go maps many lightweight goroutines onto fewer OS threads. Goroutines start at 8 KB (vs ~1 MB for OS threads). The Go scheduler parks goroutines during I/O and reuses OS threads.

- **Result:** Get the simplicity of thread-per-request (blocking-style code) with the efficiency of an event loop.
- **Used by:** Most modern Go services (Kubernetes, Docker, Caddy).

### Interview answer framework
> "This service is I/O bound — it makes multiple downstream calls and waits for responses. I'll use a non-blocking async model so one thread handles thousands of concurrent connections without the memory overhead of thread-per-request. For CPU-bound sections (image compression, crypto), I'll offload to a separate worker pool so they don't block the event loop."

---

## Key Protocols Summary

| Protocol | Layer | Use |
|----------|-------|-----|
| TCP | Transport | Reliable ordered delivery |
| UDP | Transport | Fast, loss-tolerant delivery |
| HTTP/1.1, HTTP/2, HTTP/3 | Application | Web APIs, browsers |
| gRPC | Application | Internal microservice RPC (uses HTTP/2) |
| WebSocket | Application | Persistent bidirectional connection |
| TLS 1.3 | Security | Encryption over TCP |
| QUIC | Transport | Encrypted UDP (used by HTTP/3) |
