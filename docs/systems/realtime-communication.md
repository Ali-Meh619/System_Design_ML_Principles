# Realtime Communication

## Protocol Choice

- WebSocket for duplex persistent channels
- SSE for server-to-client stream
- Long polling for constrained environments

## Scaling Approach

- stateless gateway tier
- connection state in shared store/pub-sub
- partition channels by room/user key

## Reliability Concerns

- reconnection with resume tokens
- ordered delivery within channel
- backpressure handling for slow clients
