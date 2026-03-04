# IO, Networking, and Concurrency

## IO Model Selection

- Blocking model: simple, low concurrency.
- Async event loop: high connection count, IO-heavy workloads.
- Thread-per-request: useful for CPU-heavy tasks with bounded concurrency.

## TCP vs UDP

- TCP: reliable, ordered, connection-oriented.
- UDP: low overhead, best-effort delivery, useful for media and telemetry.

## HTTP Strategy

- HTTP/1.1: mature, easy debugging.
- HTTP/2: multiplexing and header compression.
- HTTP/3 (QUIC): lower head-of-line blocking and better lossy network behavior.

## Concurrency Controls

- Semaphore for outbound dependency caps
- Bounded queues for overload safety
- Backpressure signals to upstream services

## Production Defaults

- Connection timeout plus read timeout
- Retry budget with exponential backoff and jitter
- Circuit breaker around unstable dependencies
