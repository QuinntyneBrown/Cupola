import { TestBed } from '@angular/core/testing';

import { ClockRegistry } from './clock-registry';
import { GlobalTimeContext } from './global-time-context';
import { IndependentTimeContext } from './independent-time-context';
import { TimeSystemRegistry } from './time-system-registry';

describe('OMCT-C05-L2-02.02 IndependentTimeContext', () => {
  it('maintains bounds independent of the global context', () => {
    TestBed.configureTestingModule({});
    const systems = TestBed.inject(TimeSystemRegistry);
    const clocks = TestBed.inject(ClockRegistry);
    const global = TestBed.inject(GlobalTimeContext);
    const independent = new IndependentTimeContext(systems, clocks);

    global.setBounds({ start: 0, end: 100 });
    independent.setBounds({ start: 500, end: 600 });

    expect(global.bounds()).toEqual({ start: 0, end: 100 });
    expect(independent.bounds()).toEqual({ start: 500, end: 600 });
  });
});
