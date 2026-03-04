# Interview Framework

## Goal

Convert ambiguous prompts into defensible design decisions.

## Four-Step Interview Flow

1. Clarify requirements
2. Estimate scale
3. Propose high-level architecture
4. Deep dive into bottlenecks and trade-offs

## Clarifying Questions

- Who are users and how many are active daily?
- Read/write ratio and peak traffic?
- Latency target for P50/P95/P99?
- Consistency requirements by workflow?
- Multi-region requirements?
- Data retention and compliance constraints?

## Decision Ledger (Use During Interview)

Keep a visible list:

- Assumption
- Decision
- Why chosen
- Cost of choice
- Fallback if assumption is wrong

## Red Flags

- Starting with tools before requirements
- No quantitative estimation
- Ignoring failure paths
- No mention of observability or rollback

## Strong Closing Script

"Given these requirements and traffic estimates, this design is optimized for X. The main trade-off is Y, which we mitigate with Z. If traffic doubles or consistency requirements tighten, the first component I would evolve is N."
