# The System Design Interview Framework

> The universal 4-step approach that applies to every single question — from URL Shortener to YouTube.

---

## Why Structure Matters

A system design interview is not a test of memorization. It is a test of **structured thinking under ambiguity**. The interviewer wants to see how you break down a vague problem, make justified trade-offs, and communicate complex ideas clearly. Engineers who dive into solutions immediately without clarifying requirements almost always lose marks — not because their solution was wrong, but because they solved the wrong problem. Follow the 4-step framework below for every single question, regardless of what it is.

---

## Step 1 — Clarify Requirements (5–8 minutes)

Never assume. Ask questions to understand what you're actually building. Interviewers often intentionally leave the problem vague to see if you'll ask. The output of this phase is a written list of **functional requirements** (what the system must do) and **non-functional requirements** (how well it must do it).

**Universal Clarifying Questions (ask for ANY problem)**

1. **Scale:** How many users? Daily Active Users (DAU)? Requests per second?
2. **Read vs Write ratio:** Is this mostly reading data or writing data? (e.g., Twitter: 100:1 read-heavy; sensor logging: write-heavy)
3. **Latency requirements:** What's the acceptable response time? Real-time (under 100ms)? Near-real-time (under 1s)? Batch (minutes)?
4. **Consistency vs Availability:** Is it okay if users briefly see stale data? Or must it always be exactly correct?
5. **Geographic scope:** Single region or global? Are users worldwide?
6. **Data size:** How large is a typical record? How much total data do we expect over 5 years?
7. **Special constraints:** GDPR/data privacy? Content moderation? Multi-tenant (serving many different companies)?

---

## Step 2 — Estimate Scale (5 minutes)

**Back-of-envelope estimation** tells you which problems you actually need to solve. A system handling 100 requests/second needs a completely different architecture from one handling 100,000/second. Estimation also signals to the interviewer that you understand real-world constraints. Always estimate: **QPS (queries per second)**, **storage needed per year**, and **bandwidth**. Round aggressively — precision is not the point.

> ⚠️ **Common Mistake:** Skipping estimation and going straight to design. Without knowing scale, you can't justify any architectural decision. "We need a cache" — why? How much data? What hit rate? Estimation makes every design choice defensible.

---

## Step 3 — High-Level Design (10 minutes)

Draw the big picture: clients, load balancer, API servers, databases, caches, queues. At this stage, don't over-engineer. Pick the simplest design that meets the requirements. Explain your major components and why they're there. This gives both you and the interviewer a shared map of the system before you drill into details.

> 💡 **Pro tip:** State your assumptions explicitly: "I'll assume users connect via HTTPS. I'll use a single-region setup first and then we can discuss multi-region if time permits." This shows you're in control of the scope.

---

## Step 4 — Deep Dive & Trade-offs (15 minutes)

Now zoom into the hardest parts. The interviewer will guide you toward specific areas of interest. Common deep-dive topics: **database schema design**, **scaling bottlenecks**, **failure handling**, **data consistency**. For every decision, explain the trade-off — "I chose Cassandra here instead of MySQL because our write volume is 50,000/second and Cassandra handles high write throughput better at the cost of eventual consistency, which is acceptable here." Always say "at the cost of" — that's the trade-off that shows mastery.

**The 3 Universal Trade-offs You Will Always Face**

| Tension | Option A | Option B | Example |
|---------|----------|----------|---------|
| **Consistency vs Availability** | Always show correct data (may be slow or unavailable during failure) | Always respond fast (may show slightly stale data) | Bank balance vs. Twitter like count |
| **Latency vs Throughput** | Optimize for single-request speed | Optimize for total requests/second | Real-time bidding vs. batch analytics |
| **Simplicity vs Flexibility** | Simple design, harder to change later | Complex design, more adaptable | Monolith vs. microservices |

---

## Interview Closing Script

End every interview with a summary of your design:

> "This design is optimized for **[primary constraint]**. The major trade-off is **[what we sacrificed]** for **[what we gained]**. The biggest risk is **[failure mode]**, which we mitigate by **[mitigation]**. To scale 10×, I would **[next scaling step]**."

---

## Common Failure Modes

| Mistake | Why it loses marks | Fix |
|---------|-------------------|-----|
| Jumping straight to design | No shared understanding of requirements | Always spend 5–8 min on clarification |
| No estimation | Can't justify any design decisions | Estimate QPS, storage, bandwidth before designing |
| Over-engineering | Complexity without justification | Start simple, add complexity only when required |
| Single points of failure | Naive design crashes under load | Always ask "what happens if X fails?" |
| No trade-off discussion | Shows shallow thinking | Every decision should have "at the cost of" |
