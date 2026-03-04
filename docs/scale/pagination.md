# API Pagination

> Every API that returns lists of data needs pagination. There are three strategies — each with critical trade-offs for performance and correctness.

---

## Why Pagination Matters

Without pagination, "get all users" returns all 100 million users in one response — crashing the database, saturating the network, and timing out the client. Pagination limits response sizes and enables clients to fetch data incrementally. The choice of pagination strategy affects API performance, correctness under mutations, and client complexity.

---

## The Three Pagination Strategies

**Pagination Strategy Comparison**

| Strategy | API example | How it works | Pros | Cons |
|----------|------------|-------------|------|------|
| **Offset-based** | `GET /posts?offset=20&limit=10` | Skip first N rows, return next M. SQL: `SELECT ... LIMIT 10 OFFSET 20`. | Simple. Random access to any page. Easy to implement. | **Slow on large offsets** (DB scans 20 rows just to skip them). **Page drift**: if new items are inserted while paginating, you see duplicates or skip items. |
| **Cursor-based (Keyset)** | `GET /posts?after=post_id_xyz&limit=10` | Use last item's ID as cursor. SQL: `SELECT ... WHERE id > last_id ORDER BY id LIMIT 10`. Cursor is opaque to client (often base64 encoded). | **Fast at any depth** — uses index. No page drift — inserts don't affect pagination. The correct choice for infinite scroll. | Cannot jump to arbitrary pages (no "go to page 50"). Must paginate sequentially. |
| **Time-based cursor** | `GET /posts?before=2024-01-15T10:00:00Z&limit=10` | Use timestamp as cursor. Good for chronologically ordered feeds. | Natural for time-series data. Self-explanatory. | Ties caused by same-timestamp events. Must add secondary sort key (timestamp, id) to avoid ties. |

> 💡 **The rule: use cursor-based for production.** Offset pagination is only acceptable for: small datasets, admin UIs where page jumping matters, and static data. For anything with high volume, real-time updates, or infinite scroll (Twitter, Instagram), use cursor-based. The cursor should be opaque to clients — encode the underlying sort value as base64 so you can change the internal sort key without breaking clients.

---

## Cursor Pagination Implementation

```python
# First page
SELECT id, title, created_at FROM posts
ORDER BY created_at DESC, id DESC  -- secondary sort for ties
LIMIT 10;

# Next page (cursor = last item from previous page)
SELECT id, title, created_at FROM posts
WHERE (created_at, id) < (cursor_created_at, cursor_id)  -- keyset condition
ORDER BY created_at DESC, id DESC
LIMIT 10;

# Encode cursor for clients:
import base64, json
cursor = base64.b64encode(json.dumps({
    "created_at": "2024-01-15T10:00:00Z",
    "id": "post_xyz"
}).encode()).decode()
# Return in response: {"data": [...], "next_cursor": "eyJjcmVhdG..."}
# Client sends: GET /posts?cursor=eyJjcmVhdG...&limit=10
```

---

## Why Offset is Slow at Scale

```sql
-- Offset pagination: page 100,000 (skipping 1M rows)
SELECT * FROM posts 
ORDER BY created_at DESC 
LIMIT 10 OFFSET 1000000;
-- Database must scan and discard 1,000,000 rows!
-- Gets SLOWER the further you paginate
-- On 100M row table: page 10 = fast, page 10,000 = very slow

-- Cursor pagination: equivalent query
SELECT * FROM posts
WHERE created_at < '2024-01-01' AND id < 'post_123'
ORDER BY created_at DESC, id DESC
LIMIT 10;
-- Uses index to jump directly to the right position
-- Same speed whether you're on page 1 or page 1,000,000!
```

---

## Page Drift Problem (Why Offset Breaks)

```
Initial state: Posts [A, B, C, D, E, F, G, H, I, J]

Page 1 (offset=0): [A, B, C, D, E]
User is on page 1. Meanwhile, new post X is inserted at the top.

New state: Posts [X, A, B, C, D, E, F, G, H, I, J]

Page 2 (offset=5): [E, F, G, H, I]
                    ↑ E was already on page 1!
                    → Duplicate item shown to user

With cursor pagination:
Page 2 uses cursor = E's ID → fetches posts after E
→ Correctly returns [F, G, H, I, J]
→ No duplicates, no skipped items
```

---

## GraphQL Pagination (Relay Spec)

The Relay Connections spec is the standard for GraphQL pagination:

```graphql
query {
  posts(first: 10, after: "cursor_xyz") {
    edges {
      node {
        id
        title
        createdAt
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
```

- `edges` wraps each item with its cursor
- `pageInfo` tells clients if more pages exist
- `first`/`after` for forward pagination; `last`/`before` for backward

---

## Infinite Scroll vs Paginated UI

| UI Pattern | Best Pagination | Why |
|-----------|----------------|-----|
| Infinite scroll (Twitter, Instagram, news feed) | Cursor-based | Sequential, doesn't need random page access |
| Classic numbered pages (Google search results) | Offset-based | Users expect "go to page 5" functionality |
| Admin table with search | Offset-based | Small dataset, need to jump to specific pages |
| Data export/streaming | Cursor-based | Must handle millions of rows without memory explosion |
| API for developers | Cursor-based | Correctness > simplicity for programmatic consumers |

---

## Response Format Best Practices

```json
// Cursor-based response
{
  "data": [
    {"id": "post_abc", "title": "Hello World", "created_at": "2024-01-15"},
    {"id": "post_def", "title": "Second Post", "created_at": "2024-01-14"}
  ],
  "pagination": {
    "next_cursor": "eyJpZCI6InBvc3RfZGVmIiwiY3JlYXRlZF9hdCI6IjIwMjQtMDEtMTQifQ==",
    "has_more": true,
    "total_count": null  // Don't return total_count if it requires expensive COUNT(*)
  }
}

// Offset-based response (acceptable for small datasets)
{
  "data": [...],
  "pagination": {
    "page": 2,
    "per_page": 10,
    "total_pages": 150,
    "total_count": 1493
  }
}
```

> ⚠️ **Avoid returning `total_count` with cursor pagination.** `COUNT(*)` on large tables is expensive. If clients need a count, provide an approximate count (Postgres `pg_class.reltuples`) or make it a separate endpoint that clients call only when needed.

---

## Interview Talking Points

- "I'd use cursor-based pagination for the news feed — it's O(1) regardless of depth, and inserts don't cause page drift which would show duplicates to users scrolling."
- "The cursor is opaque — base64 encoded JSON. Clients don't know it contains `{created_at, id}`. This lets us change the sort key later without breaking existing clients."
- "For offset pagination on the admin user list: it's a small dataset (≤100K users), admin users expect 'go to page 50', and data changes infrequently — page drift is acceptable."
- "Composite sort key on (created_at DESC, id DESC): handles ties when multiple posts have the same timestamp, and the keyset condition works correctly for both."
