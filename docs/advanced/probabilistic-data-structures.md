# Probabilistic Data Structures

> Algorithms that trade accuracy for massive memory savings. Essential for "Big Data" problems (counting billions of unique items).

---

## Bloom Filter — "Have I seen this before?"

A **Bloom Filter** is a space-efficient set that tells you if an element is **definitely not** in the set or **probably** in the set. It never gives false negatives (if it says "no", it's definitely no). It allows false positives (small chance it says "yes" when it's actually no).

**How it works:**
```
Bloom Filter internals:
- A bit array of m bits (all initialized to 0)
- k hash functions (each maps an item to a position in the array)

Insert "apple":
  hash1("apple") → position 3 → set bit[3] = 1
  hash2("apple") → position 7 → set bit[7] = 1
  hash3("apple") → position 12 → set bit[12] = 1

Query "apple":
  hash1("apple") → bit[3] = 1 ✓
  hash2("apple") → bit[7] = 1 ✓
  hash3("apple") → bit[12] = 1 ✓
  → "Probably in set" (could be false positive)

Query "banana":
  hash1("banana") → bit[5] = 0 ✗
  → "Definitely not in set" (never a false negative)
```

**Memory efficiency:**
- HashSet with 1 billion URLs: ~40GB RAM (storing URL strings)
- Bloom Filter with 1 billion URLs (1% false positive rate): ~1.2GB RAM
- **33× memory reduction**

**Use Cases**

| Scenario | Why use Bloom Filter? |
|----------|----------------------|
| **Cache filtering** | Don't cache items accessed only once ("one-hit wonders"). Use a Bloom Filter to track "seen once". Only cache if already in filter (seen twice). Saves cache space. |
| **Database query optimization** | Before checking disk/SSTable for a key, check in-memory Bloom Filter. If "no", skip disk read. (Used in Cassandra/PostgreSQL). |
| **Malicious URL check** | Browser stores Bloom Filter of all known bad URLs. If "probably yes", ask server for confirmation. If "no", safe to browse. Privacy-preserving. |
| **Crawling loop detection** | Track visited URLs to avoid re-crawling. 1 billion URLs in Bloom Filter = ~1GB RAM. Hash map = ~100GB. |

---

## HyperLogLog — Counting Unique Items

How do you count unique visitors (cardinality) for a website with 1 billion daily events? Storing all user IDs in a set takes terabytes. **HyperLogLog (HLL)** estimates cardinality with typical error < 1% using only ~12KB of memory, regardless of how many items you add.

It works by hashing elements and observing the maximum number of leading zeros in the hash. Rare events (many leading zeros) imply a larger dataset. Redis has `PFADD` and `PFCOUNT` commands implementing HLL.

**Memory comparison:**

| Items | HashSet | HyperLogLog | Memory saved |
|-------|---------|-------------|-------------|
| 1 million | ~40MB | 12KB | 3,000× |
| 1 billion | ~40GB | 12KB | 3,000,000× |
| 1 trillion | ~40TB | 12KB | 3,000,000,000× |

```
Redis HyperLogLog:
PFADD unique_visitors:2024-01-15 user_123
PFADD unique_visitors:2024-01-15 user_456
PFADD unique_visitors:2024-01-15 user_789
PFCOUNT unique_visitors:2024-01-15
→ 3 (or approximate value with <1% error)

Merge multiple HLLs:
PFMERGE weekly_visitors 
  unique_visitors:2024-01-15 
  unique_visitors:2024-01-16 
  unique_visitors:2024-01-17
PFCOUNT weekly_visitors → deduplicated weekly unique count
```

---

## Count-Min Sketch — Frequency Counting

Used to find "heavy hitters" (top-k) in a stream without storing every item. A 2D array of counters + multiple hash functions. On arrival, increment counters. On query, take the minimum of the hashed counters. Over-estimates frequency but never under-estimates. Used for "Trending Topics" or "DDoS detection" (frequent IPs).

