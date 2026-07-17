import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { DomainObject, TelemetryApiService, TelemetryValue } from '@cupola/core';

import { SummaryRule, SummaryWidgetConfiguration, evaluateSummaryRules } from './summary-widget-evaluator';
import { TestDataManager } from './test-data-manager';

function fieldValue(datum: TelemetryValue | undefined, key: string): number | string | undefined {
  if (!datum) {
    return undefined;
  }
  return (datum as unknown as Record<string, number | string>)[key];
}

/**
 * Summary widget: evaluates ordered rules over composed telemetry and renders
 * the first matching rule's presentation (OMCT-C10-L2-02.03/02.04). In edit mode
 * it exposes a test-data fieldset that previews rules with temporary values that
 * are never persisted (OMCT-C10-L2-02.05).
 */
@Component({
  selector: 'cp-summary-widget-view',
  templateUrl: './summary-widget-view.component.html',
  styleUrl: './summary-widget-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryWidgetViewComponent {
  private readonly telemetry = inject(TelemetryApiService);
  private readonly testData = new TestDataManager();

  readonly object = input.required<DomainObject>();

  protected readonly matched = signal<SummaryRule | null>(null);
  protected readonly editMode = signal(false);
  protected readonly testEnabled = signal(false);

  protected readonly composedKeys = computed<string[]>(() => this.object().composition);
  protected readonly rules = computed<SummaryRule[]>(
    () => (this.object().configuration?.['summaryWidget'] as SummaryWidgetConfiguration | undefined)?.rules ?? [],
  );

  private readonly latest = new Map<string, TelemetryValue>();

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      this.latest.clear();
      const unsubscribes = object.composition.map((keyString) =>
        this.telemetry.subscribe({ ...object, keyString, type: 'telemetry', composition: [] }, (datum) => {
          const value = Array.isArray(datum) ? datum[datum.length - 1] : datum;
          if (value) {
            this.latest.set(keyString, value);
            this.recompute();
          }
        }),
      );
      this.recompute();
      onCleanup(() => unsubscribes.forEach((unsubscribe) => unsubscribe()));
    });
  }

  protected toggleEdit(): void {
    this.editMode.update((editing) => !editing);
  }

  protected toggleTestData(): void {
    const enabled = !this.testEnabled();
    this.testEnabled.set(enabled);
    this.testData.setEnabled(enabled);
    this.recompute();
  }

  protected setTestValue(keyString: string, raw: string): void {
    const numeric = Number(raw);
    this.testData.setValue(keyString, 'value', raw !== '' && !Number.isNaN(numeric) ? numeric : raw);
    this.recompute();
  }

  private recompute(): void {
    const resolver = this.testData.resolver((keyString, metadataKey) =>
      fieldValue(this.latest.get(keyString), metadataKey),
    );
    this.matched.set(evaluateSummaryRules(this.rules(), this.composedKeys(), resolver) ?? null);
  }
}
