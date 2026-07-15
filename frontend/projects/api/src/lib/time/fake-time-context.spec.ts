import { FakeTimeContext } from './fake-time-context';

describe('FakeTimeContext', () => {
  let context: FakeTimeContext;

  beforeEach(() => {
    context = new FakeTimeContext();
  });

  it('starts with the UTC time system, empty fixed bounds', () => {
    expect(context.timeSystem().key).toBe('utc');
    expect(context.bounds()).toEqual({ start: 0, end: 0 });
    expect(context.mode()).toBe('fixed');
    expect(context.clockOffsets()).toBeNull();
  });

  it('applies bounds and emits the change', () => {
    const seen: { start: number; end: number }[] = [];
    context.boundsChanged().subscribe((bounds) => seen.push(bounds));

    context.setBounds({ start: 10, end: 20 });

    expect(context.bounds()).toEqual({ start: 10, end: 20 });
    expect(seen).toEqual([{ start: 10, end: 20 }]);
  });

  it('rejects bounds where end precedes start', () => {
    expect(() => context.setBounds({ start: 20, end: 10 })).toThrow('end < start');
  });
});