**How it works:**
```
Count-Min Sketch (4 rows × 8 columns = 32 counters):

Row 1 (hash1): [0, 0, 0, 5, 0, 3, 0, 2]
Row 2 (hash2): [0, 5, 0, 0, 2, 0, 0, 3]
Row 3 (hash3): [3, 0, 0, 2, 0, 5, 0, 0]
Row 4 (hash4): [0, 0, 5, 0, 3, 0, 2, 0]

Query count("python"):
  hash1("python") → column 3 → value 5
  hash2("python") → column 1 → value 5
  hash3("python") → column 5 → value 5
  hash4("python") → column 2 → value 5
  
  Estimate = min(5, 5, 5, 5) = 5 ✓

Error bound: actual count ≤ estimate ≤ actual count + (total_count / width)
```

**Memory vs exact counting:**

| Items | Exact HashMap | Count-Min Sketch | Trade-off |
|-------|-------------|-----------------|-----------|
| 1M hashtags | ~40MB | ~10KB | 4,000× smaller, ~5% error |
| 100M hashtags | ~4GB | ~10KB | 400,000× smaller, ~0.005% error |

---

## Cuckoo Filter — Better Bloom Filter

An improvement over Bloom Filter:

| Feature | Bloom Filter | Cuckoo Filter |
|---------|-------------|--------------|
| False positive rate | Similar | Similar |
| Deletion support | ❌ No | ✅ Yes |
| Space efficiency | Slightly better | Competitive |
| Lookup performance | O(k) hash operations | O(1) — 2 possible positions |

Cuckoo Filters are preferred when you need to delete items (Bloom Filters don't support deletion).

---

## MinHash — Estimating Set Similarity

**MinHash** estimates Jaccard similarity (how similar are two sets?) without comparing all elements. Used by:
- **Plagiarism detection** (how similar are two documents?)
- **Deduplication** (have I seen this near-duplicate image before?)
- **Recommendation systems** (find users with similar taste)

```
Jaccard similarity = |A ∩ B| / |A ∪ B|
(intersection size / union size)

Problem: Computing exact Jaccard similarity for 1M document pairs is O(N×M)

MinHash approximation:
1. Hash each element of set to an integer
2. MinHash(set) = minimum hash value across all elements
3. P(MinHash(A) == MinHash(B)) ≈ Jaccard(A, B)
4. Use k MinHash functions → k-dimensional signature vector
5. Similarity(A, B) ≈ (# matching positions) / k

Memory: O(k) per document instead of O(|document|)
```

---

## Practical Guide: When to Use Each

| Problem | Structure | Trade-off |
|---------|-----------|-----------|
| "Have I seen URL X?" (membership) | Bloom Filter | 1% false positive OK. Zero false negatives. 1GB vs 40GB. |
| "How many unique users today?" (cardinality) | HyperLogLog | <1% error. 12KB vs 40GB. |
| "What's trending? (top-K frequency)" | Count-Min Sketch | ~5% overcount. Kilobytes vs gigabytes. |
| "Are documents A and B similar?" (similarity) | MinHash | Approximate. Sublinear comparison. |
| "Is IP X in our blocklist?" (with deletions) | Cuckoo Filter | Supports deletion. Similar to Bloom Filter otherwise. |

---

## Interview Talking Points

- "For unique visitor counting: HyperLogLog in Redis. `PFADD` each user_id, `PFCOUNT` at end of day. 12KB for 1 billion users, <1% error. Way better than a 40GB HashSet."
- "For trending hashtags: Count-Min Sketch in Flink stream processor. O(1) updates, O(1) queries, constant memory. Then top-K extraction using min-heap."
- "Cassandra uses Bloom Filters internally: before reading an SSTable from disk, it checks the Bloom Filter. If 'definitely not here', skip the disk read. This saves most random IO."
- "Chrome's Safe Browsing uses Bloom Filter: browser checks local filter first (no network call). Only contacts Google's servers on a probable match — privacy-preserving and fast."
