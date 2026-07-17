import { Locator, Page } from '@playwright/test';

/** Page object for C12 plan, gantt, time-strip, event-track, and time-list views. */
export class PlanPage {
  // Plan view
  readonly view: Locator;
  readonly chart: Locator;
  readonly groups: Locator;
  readonly rows: Locator;
  readonly activities: Locator;
  readonly axisTicks: Locator;

  // Gantt
  readonly gantt: Locator;
  readonly ganttPlans: Locator;
  readonly ganttRows: Locator;

  // Time strip
  readonly strip: Locator;
  readonly stripRows: Locator;
  readonly timeAxis: Locator;
  readonly timeAxisTicks: Locator;
  readonly eventMarkers: Locator;
  readonly extendedLine: Locator;
  readonly independentTime: Locator;
  readonly modeToggle: Locator;

  // Time list
  readonly timeList: Locator;
  readonly timeListRows: Locator;
  readonly filterInput: Locator;
  readonly classSelect: Locator;

  // Inspector
  readonly activityName: Locator;
  readonly activityStart: Locator;
  readonly activityDuration: Locator;
  readonly executionState: Locator;
  readonly monitoringStatus: Locator;
  readonly monitoringDuration: Locator;

  constructor(readonly page: Page) {
    this.view = page.getByTestId('plan-view');
    this.chart = page.getByTestId('plan-chart');
    this.groups = page.getByTestId('plan-group');
    this.rows = page.getByTestId('plan-row');
    this.activities = page.getByTestId('plan-activity');
    this.axisTicks = page.getByTestId('plan-axis-tick');

    this.gantt = page.getByTestId('gantt-chart');
    this.ganttPlans = page.getByTestId('gantt-plan');
    this.ganttRows = page.getByTestId('gantt-row');

    this.strip = page.getByTestId('time-strip-chart');
    this.stripRows = page.getByTestId('strip-row');
    this.timeAxis = page.getByTestId('time-axis');
    this.timeAxisTicks = page.getByTestId('time-axis-tick');
    this.eventMarkers = page.getByTestId('event-marker');
    this.extendedLine = page.getByTestId('extended-line');
    this.independentTime = page.getByTestId('strip-independent-time');
    this.modeToggle = page.getByTestId('strip-mode-toggle');

    this.timeList = page.getByTestId('time-list');
    this.timeListRows = page.getByTestId('time-list-row');
    this.filterInput = page.getByTestId('time-list-filter');
    this.classSelect = page.getByTestId('time-list-class');

    this.activityName = page.getByTestId('activity-inspector-name');
    this.activityStart = page.getByTestId('activity-inspector-start');
    this.activityDuration = page.getByTestId('activity-inspector-duration');
    this.executionState = page.getByTestId('activity-execution-state');
    this.monitoringStatus = page.getByTestId('plan-monitoring-status');
    this.monitoringDuration = page.getByTestId('plan-monitoring-duration');
  }

  group(name: string): Locator {
    return this.page.locator(`[data-testid="plan-group"][data-group="${name}"]`);
  }

  /** Activity bars within a named group. */
  groupActivities(name: string): Locator {
    return this.group(name).getByTestId('plan-activity');
  }

  /** Plan-row (swimlane row) elements within a named group. */
  groupRows(name: string): Locator {
    return this.group(name).getByTestId('plan-row');
  }

  stripRow(kind: string): Locator {
    return this.page.locator(`[data-testid="strip-row"][data-kind="${kind}"]`);
  }

  sortHeader(property: 'name' | 'start' | 'end' | 'duration'): Locator {
    return this.page.getByTestId(`time-list-sort-${property}`);
  }

  timeListName(index: number): Locator {
    return this.timeListRows.nth(index).getByTestId('time-list-name');
  }
}
