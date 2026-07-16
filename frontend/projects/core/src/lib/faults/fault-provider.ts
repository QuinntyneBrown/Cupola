/**
 * B13 — Fault management surface (contract skeleton).
 * Owner: C14 · Consumers: C15 (fault views host) · Stability: medium.
 * See docs/capability-contracts/cross-capability-contracts.md.
 *
 * Cupola exposes a single fault-management root, so request/subscribe are
 * parameterless (Open MCT passes the fault root domain object; with one root
 * the parameter carries no information).
 */
import { AcknowledgeOptions, Fault, ShelveOptions } from './fault';

export interface FaultProvider {
  supportsRequest(): boolean;
  supportsSubscribe(): boolean;
  request(): Promise<Fault[]>; // OMCT-C14-L2-03.01
  subscribe(onChange: (fault: Fault) => void): () => void; // returns unsubscribe
  acknowledgeFault(fault: Fault, options?: AcknowledgeOptions): Promise<void>; // OMCT-C14-L2-03.03
  shelveFault(fault: Fault, options: ShelveOptions): Promise<void>; // OMCT-C14-L2-03.04
}
