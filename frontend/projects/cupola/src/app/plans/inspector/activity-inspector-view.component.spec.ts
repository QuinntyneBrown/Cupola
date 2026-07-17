import { EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  DomainObject,
  FormatRegistry,
  GlobalTimeContext,
  ObjectApi,
  TimeContext,
  UTCTimeFormat,
} from '@cupola/core';

import { ActivityInspectorViewComponent } from './activity-inspector-view.component';
import { ActivityInspectorViewProvider } from './activity-inspector-view-provider';
import { planActivitySelection } from './activity-selection';
import { PlanActivity } from '../plan/plan-model';

const plan: DomainObject = {
  identifier: { namespace: '', key: 'iss-plan' },
  keyString: 'iss-plan',
  name: 'ISS daily plan',
  type: 'plan',
  location: null,
  composition: [],
};

const activity: PlanActivity = {
  id: 'a1',
  name: 'Eclipse preparation',
  start: Date.UTC(2026, 6, 13, 8, 0, 0),
  end: Date.UTC(2026, 6, 13, 9, 30, 0),
  groupName: 'Station ops',
  type: 'Station ops',
  displayProperties: { crew: 'Reyes' },
  filterMetadata: {},
};

class FakeObjectApi {
  async get(): Promise<DomainObject> {
    return { ...plan, keyString: 'activity-states', configuration: { activities: {} } };
  }
  async save(object: DomainObject): Promise<{ keyString: string; outcome: string; object: DomainObject }> {
    return { keyString: object.keyString, outcome: 'created', object };
  }
}

describe('OMCT-C12-L2-01.04 Activity selection and inspection', () => {
  function render() {
    TestBed.configureTestingModule({
      providers: [
        { provide: ObjectApi, useClass: FakeObjectApi },
        { provide: TimeContext, useExisting: GlobalTimeContext },
      ],
    });
    TestBed.inject(FormatRegistry).register(new UTCTimeFormat());
    const fixture = TestBed.createComponent(ActivityInspectorViewComponent);
    fixture.componentRef.setInput('selection', [
      { element: document.createElement('div'), context: planActivitySelection(activity, plan) },
    ]);
    fixture.detectChanges();
    return fixture;
  }

  it('offers the activity inspector for a plan-activity selection', () => {
    const provider = new ActivityInspectorViewProvider(TestBed.inject(EnvironmentInjector));
    expect(
      provider.canView([
        { element: document.createElement('div'), context: planActivitySelection(activity, plan) },
      ]),
    ).toBe(true);
    expect(provider.canView([])).toBe(false);
  });

  it('shows the selected activity name, formatted timing, and display properties', () => {
    const element: HTMLElement = render().nativeElement;
    expect(element.querySelector('[data-testid="activity-inspector-name"]')?.textContent).toContain(
      'Eclipse preparation',
    );
    expect(element.querySelector('[data-testid="activity-inspector-start"]')?.textContent).toContain(
      '2026-07-13',
    );
    expect(
      element.querySelector('[data-testid="activity-inspector-duration"]')?.textContent,
    ).toContain('01:30:00');
    const prop = element.querySelector('[data-testid="activity-inspector-prop"][data-key="crew"]');
    expect(prop?.textContent).toContain('Reyes');
  });
});
