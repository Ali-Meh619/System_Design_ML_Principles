# API Pagination

When a query matches millions of records, you can't return them all at once. Pagination breaks results into pages — but the implementation choice drastically affects correctness and performance at scale.

---

## Why Pagination Matters

- **Memory:** Returning 10M rows requires gigabytes of memory on both server and client.
- **Latency:** Database must read and transmit all rows before the client sees anything.
- **User experience:** Users don't need 10M rows. They need the next 20.

The challenge: choosing the right pagination strategy affects correctness under concurrent writes and performance at high page numbers.

---

## The Three Pagination Strategies

### Strategy 1: Offset Pagination

```sql
SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET 200;
```

**How it works:** Skip the first N rows, return the next `LIMIT` rows.

**The problems:**
1. **Performance degrades with page depth:** `OFFSET 1000000` requires the database to read and discard 1 million rows. At page 50,000, you're scanning most of the table.
2. **Data drift:** If a new row is inserted between page 1 and page 2 requests, every row shifts — page 2 will show a row already seen on page 1 (duplication) or skip a row (data loss).

**When to use:** Admin UIs with small datasets, scenarios where page drift doesn't matter, reports over static data. **Never use for high-scale user-facing feeds.**

### Strategy 2: Cursor-Based Pagination

```sql
-- First page
SELECT * FROM posts ORDER BY created_at DESC LIMIT 20;

-- Next page (cursor = created_at of last item from previous page)
SELECT * FROM posts 
WHERE created_at < '2024-01-15T10:30:00Z'
ORDER BY created_at DESC LIMIT 20;
```

**How it works:** The "cursor" is a value (typically a timestamp or ID) that marks where you are in the result set. Each page request uses the cursor to start from exactly where the last page ended.

**Advantages:**
- **O(log N) performance at any depth** — uses a database index efficiently. Page 50,000 is as fast as page 1.
- **Stable under inserts/deletes** — new rows don't shift the cursor position.

**The cursor can be opaque to the client:**
```json
{
  "data": [...],
  "next_cursor": "eyJpZCI6MTIzNCwiY3JlYXRlZF9hdCI6IjIwMjQtMDEtMTUifQ=="
}
```
The base64 cursor encodes the last item's primary key + timestamp. The client passes it back; the server decodes and uses it for the next query.

**Limitations:**
- Can only paginate forward (or backward if you implement reverse cursors).
- Cannot jump to "page 500" directly.
- Cursor must be based on a unique, ordered column (or a composite of columns that is unique).

### Strategy 3: Keyset Pagination (Most Correct at Scale)

A refinement of cursor pagination that uses the actual primary key:

```sql
-- First page
SELECT * FROM posts WHERE user_id = 123 
ORDER BY id DESC LIMIT 20;

-- Next page (after seeing ID = 456 as the last item)
SELECT * FROM posts 
WHERE user_id = 123 AND id < 456
ORDER BY id DESC LIMIT 20;
```

**Why keyset over cursor?**
- Primary keys are guaranteed unique and indexed.
- No tie-breaking needed (timestamps can have millisecond collisions).
- Index seek directly to `id < 456` → O(log N) regardless of depth.

**Handle multi-column sort:**
```sql
-- Sort by likes DESC, then id DESC (for tie-breaking)
WHERE (likes, id) < (last_likes, last_id)
ORDER BY likes DESC, id DESC
LIMIT 20
```

---

## Comparison Table

| Strategy | Performance | Consistency under inserts | Deep pagination | Jump to page N |
|----------|-------------|--------------------------|-----------------|---------------|
| Offset | O(N) — degrades | ❌ Data drift | ❌ Very slow | ✅ Yes |
| Cursor | O(log N) | ✅ Stable | ✅ Fast | ❌ No |
| Keyset | O(log N) | ✅ Stable | ✅ Fast | ❌ No |

---

## Returning Pagination Metadata

Include navigation in your API response:

```json
{
  "data": [
    { "id": 456, "title": "..." },
    ...
  ],
  "pagination": {
    "has_next_page": true,
    "next_cursor": "eyJpZCI6NDM1fQ==",
    "has_prev_page": true,
    "prev_cursor": "eyJpZCI6NDc3fQ==",
    "total_count": null
  }
}
```

> Avoid returning `total_count` unless necessary — it requires a full `COUNT(*)` query which is expensive on large tables. "Infinite scroll" UIs don't need a total count.

---

## Interview Answer Sketch

> "For the user's post feed, I'll use keyset pagination. The cursor is the ID of the last post seen. Each subsequent request does `WHERE id < :cursor ORDER BY id DESC LIMIT 20` — this uses the primary key index and is O(log N) regardless of how far the user has scrolled. It's also stable if new posts are added while the user is paging. I avoid offset pagination because at page depth 50,000 (power users scrolling old feeds) it would cause a full table scan."
