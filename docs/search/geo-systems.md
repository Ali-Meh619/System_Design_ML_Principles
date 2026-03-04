# Geo & Location Systems

> Proximity search (Yelp), driver matching (Uber), route planning (Google Maps). Geospatial data requires specialized indexing techniques.

---

## The Core Problem: Proximity Queries

How do you find all restaurants within 5 km of a user? A naive approach (compute distance between user and every restaurant) is O(N) and catastrophically slow at 1 billion locations. You need a **spatial index** that can efficiently retrieve items in a geographic area without scanning everything.

---

## Geohash — Encoding Location as a String

**Geohash** converts a lat/lng coordinate into a string of characters (e.g., "9q8yy9mf"). The key property: nearby locations share the same string prefix. "9q8yy" and "9q8yz" are very close geographically. This means finding nearby points is as simple as finding strings with the same prefix — which a regular database index handles efficiently.

```
Geohash precision:
  1 char  → ±2,500 km (entire continent)
  4 chars → ±40 km (city level)
  6 chars → ±1.2 km (neighborhood)
  8 chars → ±20 m (building level)
  12 chars → sub-meter accuracy

To find restaurants within 1 km of user:
  1. Convert user location to geohash with precision 6
  2. Get the 8 neighboring geohash cells (the cell + 8 surrounding cells)
  3. SQL: SELECT * FROM restaurants WHERE geohash LIKE '9q8yy%'
     (fast B-tree index scan)
  4. Filter results by exact distance using Haversine formula
```

> ⚠️ **Geohash Edge Case:** Two points on opposite sides of a geohash cell boundary may be very close physically but have completely different geohash strings. Always query the target cell AND its 8 neighbors to avoid missing nearby results.

---

## Quadtree — Dynamic Spatial Indexing

A **Quadtree** recursively subdivides space into four quadrants until each cell contains at most N points. Dense areas (Manhattan) get many subdivisions; sparse areas (Sahara Desert) stay coarse. This is more adaptive than geohash — it naturally handles uneven data density. Used by Google Maps, Uber for their internal spatial indexes.

For range queries, traverse the quadtree: if a quadrant fully overlaps the search area, include all its points. If partially overlaps, recurse. If no overlap, skip. This is O(log N + K) where K is results count — vastly better than O(N).

```
Quadtree structure:
          World
         /  |  \ \
      NW    NE  SW  SE
      |
    Manhattan (dense, subdivide further)
    /  |  \ \
  NW  NE  SW  SE  (each containing ≤ 100 restaurants)
```

---

## Geohash vs Quadtree Comparison

| Aspect | Geohash | Quadtree |
|--------|---------|---------|
| Structure | String prefix, maps to grid cells | Tree, recursively subdivides space |
| Density handling | Fixed grid size — same precision everywhere | Adapts — dense areas get more subdivisions |
| Index type | String B-tree index in SQL | In-memory tree structure |
| Query type | `WHERE geohash LIKE 'prefix%'` | Tree traversal |
| Redis support | `GEOADD`/`GEORADIUS` commands (geohash-based) | Not native |
| Best for | Simple DB-backed geo queries | In-memory spatial indexes with uneven density |

---

## Redis Geo Commands

Redis has native geospatial support (based on geohash under the hood):

```
# Add drivers to geo index
GEOADD drivers:active -73.9857 40.7484 "driver_123"
GEOADD drivers:active -73.9901 40.7489 "driver_456"

# Find drivers within 5km radius
GEORADIUS drivers:active -73.9857 40.7484 5 km ASC COUNT 10
→ ["driver_456", "driver_123"]

# Get distance between two points
GEODIST drivers:active driver_123 driver_456 km
→ "0.5423"

# Get coordinates
GEOPOS drivers:active driver_123
→ ["-73.9857", "40.7484"]
```

Redis Geo commands run in O(N+log M) where N is items in radius and M is total index size — fast enough for millions of drivers.

---

## Uber-Style Real-Time Driver Matching

**Architecture for Location-Based Matching (Uber, Lyft, Doordash):**

1. **Driver location ingestion:** Driver app sends GPS update every 4 seconds → WebSocket or UDP to Location Service → written to Redis (key: driver_id, value: {lat, lng, timestamp, geohash})

2. **Geohash bucketing:** Compute driver's geohash (precision 6) on update. Maintain Redis set per geohash cell: `SADD "geo:9q8yy" driver_id`. With TTL so stale drivers auto-expire.

3. **Rider requests ride:** Convert rider location to geohash. Look up drivers in that geohash cell and 8 neighbors. Filter by availability. Compute exact distance. Sort by ETA (not just distance).

4. **ETA calculation:** Pre-computed road graph in memory (Dijkstra/A* on simplified road network). For precise ETAs, query Google Maps/HERE API for top 3 candidates only.

5. **Surge pricing:** Real-time ratio of demand (ride requests) to supply (available drivers) per geohash zone → triggers multiplier if ratio exceeds threshold

---

## Haversine Formula (Exact Distance)

After geohash/quadtree narrows down candidates, compute exact distances using the Haversine formula:

```python
import math

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371  # Earth's radius in km
    
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    
    a = math.sin(dphi/2)**2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    
    return 2 * R * math.asin(math.sqrt(a))

# Usage
distance = haversine_km(40.7484, -73.9857, 40.7489, -73.9901)
# → 0.39 km
```

---

## Yelp-Style Business Search

For finding businesses near a user with text search:

```
User query: "Italian restaurants near me within 2km, open now, rating > 4"

Architecture:
1. Convert user location to geohash (precision 6)
2. Elasticsearch query:
   {
     "query": {
       "bool": {
         "must": [{ "match": {"cuisine": "Italian"} }],
         "filter": [
           { "term": {"open_now": true} },
           { "range": {"rating": {"gte": 4}} },
           { "geo_distance": {
             "distance": "2km",
             "location": {"lat": 40.748, "lon": -73.986}
           }}
         ]
       }
     }
   }
3. Return results sorted by (distance + rating score)
```

Elasticsearch has native `geo_distance` filter — no need for manual geohash computation.

---

## Google Maps-Style Route Planning

For turn-by-turn navigation:

1. **Road graph:** Nodes = intersections, edges = road segments (with speed, distance, turn restrictions)
2. **Shortest path:** Dijkstra's algorithm (exact) or A* (heuristic, faster for long routes)
3. **Real-time traffic:** Speed data from GPS probes (aggregate, not individual tracking) updates edge weights every few minutes
4. **Pre-computation:** Contraction Hierarchies or Hub Labels pre-compute shortcuts between important nodes — reduces query time from O(V log V) to milliseconds for cross-country routes

---

## Interview Talking Points

- "For proximity search: geohash the driver/restaurant location at precision 6 (1.2 km cells). Store in Redis using `GEOADD`. `GEORADIUS` query returns drivers within 5km — sub-millisecond, works for millions of drivers."
- "Always query the target geohash cell AND its 8 neighbors — otherwise you miss restaurants just across the cell boundary."
- "Driver location updates every 4 seconds via UDP (not TCP) — we can tolerate occasional packet loss, and UDP has lower overhead for high-frequency small updates."
- "Surge pricing: real-time supply/demand ratio per geohash zone computed every 30 seconds by Flink. Redis stores current multiplier per zone."
