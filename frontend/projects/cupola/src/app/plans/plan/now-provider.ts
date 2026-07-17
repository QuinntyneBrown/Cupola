import { Injectable, signal } from '@angular/core';

/**
 * A shared, controllable "current time" signal. Realtime views drive it from
 * their time-context tick; fixed views and tests set it explicitly so temporal
 * classification and progress are deterministic (OMCT-C12-L2-03.04).
 */
@Injectable({ providedIn: 'root' })
export class NowProvider {
  private readonly value = signal<number>(Date.now());

  /** The current time in epoch milliseconds. */
  readonly now = this.value.asReadonly();

  /** Sets the current time (fixed mode / tests). */
  set(time: number): void {
    this.value.set(time);
  }

  /** Advances the current time to the wall clock (realtime tick). */
  refresh(): void {
    this.value.set(Date.now());
  }
}
