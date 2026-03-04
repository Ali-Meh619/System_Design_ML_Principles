# High Availability & Auto Scaling

> Designing systems that stay up during failures and scale automatically with demand. Every interviewer will ask "what happens if X fails?" — these patterns are your answers.

---

## High Availability Patterns

**High availability (HA)** means the system remains operational even when individual components fail. The goal is expressed as "nines" of uptime: 99.9% = 8.7 hours downtime/year; 99.99% = 52 minutes; 99.999% = 5 minutes. Each additional "nine" is roughly 10× harder and more expensive to achieve.

**HA Architecture Patterns**

| Pattern | How it works | RTO | RPO | Cost |
|---------|-------------|-----|-----|------|
| **Active-Passive (cold standby)** | Primary handles all traffic. Standby is off. On failure, manually start standby and point DNS to it. | Minutes to hours | Data since last backup | Low (standby is cheap) |
| **Active-Passive (warm standby)** | Primary handles traffic. Standby is running but not serving traffic. On failure, automatic DNS failover (minutes). | Minutes | Seconds (async replication lag) | Medium |
| **Active-Active (multi-region)** | Both regions serve traffic simultaneously. Load balancer distributes across them. On region failure, other region handles all traffic. | Seconds (automatic) | Near zero (sync replication) | 2× — must run at full capacity in both |

**RTO (Recovery Time Objective)** is how quickly you must restore service. **RPO (Recovery Point Objective)** is the maximum data loss acceptable. A bank account system might require RPO = 0 (no data loss ever). A social media feed might accept RPO = 1 minute (lose 1 minute of posts on failure). Your HA choice must match these requirements.

> ⚠️ **Single Points of Failure (SPOF) — Eliminate Them:** In every design, identify SPOFs — components where failure takes the whole system down. Common SPOFs: single database server (fix: primary + replicas + auto-failover), single load balancer (fix: redundant load balancers with floating IP), single availability zone (fix: deploy across AZs), single region (fix: multi-region active-active). Always ask: "What happens if this component fails?"

---

## Auto Scaling — Elastic Infrastructure

**Auto scaling** automatically adjusts the number of servers based on current demand. Too few servers = slow/unavailable service. Too many = wasted money. Modern cloud platforms (AWS, GCP, Azure) provide auto scaling as a first-class feature.

**Auto Scaling Strategies**

| Strategy | How it works | Best for |
|----------|-------------|---------|
| **Reactive scaling (target-based)** | Scale out when a metric exceeds threshold (e.g., CPU > 70%). Scale in when metric drops below lower threshold (e.g., CPU < 30%). Most common. | Unpredictable workloads. Good default. |
| **Scheduled scaling** | Pre-scale at known busy times. "Add 10 servers every weekday at 8AM, remove at 8PM." | Predictable patterns — business-hours traffic, overnight batch jobs. |
| **Predictive scaling** | ML model forecasts future demand from historical patterns. Pre-scales before demand arrives, not after. | Prevents cold start latency during scale-out events. AWS offers this built-in for EC2 ASGs. |
| **Queue-based scaling** | Scale worker count based on queue depth — more messages in queue → more workers. Scale to 0 when queue is empty. | Async worker fleets (video transcoding, email sending, data processing). |

> 💡 **Critical requirement for auto scaling: stateless services.** Auto scaling only works if your servers are **stateless** — they don't store session or user data locally. If user A's session is stored on Server 1, and Server 1 is terminated by the auto scaler, user A loses their session. Solution: externalize all state to Redis (sessions), S3 (uploads), or the database. A stateless service can be scaled in/out freely, started and stopped without concern.

---

## Multi-Region Architecture — Going Global

Serving users in multiple continents requires running your application in multiple geographic regions. The challenge: data must be consistent across regions, but cross-region replication adds latency (100–200ms round trip between US and Asia).

**Multi-Region Design Decision Framework:**

1. **Read-heavy global data (static content, media):** CDN with edge caching. No application servers needed at each region — CDN handles it.
2. **User-specific data (profiles, posts):** Route users to their "home region" (where their data lives) using GeoDNS. Cross-region reads are rare — user is almost always in their home region.
3. **Global shared data (inventory, prices):** Multi-region database with synchronous replication (Google Spanner, CockroachDB, DynamoDB Global Tables). Accept the cost — this is expensive but correct.
4. **Write conflicts:** If two regions can accept writes for the same data, define a conflict resolution strategy: last-write-wins (by timestamp), or application-defined merge logic.
5. **Failover:** GeoDNS or global load balancer (AWS Route 53 health checks, Cloudflare Load Balancing) redirects to another region when health checks fail.

---

## Database High Availability

**PostgreSQL HA with automatic failover:**
```
Primary (read + write)
    ↓ synchronous replication (RPO = 0)
Replica 1 (hot standby, read only)
    ↓ asynchronous replication  
Replica 2–5 (read replicas, may lag)

Patroni (HA manager) + etcd (consensus):
- Monitors primary health
- On primary failure: promotes Replica 1 to primary in ~30 seconds
- Updates service discovery (Consul/etcd) with new primary address
- Other replicas repoint to new primary
```

**Aurora (AWS) HA:**
- 6 copies of data across 3 AZs automatically
- Automatic failover to read replica in <30 seconds
- No need for Patroni/etcd — it's managed

---

## Kubernetes Auto Scaling

Three levels of auto scaling in Kubernetes:

| Level | What scales | Trigger |
|-------|-----------|---------|
| **HPA (Horizontal Pod Autoscaler)** | Number of pods | CPU, memory, custom metrics (QPS, queue depth) |
| **VPA (Vertical Pod Autoscaler)** | CPU/memory requests per pod | Historical usage patterns |
| **Cluster Autoscaler** | Number of nodes (EC2 instances) | Pods can't be scheduled (not enough resources) |

```yaml
# HPA example: scale 2-20 pods, target 70% CPU
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  scaleTargetRef:
    name: api-server
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        averageUtilization: 70
```

---

## Chaos Engineering

You can't know if your HA design works until it fails. **Chaos engineering** intentionally introduces failures in production to verify resilience:

| Tool | What it does |
|------|-------------|
| **Chaos Monkey** (Netflix) | Randomly terminates EC2 instances | 
| **Gremlin** | Inject CPU spikes, network latency, disk full |
| **Litmus** (Kubernetes) | Pod kill, node drain, network partition |

Netflix's principle: if you're afraid to run Chaos Monkey, you have an availability problem that will eventually cause a real outage.

---

## Interview Talking Points

- "Every component has a backup: active-passive DB with automatic failover, load balancer pair (floating IP), deployed across 3 AZs. Any single component can fail without user impact."
- "Services are stateless — all session data in Redis, uploads to S3. This means I can add or remove servers at any time without disruption."
- "Auto scaling on CPU: scale out at 70% CPU, scale in at 30%. I'd also add queue depth as a metric for the worker fleet — scale based on backlog size."
- "For our SLO of 99.99%, I need RTO < 1 minute. That means active-passive with Patroni auto-failover for the database — not cold standby which takes minutes of manual work."
