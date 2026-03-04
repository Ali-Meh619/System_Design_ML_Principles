# API Design and Load Balancing

## API Style Selection

- REST: strong default for public APIs
- gRPC: efficient service-to-service calls
- GraphQL: flexible client-driven aggregation

## API Gateway Responsibilities

- Authentication and authorization
- Rate limiting and abuse controls
- Request shaping and version routing
- Unified telemetry and tracing headers

## Load Balancing

- L4 for raw connection distribution
- L7 for path/header-aware routing

## Algorithm Guide

- Round-robin: baseline
- Least-connections: uneven request durations
- Consistent hashing: session affinity/cache locality
- Weighted routing: canary and progressive rollout

## Interview Improvement Points

Always mention health checks, outlier ejection, and graceful draining during deploy.
