import { EnvironmentInjector, inject } from '@angular/core';
import {
  CompositionApi,
  DomainObject,
  InspectorViewRegistry,
  TelemetryApiService,
  TypeRegistry,
  ViewRegistry,
} from '@cupola/core';

import { ConditionSetCompositionPolicy } from './engine/condition-set-composition-policy';
import { ConditionSetViewProvider } from './condition-set/condition-set-view-provider';
import { ConditionWidgetViewProvider } from './widget/condition-widget-view-provider';
import { CorrelationTelemetryProvider } from './derived/correlation-telemetry-provider';
import { DerivedTelemetryProvider } from './derived/derived-telemetry-provider';
import { DerivedViewProvider } from './derived/derived-view-provider';
import { FilterInspectorViewProvider } from './filters/filter-inspector-view-provider';
import { MeanTelemetryProvider } from './derived/mean-telemetry-provider';
import { SummaryWidgetViewProvider } from './summary-widget/summary-widget-view-provider';
import { defaultCondition } from './models/condition-models';

function setConfiguration(object: DomainObject, configuration: Record<string, unknown>): void {
  object.configuration = { ...object.configuration, ...configuration };
}

/**
 * Registers C10 condition, widget, derived-telemetry, and filter contributions:
 * the object types with their default configuration, the condition-set
 * composition policy, the object and inspector views, and the derived telemetry
 * providers. Must run inside an injection context (the app initializer).
 *
 * Requirements: OMCT-C10-L2-01.01, 02.01–02.05, 03.01–03.04, 04.01–04.03.
 */
export function registerConditions(): void {
  const types = inject(TypeRegistry);
  types.register({
    key: 'condition-set',
    name: 'Condition Set',
    glyph: 'i-alert-circle',
    description: 'Evaluates ordered conditions over composed telemetry and publishes the selected output.',
    creatable: true,
    initialize: (object) => setConfiguration(object, { conditions: [defaultCondition()] }),
  });
  types.register({
    key: 'condition-widget',
    name: 'Condition Widget',
    glyph: 'i-alert-circle',
    description: 'Displays the active output of a condition set with its label, link, and styling.',
    creatable: true,
    initialize: (object) => setConfiguration(object, { conditionWidget: { conditionSetKeyString: '' } }),
  });
  types.register({
    key: 'summary-widget',
    name: 'Summary Widget',
    glyph: 'i-alert-triangle',
    description: 'Selects a visual rule from telemetry conditions over composed objects.',
    creatable: true,
    initialize: (object) =>
      setConfiguration(object, {
        summaryWidget: {
          rules: [
            { id: 'default', name: 'Default', scope: 'any', metadataKey: 'value', operation: 'equalTo', input: [0], isDefault: true, label: 'DEFAULT' },
          ],
        },
      }),
  });
  types.register({
    key: 'derived-telemetry',
    name: 'Derived Telemetry',
    glyph: 'i-plot',
    description: 'Calculates a new telemetry stream from source-combination operations.',
    creatable: true,
    initialize: (object) =>
      setConfiguration(object, { derived: { kind: 'expression', expression: '', parameters: [] } }),
  });

  inject(CompositionApi).addPolicy(new ConditionSetCompositionPolicy());

  const injector = inject(EnvironmentInjector);
  const views = inject(ViewRegistry);
  views.register(new ConditionSetViewProvider(injector));
  views.register(new ConditionWidgetViewProvider(injector));
  views.register(new SummaryWidgetViewProvider(injector));
  views.register(new DerivedViewProvider(injector));

  inject(InspectorViewRegistry).register(new FilterInspectorViewProvider(injector));

  const telemetry = inject(TelemetryApiService);
  telemetry.addProvider(inject(DerivedTelemetryProvider));
  telemetry.addProvider(inject(MeanTelemetryProvider));
  telemetry.addProvider(inject(CorrelationTelemetryProvider));
}
