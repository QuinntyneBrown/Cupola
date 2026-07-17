import { PlanActivity } from '../plan/plan-model';
import { sortActivities } from './activity-sorter';

function activity(overrides: Partial<PlanActivity>): PlanActivity {
  return {
    id: 'id',
    name: 'Activity',
    start: 0,
    end: 100,
    groupName: 'Ops',
    displayProperties: {},
    filterMetadata: {},
    ...overrides,
  };
}

describe('OMCT-C12-L2-03.03 Activity sorting', () => {
  const activities = [
    activity({ id: 'b', name: 'Bravo', start: 300, end: 900 }),
    activity({ id: 'a', name: 'Alpha', start: 100, end: 400 }),
    activity({ id: 'c', name: 'Charlie', start: 200, end: 260 }),
  ];

  it('sorts ascending by start', () => {
    expect(sortActivities(activities, 'start', 'asc').map((a) => a.id)).toEqual(['a', 'c', 'b']);
  });

  it('sorts descending by start', () => {
    expect(sortActivities(activities, 'start', 'desc').map((a) => a.id)).toEqual(['b', 'c', 'a']);
  });

  it('sorts by name', () => {
    expect(sortActivities(activities, 'name', 'asc').map((a) => a.id)).toEqual(['a', 'b', 'c']);
  });

  it('sorts by duration', () => {
    // durations: a=300, b=600, c=60
    expect(sortActivities(activities, 'duration', 'asc').map((a) => a.id)).toEqual(['c', 'a', 'b']);
  });

  it('does not mutate the input array', () => {
    const input = [...activities];
    sortActivities(input, 'start', 'desc');
    expect(input.map((a) => a.id)).toEqual(['b', 'a', 'c']);
  });
});
