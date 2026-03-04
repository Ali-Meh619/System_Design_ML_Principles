# Load Balancing & Networking

Load balancers distribute traffic across multiple servers, provide health-check-based failover, and are the gateway through which all network traffic enters your system.

---

## L4 vs L7 Load Balancing

The "layer" refers to the OSI model layer at which the load balancer makes routing decisions.

### Layer 4 (Transport Layer) Load Balancer
Routes based on **IP address and TCP/UDP port** only. Does not inspect the packet contents (no HTTP headers, no URLs).

- **Pros:** Extremely fast. Minimal CPU overhead. Works for any TCP/UDP protocol (HTTP, MySQL, Redis, SMTP).
- **Cons:** Cannot make application-aware routing decisions (route `/api/videos` to video servers). No SSL termination.
- **When to use:** High-throughput, latency-sensitive workloads. Gaming servers. Database connection pooling.
- **Examples:** AWS NLB (Network Load Balancer), HAProxy in TCP mode.

### Layer 7 (Application Layer) Load Balancer
Routes based on **HTTP content**: URL path, headers, cookies, request body.

- **Pros:** Application-aware routing (URL-based, cookie-based sticky sessions). SSL termination. HTTP/2 support. Request/response inspection, transformation.
- **Cons:** Higher CPU overhead (must parse HTTP). Slightly more latency.
- **When to use:** HTTP/HTTPS services. Microservices needing path-based routing. WebSocket support.
- **Examples:** AWS ALB (Application Load Balancer), Nginx, HAProxy in HTTP mode, Envoy.

| | L4 | L7 |
|--|----|----|
| Decision basis | IP + Port | URL, headers, cookies |
| SSL termination | No | Yes |
| Content-based routing | No | Yes |
| Performance | Very high | High |
| Use case | Any TCP/UDP | HTTP/HTTPS services |

---

## Load Balancing Algorithms

### Round Robin
Requests distributed sequentially: Server 1 → Server 2 → Server 3 → Server 1 → ...

- **Pros:** Simple. Equal distribution when all servers are equivalent.
- **Cons:** Doesn't account for server load or request weight. If one request takes 10× longer, that server becomes a bottleneck.

### Weighted Round Robin
Like Round Robin but servers have weights. Server A (weight 3) gets 3 requests for every 1 request to Server B (weight 1).

- **Use when:** Servers have different capacities. Gradually shifting traffic (canary deploys — send 5% to new version).

### Least Connections
Routes to the server with fewest active connections.

- **Pros:** Automatically routes away from overloaded servers. Self-correcting.
- **Cons:** Slightly more overhead (must track connection counts). Doesn't account for connection cost variation.
- **Best for:** Long-lived connections (WebSocket, gRPC streaming) where connection count is a proxy for load.

### Consistent Hashing
Hash a key (user ID, session ID, client IP) to determine which server handles the request. Same key always goes to the same server.

- **Pros:** Session affinity without server-side session sharing. Cache locality (same server handles same user, so its cache is warm).
- **Cons:** Uneven distribution if keys aren't uniformly distributed. Adding/removing servers only remaps ~K/N keys (much better than simple modular hashing).
- **Best for:** Stateful services (WebSocket chat servers), distributed caches, database sharding.
- **How it works:** Servers and keys are placed on a ring. A key routes to the nearest server clockwise. Adding a server only steals keys from its clockwise neighbor.

### IP Hash
Hash the client IP to select a server. Same client always goes to same server (sticky).

- **Pros:** No session store needed if app state is local.
- **Cons:** Breaks if client IP changes (NAT, proxies). Uneven distribution if many clients share IPs.

---

## Health Checks & Failover

Load balancers continuously probe backend servers. If a server fails health checks, traffic is automatically rerouted to healthy servers.

**Active health check:** Load balancer sends periodic HTTP GET to `/health` on each backend. Expects 200 OK within a timeout. If N consecutive checks fail, server is marked unhealthy. When M consecutive checks pass, it's restored.

**Passive health check:** Load balancer monitors actual request results. If a backend returns 5xx errors or times out, it is temporarily removed from rotation.

**Typical settings:**
```
interval: 10s         # Check every 10 seconds
timeout: 5s           # Request must respond within 5s
unhealthy_threshold: 3  # 3 failures → mark unhealthy
healthy_threshold: 2    # 2 successes → mark healthy again
```

**Connection draining (graceful shutdown):** When a server is removed, existing connections are allowed to complete (within a grace period) before the server is truly taken offline. New connections stop going to it immediately. Prevents breaking in-flight requests during deployments.

---

## Global Load Balancing (Multi-Region)

For global traffic, use DNS-based load balancing to route users to the nearest region:
- **Anycast routing:** Same IP address advertised from multiple data centers. BGP routing automatically sends clients to the nearest one (Cloudflare, AWS Global Accelerator).
- **GeoDNS:** DNS returns different IP addresses based on the client's geographic location. Route Tokyo users to the Asia-Pacific region.

---

## Interview Answer Sketch

> "I'd place an L7 load balancer (AWS ALB) in front of the API servers. It handles SSL termination and routes `/api/videos/*` to video servers and `/api/users/*` to user servers. Round-robin distributes traffic. Health checks every 10 seconds with 3-failure threshold. WebSocket connections to the chat service use consistent hashing on user ID to pin a user's connection to the same server — so pub/sub messages don't need to cross server boundaries."
