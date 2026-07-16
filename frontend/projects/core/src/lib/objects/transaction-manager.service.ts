import { Injectable, inject } from '@angular/core';

import { ObjectSaveResult } from '../models/object-save-result';
import { ObjectApi } from './object-api.service';
import { Transaction } from './transaction';

/**
 * Tracks the single active editing transaction and routes its commits through
 * the {@link ObjectApi} save path. Requirement: OMCT-C02-L2-02.07.
 */
@Injectable({ providedIn: 'root' })
export class TransactionManager {
  private readonly objects = inject(ObjectApi);
  private active: Transaction | null = null;

  /** Begins (or returns) the active transaction. */
  start(): Transaction {
    if (!this.active) {
      this.active = new Transaction((objects) =>
        Promise.all(objects.map((object) => this.objects.save(object))),
      );
    }
    return this.active;
  }

  isActive(): boolean {
    return this.active !== null;
  }

  getActiveTransaction(): Transaction | null {
    return this.active;
  }

  /**
   * Commits the active transaction, ending it only on success. A failed save
   * rejects and leaves the transaction active with its dirty objects retained,
   * so the edit can be retried (OMCT-C03-L2-01.05).
   */
  async commit(): Promise<ObjectSaveResult[]> {
    if (!this.active) {
      return [];
    }
    const transaction = this.active;
    const results = await transaction.commit();
    this.active = null;
    return results;
  }

  /** Cancels and ends the active transaction without saving. */
  cancel(): void {
    this.active?.cancel();
    this.active = null;
  }
}
