import { DomainObject } from './domain-object';

/**
 * B04 — per-object outcome of a persistence save (OMCT-C04-L2-02.03).
 * `conflict` marks an optimistic-concurrency rejection (OMCT-C04-L2-02.07).
 */
export type ObjectSaveOutcome = 'created' | 'updated' | 'conflict';

export interface ObjectSaveResult {
  keyString: string;
  outcome: ObjectSaveOutcome;
  /** The stored object: the saved state on success, the current server state on conflict. */
  object: DomainObject | null;
}
