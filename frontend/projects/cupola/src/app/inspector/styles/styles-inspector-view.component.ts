import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import {
  ConditionalStyle,
  DomainObject,
  ObjectApi,
  ObjectStyleConfiguration,
  SelectedItem,
  StyleProperties,
} from '@cupola/core';

import { ConditionConfiguration, readConditionSet } from '../../conditions/models/condition-models';

type StyleProperty = 'backgroundColor' | 'borderColor' | 'color';

/** Preset swatch values cycled per style property (empty string clears the property). */
const PALETTES: Record<StyleProperty, string[]> = {
  backgroundColor: ['', 'var(--cp-color-ok-dim)', 'var(--cp-color-caution-dim)', 'var(--cp-color-critical-dim)'],
  borderColor: ['', 'var(--cp-color-ok-border)', 'var(--cp-color-caution-border)', 'var(--cp-color-critical-border)'],
  color: ['', 'var(--cp-color-ok)', 'var(--cp-color-caution)', 'var(--cp-color-critical)'],
};

const DEFAULT_ROW: ConditionConfiguration = {
  id: 'default',
  name: 'Default',
  trigger: 'all',
  output: 'DEFAULT',
  criteria: [],
  isDefault: true,
};

function blankConfig(): ObjectStyleConfiguration {
  return { conditionSetKeyString: '', enabled: false, styles: [], defaultStyle: {} };
}

/**
 * Conditional-styles editor (OMCT-C10-L2-02.01): binds an object to a condition
 * set, toggles the master switch, and edits per-condition background, border,
 * and text colors with a live preview. Edits persist to
 * `configuration.objectStyles` through the object API.
 */
@Component({
  selector: 'cp-styles-inspector-view',
  templateUrl: './styles-inspector-view.component.html',
  styleUrl: './styles-inspector-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StylesInspectorViewComponent {
  private readonly objects = inject(ObjectApi);

  readonly selection = input<SelectedItem[]>([]);

  protected readonly config = signal<ObjectStyleConfiguration>(blankConfig());
  protected readonly conditions = signal<ConditionConfiguration[]>([DEFAULT_ROW]);

  private object: DomainObject | null = null;

  constructor() {
    // Adopt the selection input (set by the provider) and reset the editor state.
    effect(() => {
      const object = this.selection()[0]?.context.object ?? null;
      this.object = object;
      const existing = object?.configuration?.['objectStyles'] as ObjectStyleConfiguration | undefined;
      this.config.set(existing ? structuredClone(existing) : blankConfig());
      const keyString = existing?.conditionSetKeyString ?? '';
      if (keyString) {
        void this.loadConditions(keyString);
      } else {
        this.conditions.set([DEFAULT_ROW]);
      }
    });
  }

  protected async bindConditionSet(conditionSetKeyString: string): Promise<void> {
    this.config.update((config) => ({ ...config, conditionSetKeyString }));
    await this.loadConditions(conditionSetKeyString);
    await this.persist();
  }

  protected async toggleEnabled(): Promise<void> {
    this.config.update((config) => ({ ...config, enabled: !config.enabled }));
    await this.persist();
  }

  protected styleFor(conditionId: string): StyleProperties {
    if (conditionId === 'default') {
      return this.config().defaultStyle ?? {};
    }
    return this.config().styles.find((entry) => entry.conditionId === conditionId)?.style ?? {};
  }

  protected async cycleStyle(conditionId: string, property: StyleProperty): Promise<void> {
    const palette = PALETTES[property];
    const current = this.styleFor(conditionId)[property] ?? '';
    const next = palette[(palette.indexOf(current) + 1) % palette.length];
    const updated: StyleProperties = { ...this.styleFor(conditionId) };
    if (next) {
      updated[property] = next;
    } else {
      delete updated[property];
    }
    this.writeStyle(conditionId, updated);
    await this.persist();
  }

  private writeStyle(conditionId: string, style: StyleProperties): void {
    this.config.update((config) => {
      if (conditionId === 'default') {
        return { ...config, defaultStyle: style };
      }
      const styles: ConditionalStyle[] = config.styles.filter((entry) => entry.conditionId !== conditionId);
      styles.push({ conditionId, style });
      return { ...config, styles };
    });
  }

  private async loadConditions(conditionSetKeyString: string): Promise<void> {
    try {
      const set = await this.objects.get(conditionSetKeyString);
      const conditions = readConditionSet(set).conditions;
      this.conditions.set(conditions.length ? conditions : [DEFAULT_ROW]);
    } catch {
      this.conditions.set([DEFAULT_ROW]);
    }
  }

  private async persist(): Promise<void> {
    if (!this.object) {
      return;
    }
    const updated: DomainObject = {
      ...this.object,
      configuration: { ...this.object.configuration, objectStyles: this.config() },
    };
    this.object = await this.objects.save(updated).then((result) => result.object ?? updated);
  }
}
