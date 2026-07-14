import { EnvironmentInjector, inject } from '@angular/core';
import { InspectorViewRegistry } from '@cupola/core';

import { AnnotationsInspectorViewProvider } from './annotations/annotations-inspector-view-provider';
import { DataVisualizationInspectorViewProvider } from './data-visualization/data-visualization-inspector-view-provider';
import { ElementsInspectorViewProvider } from './elements/elements-inspector-view-provider';
import { PlotSeriesInspectorViewProvider } from './plot-series/plot-series-inspector-view-provider';
import { PropertiesInspectorViewProvider } from './properties/properties-inspector-view-provider';
import { StylesInspectorViewProvider } from './styles/styles-inspector-view-provider';

/**
 * Registers the standard inspector views (properties, elements, plot
 * series, styles, annotations) plus data visualization.
 * Requirements: OMCT-C15-L2-02.04, OMCT-C15-L2-02.05.
 */
export function registerStandardInspectorViews(): void {
  const registry = inject(InspectorViewRegistry);
  const injector = inject(EnvironmentInjector);

  registry.register(new PropertiesInspectorViewProvider(injector));
  registry.register(new ElementsInspectorViewProvider(injector));
  registry.register(new PlotSeriesInspectorViewProvider(injector));
  registry.register(new StylesInspectorViewProvider(injector));
  registry.register(new AnnotationsInspectorViewProvider(injector));
  registry.register(new DataVisualizationInspectorViewProvider(injector));
}
