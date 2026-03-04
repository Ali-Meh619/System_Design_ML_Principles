# Microservices vs Monolith

## Start Position

Default to a modular monolith until team and domain complexity justify decomposition.

## Choose Microservices When

- Independent scaling needs are proven
- Team boundaries map to service boundaries
- Deployment independence is materially valuable

## Hidden Costs

- Distributed tracing and debugging complexity
- Cross-service schema and version drift
- Operational overhead and on-call burden

## Migration Pattern

Extract one bounded context at a time with clear API contracts and rollback paths.
