# Search and Typeahead

## Search Architecture

- ingestion pipeline
- normalization and analyzers
- inverted index
- ranking and personalization

## Typeahead Design

- prefix trie or specialized index
- cache hot prefixes
- debounce client requests
- shard by language/region when needed

## Quality Metrics

- click-through rate
- zero-result rate
- latency at P95/P99
- relevance score drift over time
