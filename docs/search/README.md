# 🔍 Search & Analytics

> Search is a system design category all on its own. Inverted indexes, geospatial queries, and streaming Top-K — these come up constantly in interviews for companies like Google, Uber, Twitter, and Meta.

---

## Topics in This Category

| # | Topic | Difficulty | What You'll Learn |
|---|-------|-----------|------------------|
| 1 | [Search & Typeahead Systems](search-and-typeahead.md) | 🟡 Mid | Inverted index, autocomplete, relevance ranking |
| 2 | [Stream Processing & Top-K](stream-processing.md) | 🔴 Advanced | Count-Min Sketch, Lambda/Kappa, windowing |
| 3 | [Geo & Location Systems](geo-systems.md) | 🔴 Advanced | Geohash, quadtree, Uber driver matching |

---

## Full-Text Search Architecture

```
Document Ingestion:
  Raw text → [Tokenizer] → [Stemmer/Normalizer] → [Inverted Index]

Query Processing:
  Query → [Tokenize + Normalize] → [Index Lookup] → [Ranking] → Results
```

**Inverted Index:**
```
"fast database" appears in docs 3, 7, 12
"database query" appears in docs 1, 7, 9

Inverted index:
  "fast"     → [3, 7, 12]
  "database" → [1, 3, 7, 9, 12]
  "query"    → [1, 7, 9]
```

To find "fast database": intersection of [3,7,12] and [1,3,7,9,12] = [3, 7, 12] → rank by TF-IDF.

---

## Typeahead Architecture

**Two approaches:**

| Approach | Architecture | Scale | Staleness |
|----------|-------------|-------|-----------|
| **Trie** | In-memory prefix tree | Medium (single machine) | Real-time |
| **Sharded prefix index** | Distribute trie by first 2 chars | Massive scale | Near real-time |

**Production pattern (Google-style):**
1. Offline: aggregate search logs → compute top-K queries per prefix
2. Store in key-value store: `prefix → [top 5 suggestions]`
3. Online: `GET suggestions:{"sea"}` → instant O(1) lookup

---

## Geospatial Quick Reference

| Technique | What it does | Use case |
|-----------|-------------|---------|
| **Geohash** | Encodes (lat, lng) as a string; nearby places share prefix | "Find restaurants near me" |
| **Quadtree** | Recursively divides area into 4 quadrants | Dynamic density (sparse suburbs, dense cities) |
| **R-tree** | Bounding box spatial index | Polygon search, GIS |
| **S2 (Google)** | Sphere-based cell decomposition | Google Maps, accurate global coverage |

**Geohash precision:**
```
Length 4: ~40 km × 20 km
Length 6: ~1.2 km × 0.6 km  (good for "nearby")
Length 8: ~38 m × 19 m      (street level)
```

**Nearby search with geohash:**
```sql
-- Find all users within ~600m radius
-- User is at geohash "9q8yy"
-- Search current cell + 8 neighbors
WHERE geohash LIKE '9q8yy%'
  OR geohash LIKE '9q8yx%'  -- neighbor
  OR geohash LIKE '9q8yz%'  -- neighbor
  ... (8 neighbors)
```

---

## Stream Processing Algorithms

| Problem | Algorithm | Space | Error |
|---------|----------|-------|-------|
| Top-K frequent items | Count-Min Sketch + min-heap | O(K + ε) | Bounded error |
| Unique user count | HyperLogLog | O(log log N) | ~1% error |
| Has item been seen? | Bloom Filter | O(n) | False positive only |
| Trending topics | Misra-Gries | O(K) | Exact top-K heavy hitters |

---

## Practice Questions

1. Design "Search Autocomplete" for Google: What happens when a user types "sys"? How are suggestions computed? How do you handle millions of users typing simultaneously?

2. Uber has 1M active drivers globally. A user requests a ride at (37.77, -122.41). How do you find the 10 nearest available drivers in under 100ms?

3. Twitter wants to show "Trending Topics" — the top-10 hashtags in the last 1 hour globally. 500K tweets/minute are posted. How do you compute this in real-time?

4. You have a Kafka stream of click events. You need to count unique users per hour. With 100M users, storing all user IDs is impractical. What data structure do you use?
