import { Injectable, Signal, inject, signal } from '@angular/core';
import { ObjectStyleConfiguration, StyleProperties } from '@cupola/core';

import { ConditionResultService } from '../engine/condition-result.service';

/** A live conditional-style binding: the applied style plus its teardown. */
export interface StyleBinding {
  readonly style: Signal<StyleProperties>;
  destroy(): void;
}

const EMPTY_STYLE: StyleProperties = {};

/**
 * Applies the style of the active condition-set output to a bound object
 * (OMCT-C10-L2-02.01). Each output fully replaces the applied conditional style;
 * the default style applies when the active condition has no rule or the master
 * switch is off.
 */
@Injectable({ providedIn: 'root' })
export class StyleRuleManager {
  private readonly results = inject(ConditionResultService);

  /** Binds an object-style configuration to its condition set's active output. */
  attach(config: ObjectStyleConfiguration): StyleBinding {
    const style = signal<StyleProperties>(config.defaultStyle ?? EMPTY_STYLE);

    if (!config.enabled) {
      return { style: style.asReadonly(), destroy: () => {} };
    }

    const subscription = this.results.outputs(config.conditionSetKeyString).subscribe((result) => {
      const match = config.styles.find((conditionalStyle) => conditionalStyle.conditionId === result.conditionId);
      style.set(match ? match.style : (config.defaultStyle ?? EMPTY_STYLE));
    });

    return { style: style.asReadonly(), destroy: () => subscription.unsubscribe() };
  }
}
