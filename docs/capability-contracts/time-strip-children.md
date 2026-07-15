# Time-strip child-view contract (B11)

Owner: C12 Planning, timelines, events, and activities
Consumers: C07 Plot and chart visualization (plots), C11 Imagery visualization and
interaction (imagery)
Stability: medium
Traces: OMCT-C12-L2-02.01, OMCT-C12-L2-02.02, OMCT-C12-L2-02.03

This document is the normative statement of boundary B11 in the
[cross-capability contracts](cross-capability-contracts.md). It is a spec-kind contract:
no code surface crosses the boundary beyond B05 (time coordination) and B14 (view
registries).

## Contract

A time-strip child view:

1. shall render against the `TimeContext` supplied by its container (B05);
2. shall align to the shared time axis of the time strip; and
3. shall expose no time controls of its own.

## Eligible children

Eligible children are time-based views: plots, plans, imagery, and event views.

## Change control

Only C12 may change this contract, through the change-and-rebase protocol in section 5 of
the cross-capability contracts document.
