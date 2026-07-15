/**
 * B13 — Notifications and indicators (contract skeleton).
 * Owner: C14 · Consumers: C15 (status bar) · Stability: medium.
 * See docs/capability-contracts/cross-capability-contracts.md.
 */
export interface Indicator {
  key: string;
  priority: number; // ordering in the status bar (OMCT-C14-L2-05.01)
  glyph?: string;
  text?: string;
}
