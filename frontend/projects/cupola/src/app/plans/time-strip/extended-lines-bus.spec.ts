import { createTimeScale } from '../plan/time-scale';
import { ExtendedLine, ExtendedLinesBus } from './extended-lines-bus';

describe('OMCT-C12-L2-02.05 Extended event lines', () => {
  it('publishes an extended-line position to subscribers', () => {
    const bus = new ExtendedLinesBus();
    const received: (ExtendedLine | null)[] = [];
    bus.changes.subscribe((line) => received.push(line));

    bus.publish({ sourceKey: 'events', timestamp: 1500 });
    expect(received).toEqual([{ sourceKey: 'events', timestamp: 1500 }]);
  });

  it('clears the extended line when null is published', () => {
    const bus = new ExtendedLinesBus();
    const received: (ExtendedLine | null)[] = [];
    bus.changes.subscribe((line) => received.push(line));

    bus.publish({ sourceKey: 'events', timestamp: 1500 });
    bus.publish(null);
    expect(received).toEqual([{ sourceKey: 'events', timestamp: 1500 }, null]);
  });

  it('aligns the published instant to the same offset on every row scale', () => {
    // Every strip row shares the strip's scale, so a published timestamp maps to
    // one aligned offset regardless of which row it renders on.
    const scale = createTimeScale({ start: 1000, end: 2000 });
    const timestamp = 1500;
    expect(scale.offset(timestamp)).toBe(50);
    expect(scale.contains(timestamp)).toBe(true);
  });
});
