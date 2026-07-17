import { EnvironmentInjector, inject } from '@angular/core';
import {
  CompositionApi,
  InspectorViewRegistry,
  InterceptorRegistry,
  MetadataRegistry,
  RootRegistry,
  TypeRegistry,
  ViewRegistry,
} from '@cupola/core';

import { EventTimelineViewProvider } from './events/event-timeline-view-provider';
import { GanttCompositionPolicy } from './gantt/gantt-composition-policy';
import { GanttViewProvider } from './gantt/gantt-view-provider';
import { ActivityInspectorViewProvider } from './inspector/activity-inspector-view-provider';
import { PlanMonitoringViewProvider } from './inspector/plan-monitoring-view-provider';
import {
  ACTIVITY_STATES_KEY,
  ACTIVITY_STATES_NAME,
  ACTIVITY_STATES_TYPE,
  PLAN_MONITORING_KEY,
  PLAN_MONITORING_NAME,
  PLAN_MONITORING_TYPE,
} from './monitoring/activity-states';
import { ActivityStatesInterceptor } from './monitoring/activity-states-interceptor';
import { PlanMonitoringInterceptor } from './monitoring/plan-monitoring-interceptor';
import { PlanViewProvider } from './plan/plan-view-provider';
import { TimeListCompositionPolicy } from './time-list/time-list-composition-policy';
import { TimeListViewProvider } from './time-list/time-list-view-provider';
import { TimelineCompositionPolicy } from './time-strip/timeline-composition-policy';
import { TimeStripViewProvider } from './time-strip/time-strip-view-provider';

/**
 * Registers C12 planning contributions: the plan, gantt, time-strip, time-list,
 * and execution-monitoring types; their view and inspector providers; the gantt,
 * timeline, and time-list composition policies; the event timeline view; and the
 * activity-state / plan-monitoring interceptors and roots. Must run inside an
 * injection context (the app initializer), before create actions are minted from
 * the creatable types.
 *
 * Requirements: OMCT-C12-L2-01.*, 02.*, 03.*, 04.*.
 */
export function registerPlans(): void {
  const types = inject(TypeRegistry);
  types.register({
    key: 'plan',
    name: 'Plan',
    glyph: 'i-timeline',
    description: 'Renders externally supplied plans as time-positioned activity groups.',
    creatable: false,
  });
  types.register({
    key: 'gantt-chart',
    name: 'Gantt Chart',
    glyph: 'i-timeline',
    description: 'Composes plans as grouped activity rows on one shared time axis.',
    creatable: true,
  });
  types.register({
    key: 'time-strip',
    name: 'Time Strip',
    glyph: 'i-timeline',
    description: 'Stacks compatible time-based views as rows sharing one time axis.',
    creatable: true,
  });
  types.register({
    key: 'time-list',
    name: 'Time List',
    glyph: 'i-list',
    description: 'Presents a plan’s activities as a sortable, filterable time list.',
    creatable: true,
  });
  types.register({
    key: ACTIVITY_STATES_TYPE,
    name: ACTIVITY_STATES_NAME,
    glyph: 'i-timeline',
    description: 'Shared execution state for plan activities.',
    creatable: false,
  });
  types.register({
    key: PLAN_MONITORING_TYPE,
    name: PLAN_MONITORING_NAME,
    glyph: 'i-timeline',
    description: 'Shared plan execution-monitoring status and duration.',
    creatable: false,
  });

  const injector = inject(EnvironmentInjector);
  const metadata = inject(MetadataRegistry);

  const views = inject(ViewRegistry);
  views.register(new PlanViewProvider(injector));
  views.register(new GanttViewProvider(injector));
  views.register(new TimeStripViewProvider(injector));
  views.register(new TimeListViewProvider(injector));
  views.register(new EventTimelineViewProvider(injector));

  const composition = inject(CompositionApi);
  composition.addPolicy(new GanttCompositionPolicy());
  composition.addPolicy(new TimelineCompositionPolicy(metadata));
  composition.addPolicy(new TimeListCompositionPolicy());

  const inspectors = inject(InspectorViewRegistry);
  inspectors.register(new ActivityInspectorViewProvider(injector));
  inspectors.register(new PlanMonitoringViewProvider(injector));

  const interceptors = inject(InterceptorRegistry);
  interceptors.register(new ActivityStatesInterceptor());
  interceptors.register(new PlanMonitoringInterceptor());

  const roots = inject(RootRegistry);
  roots.addRoot(ACTIVITY_STATES_KEY);
  roots.addRoot(PLAN_MONITORING_KEY);
}
