# Mobile System Design

## Constraints

- battery and radio cost
- intermittent connectivity
- app lifecycle interruptions

## Design Priorities

- local-first cache with sync engine
- conflict-aware offline writes
- push notification fanout control
- bandwidth-conscious payloads

## Sync Strategy

- delta sync over full sync
- checkpoint/token based continuation
- retry and backoff on poor networks
