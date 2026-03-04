# Webhooks System Design

## Producer Responsibilities

- signed payloads
- retry with exponential backoff
- idempotency key delivery
- visibility into delivery status

## Consumer Responsibilities

- verify signature
- idempotent processing
- quick acknowledge then async processing

## Reliability Model

At-least-once delivery is expected. Build for duplicate events.

## Operational Metrics

- delivery success rate
- retry depth
- endpoint error distribution
