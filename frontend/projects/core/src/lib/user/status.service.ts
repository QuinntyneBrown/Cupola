import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/**
 * Shared object status: set, retrieve, delete, and observe status by
 * domain-object key string.
 * Requirement: OMCT-C14-L2-02.01.
 */
@Injectable({ providedIn: 'root' })
export class StatusService {
  private readonly statuses = new Map<string, string>();
  private readonly changes = new Map<string, Subject<string | null>>();

  setStatus(keyString: string, status: string): void {
    this.statuses.set(keyString, status);
    this.changesFor(keyString).next(status);
  }

  getStatus(keyString: string): string | null {
    return this.statuses.get(keyString) ?? null;
  }

  deleteStatus(keyString: string): void {
    this.statuses.delete(keyString);
    this.changesFor(keyString).next(null);
  }

  observeStatus(keyString: string): Observable<string | null> {
    return this.changesFor(keyString).asObservable();
  }

  private changesFor(keyString: string): Subject<string | null> {
    let subject = this.changes.get(keyString);
    if (!subject) {
      subject = new Subject<string | null>();
      this.changes.set(keyString, subject);
    }
    return subject;
  }
}
