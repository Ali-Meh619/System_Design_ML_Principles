# System Design Playbook

A public, interview-first repository for system design learning and review.

This repo is derived from `SystemDesignPlaybook.html` and reorganized into fine-grained, topic-based documentation, reusable interview playbooks, and an interactive browser for public access.

## What You Get

- Structured docs split by category: fundamentals, data, distributed systems, reliability, security, and specialized system designs.
- Practical playbooks for 30-minute and 60-minute interview rounds.
- Decision frameworks, trade-offs, and anti-patterns you can apply in real interviews.
- Interactive topic explorer under `site/` for quick navigation.

## Quick Start

1. Read [docs index](docs/README.md).
2. Follow [Interview Framework](docs/fundamentals/interview-framework.md).
3. Memorize [Estimation and Numbers](docs/fundamentals/estimation-and-numbers.md).
4. Practice with [Reusable Design Templates](docs/templates/reusable-design-templates.md).
5. Run interview drills from [Interview Day Playbook](playbooks/interview-day-playbook.md).

## Repository Map

- `docs/`: the core knowledge base
- `playbooks/`: runnable interview workflows
- `site/`: interactive static topic browser
- `.github/`: contribution and review templates

## Suggested Learning Paths

- Beginner path: Framework -> Numbers -> Databases -> Caching -> API and Load Balancing
- Mid-level path: Distributed fundamentals -> Transactions -> Resilience -> Observability
- Advanced path: Collaboration systems -> AI agents -> Probabilistic data structures -> Compliance

## Contribution Standard

Contributions should be practical, precise, and trade-off aware. Every substantial addition should include:

- when to use
- when not to use
- common failure modes
- measurable success metrics

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
