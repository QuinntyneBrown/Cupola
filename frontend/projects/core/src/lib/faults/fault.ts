/**
 * B13 — Fault management surface (contract skeleton).
 * Owner: C14 · Consumers: C15 (fault views host) · Stability: medium.
 * See docs/capability-contracts/cross-capability-contracts.md.
 */

export type FaultSeverity = 'CRITICAL' | 'WARNING' | 'WATCH';

export interface FaultValueInfo {
  value: number | string | null;
  rangeCondition?: string;
  monitoringResult?: string;
}

export interface Fault {
  id: string; // unique within its namespace
  name: string;
  namespace: string;
  triggerTime: string; // ISO 8601
  severity: FaultSeverity;
  acknowledged: boolean;
  shelved: boolean;
  shortDescription?: string;
  seqNum?: number;
  currentValueInfo?: FaultValueInfo;
  triggerValueInfo?: FaultValueInfo;
}

export interface AcknowledgeOptions {
  comment?: string;
}

export interface ShelveOptions {
  shelved: boolean;
  comment?: string;
  shelveDuration?: number; // milliseconds
}
