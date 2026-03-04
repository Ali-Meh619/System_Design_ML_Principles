# Load Balancing & Networking

> Load balancers distribute traffic across servers. Understanding routing algorithms and failure handling is essential for any high-availability design.

---

## L4 vs L7 Load Balancing

Load balancers operate at different layers of the network stack. The layer determines what information they can see and act on.

**L4 vs L7 Comparison**

| Layer | What it sees | Routing decisions based on | Examples |
|-------|-------------|---------------------------|---------|
| **L4 (Transport Layer)** | IP addresses, ports, TCP/UDP protocol | IP address and port only. Fast. Cannot see request content. | AWS NLB, HAProxy in TCP mode |
| **L7 (Application Layer)** | HTTP headers, URL paths, cookies, body | URL path, hostname, user session. Slower but far more powerful. | AWS ALB, Nginx, Kong |

Most web systems use L7 load balancing because it enables content-based routing: `/api/*` goes to API servers, `/static/*` goes to CDN origin servers, `/admin/*` goes to admin servers. L4 is used in front of L7 when you need maximum throughput with minimal overhead.

---

## Load Balancing Algorithms

**Algorithm Comparison**

| Algorithm | How it works | Best for |
|-----------|-------------|---------|
| **Round Robin** | Send request 1 to server 1, request 2 to server 2, etc., cycling through. | Stateless services with identical hardware and request costs. |
| **Weighted Round Robin** | Same but powerful servers get proportionally more traffic. | Heterogeneous server fleet (different CPU/memory). |
| **Least Connections** | Send next request to server currently handling fewest active connections. | Long-lived connections (WebSockets, streaming) where request duration varies. |
| **Consistent Hashing** | Hash request key (e.g., user_id) to always route same user to same server. | Stateful services, caches (same user hits same server = warm cache), chat servers. |
| **Least Response Time** | Route to the server with lowest current latency AND fewest connections. | Heterogeneous workloads where response time varies significantly. |

---

## Health Checks & Failover

A load balancer continuously checks if backend servers are healthy via **health check endpoints** — typically a `GET /health` that returns `200 OK`. If a server fails to respond (times out) or returns a non-200 status for N consecutive checks, the load balancer removes it from the rotation and stops sending traffic. When the server recovers, it's automatically added back. This is the foundation of high availability: servers can die without user impact.

**Health check best practices:**
- Check every 10 seconds; fail after 3 consecutive failures (~30 seconds to remove)
- Health endpoint should test actual dependencies (DB connection, Redis connection), not just return 200
- Use different health endpoints for load balancer (shallow) vs. orchestrator (deep)

---

## Load Balancer Types in Practice

| Type | Product | Use Case |
|------|---------|---------|
| **Hardware LB** | F5, Citrix ADC | Enterprise, telco. Expensive but handle millions of connections at line rate |
| **Cloud-managed L7** | AWS ALB, GCP HTTPS LB | Web applications, microservices. Auto-scaling. Path/header routing |
| **Cloud-managed L4** | AWS NLB | Ultra-high throughput. Preserves source IP. Static IP addresses |
| **Software LB (self-hosted)** | Nginx, HAProxy | Full control. Used inside VPC for internal traffic |
| **Service Mesh** | Istio, Envoy, Linkerd | Kubernetes. Per-pod load balancing, circuit breaking, mTLS |
| **DNS-based** | AWS Route 53, Cloudflare | Global routing, geo-based routing, health-check-based failover |

---

## Global Load Balancing (Multi-Region)

For global deployments, you need a layer above regional load balancers:

1. **GeoDNS** (Route 53 Geolocation routing): DNS returns different IPs based on user's geographic location. US users → us-east-1, European users → eu-west-1.
2. **Anycast routing**: The same IP address is advertised from multiple data centers. Network routing sends users to the nearest one. Used by Cloudflare, Fastly.
3. **Global HTTP LB** (GCP Global LB, AWS CloudFront): Anycast front-end routes to the nearest healthy backend. Works at L7.

---

## Sticky Sessions (Session Affinity)

Some applications require the same user to always reach the same backend server (stateful applications). Load balancers achieve this via sticky sessions:

- **Cookie-based**: LB injects a cookie with the server ID. Subsequent requests with that cookie go to the same server.
- **IP hash**: Hash the client's IP address to always route to the same server.
- **Application-level**: Use consistent hashing on user_id.

> ⚠️ **Warning:** Sticky sessions undermine the purpose of load balancing. If a user's "sticky" server is overloaded, that user has poor performance even though other servers are idle. Prefer stateless servers + externalized state (Redis sessions) over sticky sessions.

---

## Connection Draining (Graceful Shutdown)

When removing a server from rotation (deployment, scale-in), you need **connection draining**:

1. Load balancer stops sending **new** requests to the server (deregistered)
2. Existing active requests are allowed to complete (drain timeout: 30–300 seconds)
3. Server shuts down after all connections close or drain timeout expires

This prevents cutting off in-flight requests during deployments.

---

## Interview Talking Points

- "I'd use an L7 load balancer (AWS ALB) in front of the API servers. It routes `/api/v1/users/*` to the user service and `/api/v1/orders/*` to the order service. Health checks on `/health` every 10 seconds."
- "For WebSocket connections, I'd use Least Connections algorithm — since WebSocket connections are long-lived, round robin would unevenly distribute load over time."
- "Consistent hashing at the load balancer routes all requests from the same user to the same WebSocket server — their connection is always reachable without Redis pub/sub for intra-server routing."
- "GeoDNS routes European users to our Frankfurt region and US users to Virginia — this cuts latency by 100ms+ versus serving everyone from one region."
