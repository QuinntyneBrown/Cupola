import { EnvironmentInjector, inject } from '@angular/core';
import {
  CompositionApi,
  DomainObject,
  InspectorViewRegistry,
  MetadataRegistry,
  TypeRegistry,
  ViewRegistry,
} from '@cupola/core';

import { AutoflowCompositionPolicy } from '../autoflow/autoflow-composition-policy';
import { AutoflowViewProvider } from '../autoflow/autoflow-view-provider';
import { GAUGE_DEFAULTS } from '../gauge/gauge-config';
import { GaugeCompositionPolicy } from '../gauge/gauge-composition-policy';
import { GaugeOptionsInspectorViewProvider } from '../gauge/gauge-options-inspector-view-provider';
import { GaugeViewProvider } from '../gauge/gauge-view-provider';
import { LadCompositionPolicy } from '../lad/lad-composition-policy';
import { LadTableSetViewProvider } from '../lad/lad-table-set-view-provider';
import { LadTableViewProvider } from '../lad/lad-table-view-provider';
import { TABLE_DEFAULTS } from '../views/table/table-config';

function setConfiguration(object: DomainObject, configuration: Record<string, unknown>): void {
  object.configuration = { ...object.configuration, ...configuration };
}

/**
 * Registers C08 tabular, gauge, and datum contributions: the object types with
 * their default configuration, the LAD/gauge/autoflow composition policies, the
 * object view providers, and the gauge options inspector. Must run inside an
 * injection context (the app initializer), before the create actions are minted
 * from the creatable types. The telemetry-table view provider itself is
 * registered with the built-in views.
 *
 * Requirements: OMCT-C08-L2-01.*, 02.*, 03.*, 04.*.
 */
export function registerTabularViews(): void {
  const types = inject(TypeRegistry);
  types.register({
    key: 'table',
    name: 'Telemetry Table',
    glyph: 'i-table',
    description: 'Presents historical and realtime telemetry in a configurable table.',
    creatable: true,
    initialize: (object) => setConfiguration(object, { table: { ...TABLE_DEFAULTS } }),
  });
  types.register({
    key: 'lad-table',
    name: 'LAD Table',
    glyph: 'i-list',
    description: 'Shows the latest available value for each composed telemetry object.',
    creatable: true,
  });
  types.register({
    key: 'lad-table-set',
    name: 'LAD Table Set',
    glyph: 'i-list',
    description: 'Stacks several latest-available-data tables as one scrolling set.',
    creatable: true,
  });
  types.register({
    key: 'gauge',
    name: 'Gauge',
    glyph: 'i-gauge',
    description: 'Displays the latest numeric telemetry value as a dial or meter.',
    creatable: true,
    initialize: (object) => setConfiguration(object, { gauge: { ...GAUGE_DEFAULTS } }),
  });
  types.register({
    key: 'autoflow',
    name: 'Autoflow Tabular',
    glyph: 'i-list',
    description: 'Packs many telemetry points into dense name/value rows that flow into columns.',
    creatable: true,
  });

  const metadata = inject(MetadataRegistry);
  const composition = inject(CompositionApi);
  composition.addPolicy(new LadCompositionPolicy());
  composition.addPolicy(new GaugeCompositionPolicy(metadata));
  composition.addPolicy(new AutoflowCompositionPolicy());

  const injector = inject(EnvironmentInjector);
  const views = inject(ViewRegistry);
  views.register(new LadTableViewProvider(injector));
  views.register(new LadTableSetViewProvider(injector));
  views.register(new GaugeViewProvider(injector));
  views.register(new AutoflowViewProvider(injector));

  inject(InspectorViewRegistry).register(new GaugeOptionsInspectorViewProvider(injector));
}
