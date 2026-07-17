import { EnvironmentInjector, inject } from '@angular/core';
import { CompositionApi, DomainObject, MetadataRegistry, TypeRegistry, ViewRegistry } from '@cupola/core';

import { BarGraphCompositionPolicy } from '../../charts/bar/bar-graph-composition-policy';
import { BarGraphViewProvider } from '../../charts/bar/bar-graph-view-provider';
import { ScatterPlotCompositionPolicy } from '../../charts/scatter/scatter-plot-composition-policy';
import { ScatterPlotViewProvider } from '../../charts/scatter/scatter-plot-view-provider';
import { MultiRangeMetadataProvider } from './multi-range-metadata-provider';
import { OverlayPlotCompositionPolicy } from './overlay-plot-composition-policy';
import { PLOT_DEFAULTS } from './plot-config';
import { PlotViewProvider } from './plot-view-provider';
import { StackedPlotCompositionPolicy } from './stacked-plot/stacked-plot-composition-policy';
import { StackedPlotViewProvider } from './stacked-plot/stacked-plot-view-provider';

function setConfiguration(object: DomainObject, configuration: Record<string, unknown>): void {
  object.configuration = { ...object.configuration, ...configuration };
}

/**
 * Registers C07 plot and chart contributions: the plot object types with their
 * default configuration, the overlay/stacked/bar/scatter composition policies, the
 * multi-range metadata provider, and the object view providers. Must run inside an
 * injection context (the app initializer), before create actions are minted from
 * the creatable types.
 *
 * Requirements: OMCT-C07-L2-01.01–01.04, 02.*, 03.*, 04.*.
 */
export function registerPlotViews(): void {
  const types = inject(TypeRegistry);
  types.register({
    key: 'overlay-plot',
    name: 'Overlay Plot',
    glyph: 'i-plot',
    description: 'Plots one or more telemetry series together on shared or per-series axes.',
    creatable: true,
    initialize: (object) => setConfiguration(object, { plot: { ...PLOT_DEFAULTS } }),
  });
  types.register({
    key: 'stacked-plot',
    name: 'Stacked Plot',
    glyph: 'i-plot',
    description: 'Stacks each composed telemetry series in its own row on a shared time axis.',
    creatable: true,
    initialize: (object) => setConfiguration(object, { plot: { ...PLOT_DEFAULTS } }),
  });
  types.register({
    key: 'bar-graph',
    name: 'Bar Graph',
    glyph: 'i-plot',
    description: 'Renders the latest value of each composed telemetry series as a bar.',
    creatable: true,
    initialize: (object) => setConfiguration(object, { plot: { grid: true } }),
  });
  types.register({
    key: 'scatter-plot',
    name: 'Scatter Plot',
    glyph: 'i-plot',
    description: 'Plots one telemetry range against another as a scatter of points.',
    creatable: true,
    initialize: (object) => setConfiguration(object, { scatter: {} }),
  });

  const metadata = inject(MetadataRegistry);
  metadata.addProvider(inject(MultiRangeMetadataProvider));

  const composition = inject(CompositionApi);
  composition.addPolicy(new OverlayPlotCompositionPolicy(metadata));
  composition.addPolicy(new StackedPlotCompositionPolicy(metadata));
  composition.addPolicy(new BarGraphCompositionPolicy(metadata));
  composition.addPolicy(new ScatterPlotCompositionPolicy(metadata));

  const injector = inject(EnvironmentInjector);
  const views = inject(ViewRegistry);
  views.register(new PlotViewProvider(injector, metadata));
  views.register(new StackedPlotViewProvider(injector));
  views.register(new BarGraphViewProvider(injector));
  views.register(new ScatterPlotViewProvider(injector));
}
