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
