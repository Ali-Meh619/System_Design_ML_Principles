# Geo Systems

## Query Types

- nearby search
- geo-fencing
- route/travel-time estimation

## Spatial Indexing

- Geohash for coarse partitioning
- Quadtree or R-tree for dynamic spatial lookup

## Design Considerations

- moving entities update rate
- precision vs compute cost
- location privacy controls

## Common Pattern

Use coarse geohash prefilter, then precise distance computation.
