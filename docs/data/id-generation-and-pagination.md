# ID Generation and Pagination

## ID Strategy

- Auto-increment: simple but poor global scalability
- UUIDv4: distributed, unordered
- UUIDv7/ULID: distributed and time-ordered
- Snowflake-style IDs: compact, sortable, high throughput

## Pagination Options

- Offset pagination: easy, degrades at high offsets
- Cursor pagination: stable and efficient for feeds
- Keyset pagination: strongest performance with indexed sort keys

## Interview Standard

For high-scale feeds, use cursor/keyset pagination and explicitly discuss consistency under concurrent writes.
