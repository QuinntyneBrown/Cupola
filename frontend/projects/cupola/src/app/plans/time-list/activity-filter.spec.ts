import { PlanActivity } from '../plan/plan-model';
import { filterActivities } from './activity-filter';

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

const bounds = { start: 0, end: 1000 };

describe('OMCT-C12-L2-03.02 Activity filtering', () => {
  const activities = [
    activity({ id: 'past', name: 'Eclipse preparation', start: 0, end: 100 }),
    activity({ id: 'current', name: 'Suit telemetry watch', start: 150, end: 400 }),
    activity({ id: 'future', name: 'LEE checkout', start: 600, end: 800 }),
  ];
  const now = 250;

  it('filters by name substring, case-insensitively', () => {
    const result = filterActivities(activities, { name: 'eclipse' }, bounds, now);
    expect(result.map((a) => a.id)).toContain('past');
    expect(result.map((a) => a.id)).not.toContain('future');
  });

  it('filters by temporal class', () => {
    const result = filterActivities(activities, { temporalClasses: ['past'] }, bounds, now);
    expect(result.map((a) => a.id)).toEqual(['past', 'current']);
  });

  it('always includes an in-progress activity regardless of the filter', () => {
    const result = filterActivities(activities, { name: 'no-such-name' }, bounds, now);
    expect(result.map((a) => a.id)).toEqual(['current']);
  });

  it('filters by configured metadata', () => {
    const list = [
      activity({ id: 'a', name: 'A', start: 500, end: 600, filterMetadata: { crew: 'Reyes' } }),
      activity({ id: 'b', name: 'B', start: 500, end: 600, filterMetadata: { crew: 'Ito' } }),
    ];
    const result = filterActivities(list, { metadata: { crew: 'reyes' } }, bounds, 0);
    expect(result.map((a) => a.id)).toEqual(['a']);
  });

  it('excludes activities outside the active bounds', () => {
    const list = [activity({ id: 'far', start: 5000, end: 6000 })];
    expect(filterActivities(list, {}, bounds, 0)).toHaveLength(0);
  });
});
