/**
 * B07 — Limits and staleness (contract skeleton, open contract).
 * Owner: C06 · Consumers: C07, C08 · Stability: medium.
 *
 * Open contract: <TO SUPPLY: limit-evaluation result shape and staleness event shape>.
 * The specifications require limit evaluation (OMCT-C06-L2-04.03, OMCT-C07-L2-02.07,
 * OMCT-C08-L2-03.03) without fixing a shape. Committed as typed placeholders so imports
 * compile while the surface is resolved.
 * See docs/capability-contracts/cross-capability-contracts.md.
 */

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LimitEvaluation {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface StalenessEvent {}
