import { DomainObject } from '../models/domain-object';
import { ObjectSaveResult } from '../models/object-save-result';

/** Persists a batch of dirty objects; supplied by the {@link TransactionManager}. */
export type TransactionSaver = (objects: DomainObject[]) => Promise<ObjectSaveResult[]>;

/**
 * An editing transaction accumulating dirty objects to commit or cancel as a
 * unit. Requirement: OMCT-C02-L2-02.07.
 */
export class Transaction {
  private readonly dirty = new Map<string, DomainObject>();

  constructor(private readonly saver: TransactionSaver) {}

  /** Stages an object for the next commit, replacing any earlier staged state. */
  add(object: DomainObject): void {
    this.dirty.set(object.keyString, object);
  }

  /** The staged objects, in insertion order. */
  getDirty(): DomainObject[] {
    return [...this.dirty.values()];
  }

  /** Saves every dirty object and clears the transaction. */
  async commit(): Promise<ObjectSaveResult[]> {
    const results = await this.saver(this.getDirty());
    this.dirty.clear();
    return results;
  }

  /** Discards every dirty object without saving. */
  cancel(): void {
    this.dirty.clear();
  }
}
