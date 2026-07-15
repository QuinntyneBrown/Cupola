/**
 * B12 — User identity (contract skeleton).
 * Owner: C14 · Consumers: C13 (entry author), C15 (user indicator) · Stability: medium.
 * See docs/capability-contracts/cross-capability-contracts.md.
 */

export interface User {
  id: string;
  name: string; // OMCT-C14-L2-01.01: identifier and name
}
