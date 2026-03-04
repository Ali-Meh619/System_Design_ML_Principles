# Database Selection

## Decision Matrix

- Relational (PostgreSQL/MySQL): strict consistency, joins, transactions
- Key-value (Redis/Dynamo style): high throughput, simple access patterns
- Wide-column (Cassandra): write-heavy, large-scale partitioned data
- Document (Mongo style): flexible schema with nested objects
- Search index (Elasticsearch/OpenSearch): full-text and faceted filtering
- Time-series DB: metric/event history with time-window queries

## Selection Questions

- Is cross-row transactionality required?
- Are queries known ahead of time?
- Is schema evolution frequent?
- Is workload read-heavy or write-heavy?

## Anti-Pattern

Forcing a single database to solve OLTP, analytics, search, and cache use cases at once.

## Better Pattern

Polyglot persistence with clear ownership boundaries and CDC-based synchronization.
