import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DomainObject, ObjectStyleConfiguration, StyleProperties, sanitizeUrl } from '@cupola/core';

import { ConditionResult } from '../models/condition-models';
import { ConditionResultService } from '../engine/condition-result.service';
import { StyleBinding, StyleRuleManager } from '../presentation/style-rule-manager.service';

/** Per-output presentation for a condition widget. */
export interface ConditionWidgetOutputStyle {
  conditionId: string;
  label?: string;
  severity?: 'ok' | 'caution' | 'critical';
  url?: string;
}

/** Persisted condition-widget configuration (stored at `configuration.conditionWidget`). */
export interface ConditionWidgetConfiguration {
  conditionSetKeyString: string;
  /** Fallback URL applied when an output does not specify one. */
  url?: string;
  outputs?: ConditionWidgetOutputStyle[];
}

const SEVERITY_ICONS: Record<string, string> = {
  caution: 'i-alert-triangle',
  critical: 'i-alert-circle',
};

/**
 * Renders the active output of a bound condition set: its label, an optional
 * sanitized URL link, and its configured presentation (OMCT-C10-L2-02.02). When
 * an object-style configuration is present, its conditional styles are applied
 * from the active output through the style rule manager (OMCT-C10-L2-02.01). A
 * rejected URL renders inert.
 */
@Component({
  selector: 'cp-condition-widget-view',
  templateUrl: './condition-widget-view.component.html',
  styleUrl: './condition-widget-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionWidgetViewComponent implements OnInit {
  private readonly results = inject(ConditionResultService);
  private readonly styleRules = inject(StyleRuleManager);

  readonly object = input.required<DomainObject>();

  protected readonly label = signal('');
  protected readonly severity = signal<'ok' | 'caution' | 'critical' | null>(null);
  protected readonly href = signal<string | null>(null);

  protected readonly icon = computed(() => {
    const severity = this.severity();
    return severity ? SEVERITY_ICONS[severity] : undefined;
  });

  private binding?: StyleBinding;

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      const config = object.configuration?.['conditionWidget'] as ConditionWidgetConfiguration | undefined;
      if (!config) {
        return;
      }
      const subscription = this.results.outputs(config.conditionSetKeyString).subscribe((result) => {
        this.render(config, result);
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  ngOnInit(): void {
    const styleConfig = this.object().configuration?.['objectStyles'] as ObjectStyleConfiguration | undefined;
    if (styleConfig) {
      this.binding = this.styleRules.attach(styleConfig);
    }
  }

  /** The applied conditional style, tracked for the template. */
  protected conditionalStyle(): StyleProperties {
    return this.binding?.style() ?? {};
  }

  private render(config: ConditionWidgetConfiguration, result: ConditionResult): void {
    const output = config.outputs?.find((entry) => entry.conditionId === result.conditionId);
    this.label.set(output?.label ?? result.output);
    this.severity.set(output?.severity ?? null);
    this.href.set(sanitizeUrl(output?.url ?? config.url ?? ''));
  }
}
