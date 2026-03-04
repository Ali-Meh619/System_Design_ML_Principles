# Search & Typeahead Systems

> Full-text search (Google, Yelp), typeahead suggestions (search bar autocomplete), and filtered faceted search (Amazon product search).

---

## How Full-Text Search Works: Inverted Index

A regular database index lets you find rows by a specific column value ("find user WHERE email = 'x@y.com'"). But you can't efficiently search within text ("find all tweets CONTAINING the word 'python'") because the database would scan every row. The solution is an **inverted index**: for every unique word in your corpus, store a list of document IDs that contain it.

```
Documents:
  doc_1: "python is great for machine learning"
  doc_2: "machine learning requires python skills"
  doc_3: "java is great for enterprise systems"

Inverted Index:
  "python"   → [doc_1, doc_2]
  "great"    → [doc_1, doc_3]
  "machine"  → [doc_1, doc_2]
  "learning" → [doc_1, doc_2]

Query: "python machine learning"
  Lookup "python" → [doc_1, doc_2]
  Lookup "machine" → [doc_1, doc_2]  
  Lookup "learning" → [doc_1, doc_2]
  Intersection → [doc_1, doc_2], ranked by TF-IDF relevance score
```

**TF-IDF** (Term Frequency – Inverse Document Frequency) scores relevance: a word appearing often in a document (high TF) but rarely in the corpus (high IDF) is a strong signal. "The" appears everywhere (low IDF) so it's not a good relevance signal. "Eigenvalue" is rare in the corpus but frequent in your document — very relevant.

---

## Text Processing Pipeline

Before indexing, text goes through a processing pipeline:

1. **Tokenization:** Split text into individual tokens (words, punctuation). "Hello World!" → ["Hello", "World"]
2. **Lowercasing:** "Python" = "python" = "PYTHON"
3. **Stop word removal:** Remove common words with no search value ("the", "is", "a")
4. **Stemming/Lemmatization:** Reduce to base form ("running" → "run", "better" → "good")
5. **Synonym expansion:** "car" → also index "automobile", "vehicle"
6. **N-gram indexing:** Index word pairs/triples for phrase matching

---

## Typeahead / Autocomplete Architecture

Typeahead provides suggestions as you type. The challenge: respond in under 50ms for every keystroke. There are two common approaches.

**Typeahead Architecture Options**

| Approach | How it works | Best for |
|----------|-------------|---------|
| **Trie in memory** | Tree where each node is a character. Paths from root to nodes form prefixes. Each node stores top-K completions for that prefix (pre-computed). Lookup is O(prefix_length). | Small to medium corpora. Stored in Redis or in-memory on dedicated servers. Used by Twitter, Google for short-term trends. |
| **Redis Sorted Sets** | Store all strings with scores (e.g., search frequency). Use ZRANGEBYLEX to find strings in the range [prefix, prefix\xFF] (all strings starting with prefix). | Simple implementation. Fast for moderately sized suggestion sets. |
| **Elasticsearch prefix query** | Use Elasticsearch's prefix/edge-ngram analyzer to index all prefixes of each term. Query as regular full-text search. | When suggestions need full-text relevance scoring, not just prefix matching. |

---

## Typeahead System Architecture

**End-to-end architecture for any "Design Typeahead" question:**

1. **Data collection layer:** Log all user searches → Kafka stream → Spark batch job counts frequency → hourly snapshot to Redis
2. **Trie building:** Batch job reads top 10,000 searched terms from Redis → builds weighted trie → stores serialized trie in S3 → distributed to typeahead servers on refresh
3. **Serving layer:** Dedicated typeahead service (stateless, horizontally scalable). Loads trie into memory on startup. CDN caches popular prefix results aggressively.
4. **Filtering:** Filter layer removes toxic/banned terms before returning suggestions
5. **Personalization:** Blend global top-K with user's personal recent searches (stored in Redis per user)

---

## Elasticsearch Deep Dive

Elasticsearch is the standard for production full-text search:

**Index configuration:**
```json
{
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "english"
      },
      "tags": {
        "type": "keyword"
      },
      "price": {
        "type": "float"
      },
      "created_at": {
        "type": "date"
      }
    }
  }
}
```

**Query types:**

| Query Type | Use Case | Example |
|-----------|---------|---------|
| `match` | Full-text search with tokenization | Search product descriptions |
| `term` | Exact match (no analysis) | Filter by status='active' |
| `range` | Numeric/date range | price: [10, 100] |
| `prefix` | Prefix matching | Typeahead: "app" → "apple" |
| `fuzzy` | Typo-tolerant matching | "pytohn" → "python" (1 edit distance) |
| `bool` | Combine multiple queries | must + should + filter |

**Primary DB → Elasticsearch Sync Pattern:**

```
Write path: 
  User creates post → PostgreSQL (primary)
  CDC (Debezium) → Kafka → Elasticsearch sync service → Elasticsearch

Read path:
  User searches "machine learning" 
  → Elasticsearch returns [doc_id_1, doc_id_3, doc_id_7]
  → Batch fetch full records from PostgreSQL/Redis
  → Return merged results
```

> ⚠️ **Never use Elasticsearch as primary DB.** It is eventually consistent, doesn't support transactions, and can lose data. Use it only as a secondary search index.

---

## Faceted Search (Amazon-style)

Faceted search allows filtering by multiple dimensions simultaneously:

```
Search: "laptop"
Filter by: brand (Apple, Dell), price range ($500-$1000), rating (4+)
Sort by: relevance, price, rating

Elasticsearch:
GET /products/_search
{
  "query": {
    "bool": {
      "must": [{ "match": {"description": "laptop"} }],
      "filter": [
        { "term": {"brand": "Apple"} },
        { "range": {"price": {"gte": 500, "lte": 1000}} },
        { "range": {"rating": {"gte": 4}} }
      ]
    }
  },
  "aggs": {
    "by_brand": { "terms": {"field": "brand"} },
    "price_ranges": { "range": {"field": "price", "ranges": [...]} }
  }
}
```

The `aggs` (aggregations) section computes the filter counts ("Apple (142)", "Dell (89)") in the same query.

---

## Search Relevance Tuning

| Signal | How it improves relevance |
|--------|--------------------------|
| **TF-IDF** | Word frequency in document vs corpus | 
| **BM25** | Improved TF-IDF with field length normalization (default in Elasticsearch) |
| **Click-through rate** | Terms users click on after searching → boost those results |
| **Freshness boost** | Recent content boosted (especially for news) |
| **Personalization** | User's history, location, preferences |
| **Semantic search** | Embedding-based similarity (captures "car" matches "automobile") |

---

## Interview Talking Points

- "I'd use Elasticsearch for product search. Primary data in PostgreSQL. Debezium CDC syncs changes to Elasticsearch in near-real-time. Users search ES, get IDs, fetch full records from PostgreSQL."
- "For typeahead: a Trie data structure in Redis. Batch job rebuilds it nightly from aggregated search logs. Serving is O(prefix_length) — under 1ms. CDN caches results for common prefixes like 'a', 'ap'."
- "The ES `bool` query: `must` for the text search, `filter` for exact facets (brand, price). Filters are cached — dramatically faster than must clauses."
- "Fuzzy matching (`fuzziness: AUTO`) handles typos. Edge-ngram analyzer indexes 'machin', 'machine', 'machine le' — typeahead without requiring exact prefix."
