import { normalizePlan, normalizePlanObject } from './plan-normalizer';
import { countActivities } from './plan-model';

describe('OMCT-C12-L2-01.01 Plan data mapping', () => {
  it('normalizes the standard upstream shape into groups and activities', () => {
    const groups = normalizePlan({
      'Station ops': [
        { name: 'Eclipse preparation', start: 100, end: 200, type: 'Station ops' },
        { name: 'Array repointing', start: 150, end: 300, type: 'Station ops' },
      ],
      Crew: [{ name: 'Cupola photo survey', start: 220, end: 260, type: 'Crew' }],
    });

    expect(groups.map((group) => group.name)).toEqual(['Station ops', 'Crew']);
    expect(countActivities(groups)).toBe(3);
    const first = groups[0].activities[0];
    expect(first.name).toBe('Eclipse preparation');
    expect(first.start).toBe(100);
    expect(first.end).toBe(200);
    expect(first.groupName).toBe('Station ops');
  });

  it('parses ISO timestamps to epoch milliseconds', () => {
    const groups = normalizePlan({
      Ops: [{ name: 'A', start: '2026-07-13T08:00:00Z', end: '2026-07-13T09:30:00Z' }],
    });
    expect(groups[0].activities[0].start).toBe(Date.parse('2026-07-13T08:00:00Z'));
    expect(groups[0].activities[0].end).toBe(Date.parse('2026-07-13T09:30:00Z'));
  });

  it('normalizes source-mapped raw data for activities, group, start, end, identity, display, and filter', () => {
    const groups = normalizePlan(
      {
        rows: [
          {
            uid: 'a1',
            name: 'Battery swap',
            lane: 'EVA',
            begin: 10,
            finish: 40,
            crew: 'Reyes',
            priority: 'high',
          },
          { uid: 'a2', name: 'Comm pass', lane: 'Comms', begin: 20, finish: 30, crew: 'Ito' },
        ],
      },
      {
        activities: 'rows',
        groupId: 'lane',
        start: 'begin',
        end: 'finish',
        id: 'uid',
        displayProperties: ['crew', 'priority'],
        filterMetadata: ['crew'],
      },
    );

    expect(groups.map((group) => group.name)).toEqual(['EVA', 'Comms']);
    const eva = groups[0].activities[0];
    expect(eva.id).toBe('a1');
    expect(eva.name).toBe('Battery swap');
    expect(eva.start).toBe(10);
    expect(eva.end).toBe(40);
    expect(eva.displayProperties).toEqual({ crew: 'Reyes', priority: 'high' });
    expect(eva.filterMetadata).toEqual({ crew: 'Reyes' });
  });

  it('returns no groups for absent or malformed plan data', () => {
    expect(normalizePlan(undefined)).toEqual([]);
    expect(normalizePlan(null)).toEqual([]);
    expect(normalizePlan(42)).toEqual([]);
  });

  it('reads plan data from a domain object configuration', () => {
    const groups = normalizePlanObject({
      identifier: { namespace: '', key: 'p' },
      keyString: 'p',
      name: 'Plan',
      type: 'plan',
      location: null,
      composition: [],
      configuration: { planData: { Ops: [{ name: 'X', start: 0, end: 1 }] } },
    });
    expect(groups).toHaveLength(1);
    expect(groups[0].activities[0].name).toBe('X');
  });
});
