# API Design & API Gateway

Every client-facing service exposes an API. The protocol, gateway strategy, and rate-limiting approach you choose become load-bearing decisions at scale.

---

## REST vs gRPC vs GraphQL

| | REST | gRPC | GraphQL |
|--|------|------|---------|
| **Protocol** | HTTP/1.1 + JSON | HTTP/2 + Protobuf (binary) | HTTP/1.1 or HTTP/2 + JSON |
| **Schema** | OpenAPI (optional) | Strongly typed `.proto` files | Strongly typed schema |
| **Performance** | Moderate | High — binary, multiplexed | Moderate |
| **Streaming** | Limited (SSE workaround) | First-class (server, client, bidirectional) | Subscriptions |
| **Browser support** | Native | Needs grpc-web proxy | Native |
| **Best for** | Public APIs, external clients | Internal microservices, high-throughput | Mobile clients, complex data graphs |
| **Used by** | Twitter, GitHub, Stripe | Google internal APIs, Kubernetes, etcd | GitHub v4, Shopify, Facebook |

### REST
The default. Every language, framework, and tool understands HTTP + JSON. Design principles:
- Use nouns for resources: `GET /users/123` not `GET /getUser?id=123`
- HTTP verbs carry semantics: GET (idempotent read), POST (create), PUT (replace), PATCH (partial update), DELETE
- Return appropriate status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Too Many Requests, 500 Internal Server Error
- Version your API: `/v1/users`, `/v2/users`

### gRPC
Google's Remote Procedure Call framework. Ideal for internal microservice communication where performance matters.

**Key advantages:**
- **Protobuf encoding** is 3–10× more compact than JSON and faster to serialize.
- **HTTP/2 multiplexing** means many concurrent RPC calls over one connection.
- **Strong typing** from `.proto` files. Generated client/server code in any language.
- **Streaming:** Unary, server-streaming, client-streaming, bidirectional-streaming — all supported.

**When NOT to use gRPC:** Public APIs where clients are browsers or unknown third parties — they can't easily use gRPC without a proxy (grpc-web or Envoy).

### GraphQL
Client specifies exactly the fields it needs. One query can fetch data from multiple "types" that would require multiple REST endpoints.

**Key advantages:**
- **No over-fetching:** Mobile client fetching a feed card asks only for `title, thumbnail, author.name` — not the full article object.
- **No under-fetching:** Avoid N+1 request patterns by fetching nested data in one query.
- **Evolving APIs:** Add fields without breaking old clients; deprecate fields without removing them immediately.

**When NOT to use GraphQL:** Simple CRUD APIs. Caching is harder (every query is a POST). N+1 database queries if resolvers aren't implemented carefully (use DataLoader).

---

## The API Gateway

An **API Gateway** sits in front of all your backend services and acts as the single entry point for all client traffic. It is not optional at scale.

```
Clients → [API Gateway] → Service A
                        → Service B
                        → Service C
```

**What the API Gateway handles:**

| Responsibility | Without Gateway | With Gateway |
|---------------|-----------------|--------------|
| Authentication | Each service validates tokens | Gateway validates once, forwards identity |
| Rate limiting | Each service implements its own | Centralized, consistent across all services |
| SSL termination | Each service handles TLS | Gateway terminates TLS, internal traffic can be plain HTTP |
| Request routing | Each client knows service addresses | Clients know only the gateway address |
| Request transformation | Each service handles format differences | Gateway translates (REST → gRPC, v1 → v2) |
| Observability | Scattered across services | Centralized access logs, latency metrics |
| Caching | Each service adds its own layer | Gateway can cache responses for GET requests |

**Popular API Gateways:** AWS API Gateway, Kong, Nginx (as gateway), Envoy, Istio (service mesh — more powerful but complex), Traefik.

---

## Rate Limiting in Depth

Rate limiting protects your services from being overwhelmed by too many requests, whether from traffic spikes, misbehaving clients, or attacks.

### Rate Limiting Algorithms

**Token Bucket** (most common)
- A bucket holds up to `capacity` tokens.
- Tokens are added at `rate` per second.
- Each request consumes one token.
- If bucket is empty, request is rejected (429 Too Many Requests).
- **Allows bursting** up to `capacity` requests momentarily, then sustains at `rate`.

**Leaky Bucket**
- Requests enter a queue. Queue drains at a fixed rate.
- Provides a smooth, constant output rate. No bursting.
- Used when downstream can't handle bursts (payment processors).

**Fixed Window Counter**
- Count requests in fixed time windows (e.g., per minute).
- Simple but has edge case: a client can send 2× limit across a window boundary.

**Sliding Window Log / Counter**
- More precise. Tracks exact request timestamps.
- Eliminates the window-boundary spike problem.
- Slightly more memory usage.

### Where to Store Rate Limit State
- **Redis** is the standard. Atomic `INCR` + `EXPIRE` for simple counters. Lua scripts for token bucket logic. Single Redis instance handles millions of rate limit checks per second.
- For distributed rate limiting (multiple gateway nodes): use Redis Cluster or a consistent hash to route all requests for the same key to the same Redis shard.

### Rate Limit Headers (return in 429 response)
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704067200
Retry-After: 60
```

---

## Interview Answer Sketch

> "I'd put an API Gateway in front of all services. It handles TLS termination, JWT validation, rate limiting (token bucket in Redis, 1000 req/min per user), and routes requests to the right backend service. Internally, services communicate via gRPC over HTTP/2 for lower latency and smaller payloads. The public API is REST for external developers since every language can consume JSON over HTTP."
