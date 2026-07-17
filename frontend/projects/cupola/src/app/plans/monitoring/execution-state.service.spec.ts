import { TestBed } from '@angular/core/testing';
import { DomainObject, ObjectApi, ObjectSaveResult } from '@cupola/core';

import { ExecutionStateService } from './execution-state.service';
import {
  ACTIVITY_STATES_KEY,
  PLAN_MONITORING_KEY,
  activityStatesDefault,
  planMonitoringDefault,
} from './activity-states';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

class FakeObjectApi {
  readonly store = new Map<string, DomainObject>();
  conflictOnce = false;
  saves = 0;

  async get(keyString: string): Promise<DomainObject> {
    const stored = this.store.get(keyString);
    if (stored) {
      return clone(stored);
    }
    return keyString === ACTIVITY_STATES_KEY ? activityStatesDefault() : planMonitoringDefault();
  }

  async save(object: DomainObject): Promise<ObjectSaveResult> {
    this.saves += 1;
    if (this.conflictOnce) {
      this.conflictOnce = false;
      return { keyString: object.keyString, outcome: 'conflict', object: this.store.get(object.keyString) ?? null };
    }
    const stored: DomainObject = { ...object, persisted: '2026-07-16T00:00:00Z' };
    this.store.set(object.keyString, clone(stored));
    return { keyString: object.keyString, outcome: object.persisted ? 'updated' : 'created', object: stored };
  }
}

function setup(): { service: ExecutionStateService; api: FakeObjectApi } {
  const api = new FakeObjectApi();
  TestBed.configureTestingModule({
    providers: [ExecutionStateService, { provide: ObjectApi, useValue: api }],
  });
  return { service: TestBed.inject(ExecutionStateService), api };
}

describe('OMCT-C12-L2-04.02 Activity execution state', () => {
  it('persists the selected execution state by activity identifier', async () => {
    const { service, api } = setup();
    await service.setActivityState('a1', 'in-progress');

    const stored = api.store.get(ACTIVITY_STATES_KEY)!;
    expect((stored.configuration as { activities: Record<string, string> }).activities).toEqual({
      a1: 'in-progress',
    });
    expect(await service.getActivityState('a1')).toBe('in-progress');
  });

  it('merges additional activity entries without dropping earlier ones', async () => {
    const { service, api } = setup();
    await service.setActivityState('a1', 'completed');
    await service.setActivityState('a2', 'aborted');

    expect((api.store.get(ACTIVITY_STATES_KEY)!.configuration as { activities: Record<string, string> }).activities).toEqual({
      a1: 'completed',
      a2: 'aborted',
    });
  });

  it('retries once and still persists on a save conflict', async () => {
    const { service, api } = setup();
    api.conflictOnce = true;
    await service.setActivityState('a1', 'in-progress');

    expect(api.saves).toBe(2);
    expect(await service.getActivityState('a1')).toBe('in-progress');
  });
});

describe('OMCT-C12-L2-04.04 Plan monitoring status', () => {
  it('persists monitoring status and duration by plan identifier', async () => {
    const { service, api } = setup();
    await service.setPlanMonitoring('iss-plan', { status: 'active' });
    await service.setPlanMonitoring('iss-plan', { duration: 12_600_000 });

    const stored = api.store.get(PLAN_MONITORING_KEY)!;
    expect((stored.configuration as { plans: Record<string, unknown> }).plans).toEqual({
      'iss-plan': { status: 'active', duration: 12_600_000 },
    });
    expect(await service.getPlanMonitoring('iss-plan')).toEqual({
      status: 'active',
      duration: 12_600_000,
    });
  });
});
