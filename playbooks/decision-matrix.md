# Decision Matrix

## Database

- strict transaction + joins -> relational
- massive writes + wide scale -> wide-column
- flexible document model -> document DB
- full-text relevance -> search index

## Service Boundary

- unclear domain boundaries -> modular monolith
- proven independent scaling/team ownership -> microservices

## Consistency

- money/inventory correctness -> stronger consistency
- feed/analytics freshness tolerance -> eventual consistency

## Messaging

- task execution -> queue
- multi-consumer event history -> stream log
