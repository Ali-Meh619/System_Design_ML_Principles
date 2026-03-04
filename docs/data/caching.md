# Caching

## Cache Layers

- Client and browser cache
- CDN edge cache
- API response cache
- Application object cache
- Database page/plan cache

## Read Patterns

- Cache-aside: default for most read-heavy paths
- Read-through: centralized cache logic

## Write Patterns

- Write-through: consistency preference
- Write-behind: throughput preference

## Eviction Strategy

- LRU for recency-based access
- LFU for stable hot keys
- TTL + jitter to avoid synchronized expiration storms

## Failure Modes

- Cache stampede
- Hot key saturation
- Stale reads beyond tolerance

## Mitigations

- Request coalescing
- Probabilistic early refresh
- Stale-while-revalidate
- Multi-level cache fallback
