# Numbers Every Engineer Must Know

> Memorize these. They let you quickly estimate scale, compare technologies, and justify design decisions during the interview.

---

## Latency Numbers (Hierarchy of Speed)

The single most important intuition in distributed systems: the speed hierarchy. If your design requires something that is slow in this hierarchy to be in the critical path of a user-facing request, you have a performance problem.

| Value | Operation |
|-------|-----------|
| ~0.5 ns | CPU L1 cache access |
| ~7 ns | CPU L2 cache access |
| ~100 ns | RAM access (main memory) |
| ~0.1 ms | Redis / in-memory DB read |
| ~0.5–2 ms | SSD random read |
| ~5–10 ms | SSD sequential read (1 MB) |
| ~10–50 ms | Same-datacenter network round trip |
| ~100–150 ms | Cross-continent network round trip |
| ~20–50 ms | Database query (simple, indexed) |
| ~200–500 ms | LLM API call (small prompt) |

**Implication:** CPU cache is 200,000× faster than a database query. This is why caching is not optional in large systems — it's the architectural foundation.

---

## Scale Reference Points

| Value | Meaning |
|-------|---------|
| 1 KB | A typical short text tweet or JSON record |
| 100 KB | A profile photo thumbnail |
| 1 MB | A typical JPEG photo (compressed) |
| 5–50 MB | A short video clip (compressed) |
| ~86K | Seconds in a day |
| ~1 billion | DAU of WhatsApp / Facebook |
| ~500M | Tweets per day (Twitter 2023) |
| ~500 hours | Video uploaded to YouTube per minute |

---

## Quick Estimation Formula

```
QPS = DAU × actions_per_day / 86,400 seconds

Example: Twitter
- 300M DAU × 50 actions/day / 86,400 = ~175,000 QPS (reads)
- Write QPS = 300M × 1 tweet/day / 86,400 = ~3,500 QPS (writes)
- → Read/Write ratio = 50:1 → heavy read system, optimize for reads

Storage per year:
- 3,500 writes/second × 1 KB/tweet × 86,400 × 365 = ~110 TB/year

Bandwidth:
- 175,000 QPS × 1 KB/response = 175 MB/s = 1.4 Gbps → need CDN
```

> 💡 **Rule of Thumb:**
> - **Read-heavy** (social media, video streaming): optimize with caching + CDN + read replicas.
> - **Write-heavy** (sensor data, logging): optimize with async queues + Cassandra/time-series DB + batch processing.

---

## Data Size Reference

| Unit | Bytes | Common Example |
|------|-------|----------------|
| 1 Byte | 1 B | One character |
| 1 Kilobyte | 1,024 B | Short tweet, small JSON record |
| 1 Megabyte | 1,048,576 B | JPEG photo, 1 min of audio |
| 1 Gigabyte | ~10⁹ B | HD movie clip, large DB backup |
| 1 Terabyte | ~10¹² B | Entire database, large data warehouse table |
| 1 Petabyte | ~10¹⁵ B | Full Facebook photo archive |

---

## Throughput Reference

| QPS | System Type | Example |
|-----|-------------|---------|
| < 100 | Small app | Startup, internal tool |
| 100–1K | Medium app | Growing SaaS product |
| 1K–10K | Large app | Popular consumer app |
| 10K–100K | At scale | Twitter, Spotify |
| 100K–1M | Hyperscale | Google, Facebook core services |
| 1M+ | Extreme scale | DNS root servers, CDN edges |

---

## Availability & SLA Reference

| Availability | Downtime/year | Downtime/month | Architecture needed |
|-------------|---------------|----------------|---------------------|
| 99% | 3.65 days | 7.3 hours | Single server |
| 99.9% ("three nines") | 8.76 hours | 43.8 min | Load balanced pair |
| 99.99% ("four nines") | 52.6 min | 4.38 min | Multi-AZ active-passive |
| 99.999% ("five nines") | 5.26 min | 26.3 sec | Multi-region active-active |

---

## Back-of-Envelope Estimation Cheat Sheet

**Common scenarios:**

```
URL Shortener (TinyURL):
- 100M URLs total, 1KB per URL = 100GB storage
- 100:1 read/write → 1000 writes/day = ~0.01 QPS writes, 1 QPS reads
- With 500M daily redirects: ~6000 QPS reads → need Redis cache

Photo Storage (Instagram):
- 100M DAU, 2 photos/day/user = 200M photos/day
- Each photo 1MB (stored in 3 sizes) = ~600TB/day raw
- After compression: ~200TB/day → ~73PB/year → need CDN + object storage

Video Platform (YouTube):
- 500 hours video uploaded per minute = 30,000 hours/min
- At 1GB/hour = 30TB/min = 43PB/day (raw storage before encoding)
- CDN traffic: 1B views/day × 500MB avg = 500PB/day served
```
