# Microservices vs Monolith

> One of the most common discussion points in system design. When to split, when not to split, and how services find and talk to each other.

---

## Monolith vs Microservices Decision

A **monolith** is a single deployable unit where all features (user auth, orders, payments, notifications) live in one codebase and process. A **microservices architecture** splits these into independent services, each owning its own data and deployed separately. Neither is universally better — the wrong choice is usually microservices too early.

**Monolith vs Microservices**

| Dimension | Monolith | Microservices |
|-----------|---------|--------------|
| Development speed (early) | ✅ Fast — no network calls, shared DB, simple local testing | ❌ Slow — distributed setup, service contracts, network complexity |
| Scaling | ❌ Must scale entire app even if only one feature needs it | ✅ Scale individual services independently (e.g., scale Video Processing without scaling Auth) |
| Fault isolation | ❌ One bug can crash the whole app | ✅ One service fails; others keep running (with circuit breakers) |
| Technology flexibility | ❌ Locked to one tech stack | ✅ Each service can use the best tool for its job (Python for ML, Go for real-time) |
| Operational complexity | ✅ Deploy once. Simple monitoring. One log stream. | ❌ Many services, many deployments, distributed tracing required |
| Team size sweet spot | 1–20 engineers | 20+ engineers (Conway's Law: team structure mirrors system architecture) |

> 💡 **Interview answer on when to use each:** **Start with a monolith.** Amazon, Twitter, Uber all started as monoliths. Move to microservices when: (1) specific parts need independent scaling, (2) different teams own different domains, (3) you need different tech stacks per service, or (4) deployments of one part are blocked by another. The **Strangler Fig pattern** is the safe migration path: route new features to microservices while gradually extracting old monolith code.

---

## Docker — Containerization

Before deploying microservices, you need a way to package each one consistently across environments. **Docker** solves the "works on my machine" problem by bundling an application with all its dependencies into a **container**.

### Container vs Virtual Machine

| | Container (Docker) | Virtual Machine |
|---|---|---|
| **Isolation** | Process-level (shares host OS kernel) | Full OS isolation (own kernel) |
| **Startup time** | Milliseconds | Minutes |
| **Size** | MBs | GBs |
| **Performance** | Near-native | 5–15% overhead (hypervisor) |
| **Use case** | Microservices, CI/CD, dev environments | Strong security isolation, different OS |

> Think of a VM as a full house and a container as a room in that house — containers share the building's infrastructure (host OS kernel) but each room is isolated.

### Key Docker Concepts

**Image** — a read-only, layered template for a container. Built from a `Dockerfile`. Stored in a registry (Docker Hub, ECR, GCR). Immutable — the same image always produces the same container.

**Container** — a running instance of an image. Isolated filesystem, network, and process space. Ephemeral by default — data inside is lost when the container stops (use volumes for persistence).

**Dockerfile** — the recipe to build an image:

```dockerfile
FROM python:3.11-slim               # base image layer
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt  # cached layer if unchanged
COPY . .
EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

**Layer caching** — each `RUN`/`COPY` instruction creates a cached layer. Put infrequently changing steps (like `pip install`) before frequently changing code to maximize cache hits.

**Registry** — central store for images. `docker push` publishes; `docker pull` downloads. Your CI pipeline builds an image, pushes it tagged with the git commit SHA, and your deployment pulls that exact image.

### Essential Docker Commands

```bash
docker build -t my-service:1.0 .          # build image from Dockerfile
docker run -p 8080:8080 my-service:1.0    # run container, map port
docker ps                                  # list running containers
docker logs <container_id>                 # view stdout/stderr
docker exec -it <container_id> /bin/bash  # open shell in container
docker push registry/my-service:1.0       # push image to registry
```

### Why Docker for Microservices

- **Consistency** — same image runs in dev, staging, and production.
- **Isolation** — Service A's Python 3.9 and Service B's Python 3.11 coexist without conflict.
- **Fast deploys** — pulling and starting a container takes seconds.
- **Rollback** — just run the previous image tag.

---

## Kubernetes (K8s) — Container Orchestration

Docker runs a single container on a single machine. In production you have hundreds of containers across dozens of machines. **Kubernetes** automates: scheduling, scaling, self-healing, rolling updates, and service discovery for containerized workloads.

> Kubernetes = the operating system for your distributed microservices fleet.

### Key Kubernetes Concepts

**Pod** — the smallest deployable unit. A Pod wraps 1+ containers that share a network namespace and storage. Usually 1 container per Pod. Pods are ephemeral — when they die, Kubernetes schedules a replacement.

**Deployment** — a controller that manages a set of identical Pods (replicas). Declares desired state (`replicas: 3`, `image: my-service:1.2`). K8s continuously reconciles actual state toward desired state.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service
spec:
  replicas: 3                          # always keep 3 pods running
  selector:
    matchLabels:
      app: payment-service
  template:
    spec:
      containers:
      - name: payment
        image: registry/payment:1.2    # exact image version
        resources:
          requests: { cpu: "100m", memory: "128Mi" }
          limits:   { cpu: "500m", memory: "512Mi" }
```

**Service** — gives a Deployment a stable DNS name and virtual IP. Pods come and go; the Service is permanent. Traffic to `payment-svc:8080` is load-balanced across all healthy Pods.

```yaml
kind: Service
metadata:
  name: payment-svc
spec:
  selector:
    app: payment-service
  ports:
  - port: 8080
```

Now `order-service` calls `http://payment-svc:8080` — Kubernetes handles discovery and load balancing automatically.

**Ingress** — HTTP/HTTPS routing from outside the cluster to internal Services. Routes by hostname or path (`/api/payments → payment-svc`, `/api/orders → order-svc`). Backed by an Ingress Controller (Nginx, Traefik, AWS ALB).

**ConfigMap / Secret** — inject configuration into Pods without baking it into the image. ConfigMaps for non-sensitive config (feature flags, URLs). Secrets for credentials (API keys, DB passwords) — base64-encoded and access-controlled.

**Namespace** — logical cluster partitioning. Use separate namespaces for `production`, `staging`, `dev` — or per team.

**HPA (Horizontal Pod Autoscaler)** — automatically adjusts `replicas` based on CPU/memory usage or custom metrics. If CPU > 70% → scale up. When traffic drops → scale down.

```yaml
kind: HorizontalPodAutoscaler
spec:
  scaleTargetRef:
    name: payment-service
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Kubernetes Deployment Strategies

| Strategy | How it works | Use when |
|---|---|---|
| **Rolling update** | Replaces pods one at a time. Zero downtime. | Default — most production deploys |
| **Blue/Green** | Run v1 and v2 in parallel, switch traffic at once | Instant rollback needed, higher resource cost |
| **Canary** | Route 5–10% traffic to v2, monitor, then roll forward | Risk-averse rollout of risky changes |

### Docker + Kubernetes Flow (end-to-end)

```
Developer pushes code to Git
    ↓
CI pipeline (GitHub Actions/Jenkins):
  - docker build -t registry/service:sha123 .
  - docker push registry/service:sha123
    ↓
CD pipeline (ArgoCD/Flux) detects new image:
  - Updates Deployment YAML → image: sha123
  - kubectl apply → K8s performs rolling update
    ↓
K8s scheduler places new Pods on nodes
HPA monitors CPU → scales replicas as needed
```

### Key Kubernetes Numbers & Facts

| Concept | Value |
|---|---|
| Max Pods per node (default) | 110 |
| Max nodes per cluster | 5,000 (standard) |
| Pod startup time | 1–10 s |
| Rolling update default maxUnavailable | 25% |
| HPA scale-down stabilization window | 5 min (prevents thrashing) |

### Kubernetes in Interviews

- "Each microservice is a Kubernetes Deployment. The Service gives it a stable DNS name so other services can call it without hardcoding IPs."
- "We use HPA to auto-scale the Video Processing service — it's CPU-intensive and traffic spikes during uploads."
- "Rolling updates let us deploy without downtime. If the new version fails health checks, Kubernetes automatically stops the rollout."
- "We separate teams into namespaces — Payment team owns the `payments` namespace with its own resource quotas."

---

## Service Discovery — How Services Find Each Other

In a dynamic microservices environment, service instances start and stop constantly (deployments, auto-scaling, crashes). You can't hardcode IP addresses. **Service discovery** is the mechanism by which services find the current network addresses of other services they need to call.

**Service Discovery Approaches**

| Approach | How it works | Examples | Best for |
|----------|-------------|---------|---------|
| **Client-side discovery** | Service queries a registry (Consul, Eureka) for addresses of target service, then picks one using a local load balancing algorithm (round robin, random). | Netflix Eureka, HashiCorp Consul | When you want fine-grained client-side load balancing logic |
| **Server-side discovery** | Client sends request to a load balancer or API gateway. Load balancer queries registry and routes to a healthy instance. Client doesn't know about instances. | AWS ALB, Kubernetes Service, Nginx | Most modern systems — simpler client, gateway handles routing |
| **DNS-based discovery** | Each service has a DNS name (e.g., payment-service.internal). DNS returns current healthy IP addresses. Kubernetes uses this natively. | Kubernetes CoreDNS, AWS Route 53 private zones | Kubernetes-based architectures — built-in, no extra tooling |

In Kubernetes (the dominant orchestration platform), **service discovery** is built-in. When you create a Kubernetes Service, it gets a stable DNS name (e.g., `payment-svc.default.svc.cluster.local`). Any pod can call this DNS name, and Kubernetes routes to a healthy backend pod. The kube-proxy component handles the routing via iptables rules.

---

## Synchronous vs Asynchronous Communication

**When to Choose Each Pattern**

| Pattern | Use when | Risk |
|---------|---------|------|
| **Synchronous (REST/gRPC)** | You need an immediate response to serve the user. Example: "Is this user's credit card valid?" — you can't respond to the user until you know. | Tight coupling — if payment service is slow, your service is slow. Cascade failures. |
| **Asynchronous (Kafka/SQS)** | The work can happen in the background. Example: "Send a confirmation email after order" — user doesn't wait for the email to be sent. | Eventual consistency. More complex error handling (retries, dead letter queues). |

> ⚠️ **The Cascading Failure Problem:** Synchronous calls chain latency. If Service A calls B which calls C which calls D, the total latency = A + B + C + D. If D becomes slow (200ms → 2000ms), every service in the chain becomes slow. This is why deep synchronous chains are dangerous. Prefer async for non-critical paths and enforce **timeouts at every call**.

---

## Service Mesh Architecture

A **service mesh** is an infrastructure layer for microservice-to-microservice communication. Instead of implementing retry, circuit breaking, and mTLS in every service, a sidecar proxy handles it transparently.

```
Without service mesh:
Service A → [your code: handle TLS, retries, circuit breaking] → Service B

With service mesh (Istio/Envoy):
Service A → [Envoy sidecar: TLS, retries, circuit breaking] → Service B
  (your code just makes a plain HTTP call)
```

| Feature | Without Mesh | With Mesh (Istio/Linkerd) |
|---------|-------------|--------------------------|
| mTLS (mutual TLS) | Manual certificate management in each service | Automatic — every call encrypted by default |
| Circuit breaking | Hystrix/Resilience4j library in each service | Configured in Istio VirtualService YAML |
| Distributed tracing | OpenTelemetry SDK in each service | Automatic span injection by sidecar |
| Traffic splitting (canary) | Feature flags in code | Istio VirtualService: 10% traffic to v2 |

---

## API Contracts & Service Boundaries

A critical challenge in microservices: services must evolve independently without breaking each other.

**Contract testing (Pact):**
- Consumer writes a test that defines what it expects from the API
- Provider verifies it satisfies all consumer contracts
- Prevents breaking API changes from reaching production

**Bounded Contexts (Domain-Driven Design):**
- Each microservice owns one bounded context — a logically cohesive domain
- Example: Order service owns everything about orders; User service owns user identity
- Services do NOT share a database — they communicate via APIs or events only

**Good service boundaries:**
- Low coupling (services don't need each other to function)
- High cohesion (all code in the service is related to one domain)
- The "two-pizza rule": if a service needs more than two pizzas to feed its team, it's too big

---

## Data Management in Microservices

Each service owns its own database — this is the **Database-per-Service pattern**:

| Pattern | What it means | Trade-off |
|---------|-------------|-----------|
| **Database-per-Service** | Each service has its own private DB. No direct DB access between services. | Loose coupling. Independent scaling. Hard to do cross-service queries/transactions. |
| **Shared Database** | Multiple services share one DB. Easier queries but tight coupling. | Simple joins. One team's schema change breaks another team's service. |
| **Saga for transactions** | Distributed transactions via choreographed events. Each step has a compensating action. | No distributed locks. Complex to implement and debug. |
| **API Composition** | Orchestration service calls multiple APIs and aggregates results (like a read-only JOIN). | Flexible queries. Extra latency from multiple calls. Orchestrator can become a bottleneck. |

---

## Interview Talking Points

- "I'd start with a monolith. At 10 engineers, the operational overhead of microservices would slow us down more than the scaling benefits would help us."
- "Once we hit 50 engineers, I'd split along domain boundaries: User Service, Order Service, Payment Service, Notification Service. Each owns its database."
- "For service-to-service: gRPC with Envoy sidecar. Envoy handles circuit breaking, retries, and distributed tracing automatically — no library code needed in each service."
- "The hardest part of microservices is cross-service transactions. For the checkout flow (reserve stock + charge payment + create shipment), I'd use the Saga pattern with compensating transactions."
