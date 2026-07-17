import { Type } from '@angular/core';
import { DomainObject, MetadataRegistry } from '@cupola/core';

import { BarGraphViewComponent } from '../../charts/bar/bar-graph-view.component';
import { ScatterPlotViewComponent } from '../../charts/scatter/scatter-plot-view.component';
import { PlotViewComponent } from '../../views/plot/plot-view.component';
import { StackedPlotViewComponent } from '../../views/plot/stacked-plot/stacked-plot-view.component';
import { ImageryTimeViewComponent } from '../../views/imagery/time-strip/imagery-time-view.component';
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
 * receive one. Image telemetry hosts C11's imagery time view (OMCT-C11-L2-01.05).
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
  if (kind === 'image') {
    return { component: ImageryTimeViewComponent, acceptsRestricted: true };
  }
  return null;
}
