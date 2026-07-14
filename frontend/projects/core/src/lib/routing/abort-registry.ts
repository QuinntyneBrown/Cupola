import { Injectable } from '@angular/core';

/**
 * Registry of in-flight abortable work (telemetry requests, long-running
 * fetches). Route changes abort everything registered here.
 * Requirement: OMCT-C15-L2-01.01.
 */
@Injectable({ providedIn: 'root' })
export class AbortRegistry {
  private readonly abortables = new Set<() => void>();

  /** Registers an abort callback; returns a function that unregisters it. */
  register(abort: () => void): () => void {
    this.abortables.add(abort);
    return () => this.abortables.delete(abort);
  }

  abortAll(): void {
    const pending = [...this.abortables];
    this.abortables.clear();
    for (const abort of pending) {
      abort();
    }
  }

  get size(): number {
    return this.abortables.size;
  }
}
