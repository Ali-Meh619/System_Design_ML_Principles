# Reusable Design Templates

## 1. Read-Heavy Content Platform

- CDN and edge cache first
- metadata in relational store
- object storage for blobs
- async pipelines for thumbnails/transcoding

## 2. Social Feed

- write path to durable store
- fanout strategy (write fanout, read fanout, hybrid)
- ranking pipeline and cache invalidation policy

## 3. Realtime Chat

- gateway plus persistent connection tier
- message log and delivery state
- offline sync and notification fallback

## 4. Booking and Inventory

- reservation hold with timeout
- idempotent checkout flow
- anti-oversell controls and reconciliation jobs

## 5. Rate Limiter

- token bucket or sliding window
- distributed counter backend
- per-tenant and per-endpoint policies
