import { Injectable, Signal, Type, computed, signal } from '@angular/core';

import { Indicator } from './indicator';

/**
 * An indicator with optional reactive text/state and an optional component for
 * interactive indicators. Plain B13 `Indicator` registrations remain valid.
 */
export interface StatusIndicator extends Indicator {
  /** Reactive text; wins over the static `text` when present. */
  textSignal?: Signal<string>;
  /** Reactive state class rendered on the indicator dot (e.g. `cp-dot--ok`). */
  cssClass?: Signal<string>;
  /** Component rendered in place of glyph/text for interactive indicators. */
  component?: Type<unknown>;
  /** Rendered as `data-testid` on the indicator element. */
  testId?: string;
}

/**
 * Registry of status-bar indicators, exposed in descending priority order.
 * Requirement: OMCT-C14-L2-05.01.
 */
@Injectable({ providedIn: 'root' })
export class IndicatorService {
  private readonly registered = signal<readonly StatusIndicator[]>([]);

  /** Indicators sorted by descending priority. */
  readonly indicators = computed(() =>
    [...this.registered()].sort((a, b) => b.priority - a.priority),
  );

  /** Registers an indicator; a registration with an existing key replaces it. */
  register(indicator: StatusIndicator): void {
    this.registered.update((list) => [
      ...list.filter((existing) => existing.key !== indicator.key),
      indicator,
    ]);
  }
}
