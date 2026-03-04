# API Design & API Gateway

> The API is the contract between your services. Good API design prevents breaking changes. The API Gateway is the front door to your entire system.

---

## REST vs gRPC vs GraphQL

**API Protocol Comparison**

| Protocol | How it works | Pros | Cons | Best for |
|----------|-------------|------|------|----------|
| **REST** | HTTP + JSON. Resources as URLs (GET /users/123). Stateless. | Universal, human-readable, browser-native, easy to debug | Over-fetching (response has more data than needed), under-fetching (need multiple calls) | Public APIs, client-facing services, simple CRUD operations |
| **gRPC** | HTTP/2 + Protocol Buffers (binary). Define API in .proto files. | 3–10× faster than REST (binary encoding). Streaming support. Strong typing catches errors at compile time. | Not human-readable. Browser support limited. Requires proto files. | Internal microservice-to-microservice calls. High-throughput pipelines. |
| **GraphQL** | Client specifies exactly what fields it wants in the query. Single endpoint. | No over/under-fetching. Client drives the shape. Excellent for complex nested data. | Complex caching (queries aren't URL-based). Complexity shifted to client. N+1 query problem. | Mobile apps where bandwidth matters. Complex UIs fetching many related resources. |

---

## The API Gateway

An **API Gateway** is the single entry point for all external requests to your system. Instead of clients connecting directly to 50 different microservices, they connect to one gateway that routes, authenticates, rate-limits, and monitors every request. This pattern is called **Backend for Frontend (BFF)** when the gateway is tailored to a specific client type (mobile vs. web vs. third-party).

**What an API Gateway Does**

| Function | How it works |
|----------|-------------|
| **Routing** | Routes /users/* to the User Service, /orders/* to the Order Service, etc. |
| **Authentication** | Validates JWT tokens, API keys before the request reaches any service |
| **Rate limiting** | Enforces per-user/per-tenant request limits at the edge |
| **SSL termination** | Handles HTTPS encryption/decryption — backend services get plain HTTP |
| **Request transformation** | Translates between API versions, adds headers, transforms request format |
| **Circuit breaking** | If a downstream service is failing, stops forwarding requests to it |
| **Observability** | Central place to log, trace, and monitor all API traffic |

| Service | Best For | Key Features |
|---------|----------|--------------|
| **AWS API Gateway** | Serverless APIs on AWS | Managed. Native Lambda integration. Handles millions of requests. Pay per call. |
| **Kong** | Open-source, self-hosted | Plugin-based. Highly extensible. Used at massive scale. Can run on Kubernetes. |
| **NGINX / Traefik** | Lightweight reverse proxy | Often used as API gateway for simpler setups. Extremely fast. Used by Netflix, Cloudflare. |

---

## Rate Limiting in Depth

**Rate limiting** protects your API from being overwhelmed — whether by malicious actors (DDoS) or legitimate users making too many calls. It also enables fair usage across tenants.

**Rate Limiting Algorithms**

| Algorithm | How it works | Pros | Cons |
|-----------|-------------|------|------|
| **Fixed Window Counter** | Count requests in 1-minute buckets. Reset counter each minute. | Simple. Low memory. | Boundary burst problem: can send 2× limit at the window boundary. |
| **Sliding Window Log** | Store timestamps of all requests. Count those in last 60 seconds. | Accurate. No boundary burst. | High memory — must store all timestamps. |
| **Token Bucket** | Bucket holds N tokens. Refilled at R tokens/second. Each request consumes one token. Full bucket allows bursting. | Allows natural bursting. Simple. Most commonly used in APIs. | Slightly complex implementation. |
| **Leaky Bucket** | Requests enter at any rate but are processed at a fixed constant rate (like water dripping from a leaky bucket). | Smooth output rate. Good for protecting downstream services. | Bursty input gets queued; latency increases under bursts. |

In production, rate limiting is implemented with **Redis**: an atomic Lua script increments a counter keyed by user_id + time_window, checks against the limit, and returns allow/deny in a single atomic operation. This prevents race conditions when multiple API servers check the same counter simultaneously.

---

## REST API Design Best Practices

**Resource naming:**
- Use nouns, not verbs: `/users`, `/orders`, not `/getUser`, `/createOrder`
- Plural resource names: `/users/123`, not `/user/123`
- Hierarchical for relationships: `/users/123/orders/456`

**HTTP Methods:**
| Method | Use | Idempotent? | Safe? |
|--------|-----|-------------|-------|
| `GET` | Retrieve resource | Yes | Yes |
| `POST` | Create resource | No | No |
| `PUT` | Replace entire resource | Yes | No |
| `PATCH` | Partially update resource | No | No |
| `DELETE` | Delete resource | Yes | No |

**HTTP Status Codes:**
| Code | Meaning | Use when |
|------|---------|---------|
| `200 OK` | Success | Successful GET, PUT, PATCH |
| `201 Created` | Resource created | Successful POST |
| `204 No Content` | Success, no body | Successful DELETE |
| `400 Bad Request` | Client error | Invalid input, missing fields |
| `401 Unauthorized` | Authentication required | Missing/invalid token |
| `403 Forbidden` | Access denied | Token valid but insufficient permissions |
| `404 Not Found` | Resource doesn't exist | Getting unknown ID |
| `409 Conflict` | Resource conflict | Duplicate email, optimistic lock failure |
| `429 Too Many Requests` | Rate limit exceeded | Rate limiting |
| `500 Internal Server Error` | Server crashed | Unhandled exception |
| `503 Service Unavailable` | Service overloaded | Load shedding, maintenance |

---

## API Versioning Strategies

When you need to make breaking changes, you need a versioning strategy:

| Strategy | Example | Pros | Cons |
|----------|---------|------|------|
| **URL path versioning** | `/v1/users`, `/v2/users` | Clear, easy to test in browser, easy caching | URL pollution, must update all clients |
| **Header versioning** | `Accept: application/vnd.api+json; version=2` | Clean URLs | Harder to test, less discoverable |
| **Query parameter** | `/users?version=2` | Simple | Breaks caching, messy URLs |
| **Content negotiation** | `Accept: application/vnd.myapi.v2+json` | RESTful standard | Complex to implement |

> 💡 **Best practice:** URL path versioning (`/v1/`, `/v2/`) is the most pragmatic choice for most systems. Run v1 and v2 simultaneously until all clients migrate, then deprecate v1.

---

## API Design for Backward Compatibility

Rules to avoid breaking existing clients:

1. **Never remove fields** from responses — add new ones instead
2. **Never rename fields** — clients depend on exact field names
3. **Never change field types** — string → int breaks parsers
4. **Never make optional fields required** — existing clients don't send them
5. **Adding new endpoints is always safe**
6. **Use semantic versioning** for major breaking changes (`/v2/`)

---

## Interview Talking Points

- "I'd use REST for the client-facing API (browser-native, cacheable) and gRPC for internal service-to-service calls (3-10× faster, strongly typed)."
- "The API Gateway handles authentication, rate limiting, and routing — all services behind it only see authenticated requests. This avoids duplicating auth logic in every service."
- "Rate limiting: Token Bucket in Redis. Atomic Lua script to check-and-decrement. Return `X-RateLimit-Remaining` headers so clients can self-throttle."
- "For mobile: GraphQL prevents over-fetching. A mobile client on a 3G connection can request just the fields it needs instead of downloading a full response."
