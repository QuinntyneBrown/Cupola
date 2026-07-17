import { Type } from '@angular/core';
import { DomainObject, MetadataRegistry } from '@cupola/core';

import { BarGraphViewComponent } from '../../charts/bar/bar-graph-view.component';
import { ScatterPlotViewComponent } from '../../charts/scatter/scatter-plot-view.component';
import { PlotViewComponent } from '../../views/plot/plot-view.component';
import { StackedPlotViewComponent } from '../../views/plot/stacked-plot/stacked-plot-view.component';
import { EventTrackViewComponent } from '../events/event-track-view.component';
import { GanttViewComponent } from '../gantt/gantt-view.component';
import { PlanViewComponent } from '../plan/plan-view.component';
import { stripRowKind } from './strip-eligibility';

/** The component a strip child hosts, and whether it accepts a `restricted` input. */
export interface StripComponent {
  component: Type<unknown>;
  acceptsRestricted: boolean;
}

/**
 * Resolves the component that renders a strip child (OMCT-C12-L2-02.02). Bar and
 * scatter charts do not declare a `restricted` input, so they are flagged not to
 * receive one. Image telemetry is rendered by the row directly (no component).
 */
export function stripComponentFor(
  object: DomainObject,
  metadata: MetadataRegistry,
): StripComponent | null {
  switch (object.type) {
    case 'plan':
      return { component: PlanViewComponent, acceptsRestricted: true };
    case 'gantt-chart':
      return { component: GanttViewComponent, acceptsRestricted: true };
    case 'overlay-plot':
      return { component: PlotViewComponent, acceptsRestricted: true };
    case 'stacked-plot':
      return { component: StackedPlotViewComponent, acceptsRestricted: true };
    case 'bar-graph':
      return { component: BarGraphViewComponent, acceptsRestricted: false };
    case 'scatter-plot':
      return { component: ScatterPlotViewComponent, acceptsRestricted: false };
    default:
      break;
  }
  const kind = stripRowKind(object, metadata);
  if (kind === 'plot') {
    return { component: PlotViewComponent, acceptsRestricted: true };
  }
  if (kind === 'event') {
    return { component: EventTrackViewComponent, acceptsRestricted: true };
  }
  return null;
}
