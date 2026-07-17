import { Subject } from 'rxjs';
import { DomainObject, TelemetryValue, TimeBounds } from '@cupola/core';

import { TelemetryStream, WideDatum } from './telemetry-stream';

function object(): DomainObject {
  return {
    identifier: { namespace: '', key: 'pwr.bus_v' },
    keyString: 'pwr.bus_v',
    name: 'Bus voltage',
    type: 'telemetry',
    location: null,
    composition: [],
    telemetry: { hints: ['range'], unit: 'V' },
  };
}

class TelemetryApiStub {
  requests: { bounds: TimeBounds }[] = [];
  history: TelemetryValue[] = [];
  emit: (datum: WideDatum) => void = () => undefined;
  request(_object: DomainObject, options: { bounds: TimeBounds }): Promise<TelemetryValue[]> {
    this.requests.push({ bounds: options.bounds });
    return Promise.resolve(this.history);
  }
  subscribe(_object: DomainObject, callback: (datum: WideDatum) => void): () => void {
    this.emit = callback;
    return () => undefined;
  }
}

class TimeContextStub {
  private current: TimeBounds = { start: 1000, end: 2000 };
  readonly bounds$ = new Subject<TimeBounds>();
  bounds(): TimeBounds {
    return this.current;
  }
  timeSystem() {
    return { key: 'utc', name: 'UTC', timeFormat: 'utc' };
  }
  boundsChanged() {
    return this.bounds$.asObservable();
  }
  setBounds(bounds: TimeBounds): void {
    this.current = bounds;
    this.bounds$.next(bounds);
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const datum = (timestamp: number, value: number): TelemetryValue => ({
  keyString: 'pwr.bus_v',
  timestamp: new Date(timestamp).toISOString(),
  value,
});

describe('TelemetryStream', () => {
  it('issues exactly one historical request for the active bounds on start (02.01)', async () => {
    const api = new TelemetryApiStub();
    api.history = [datum(1500, 29)];
    const time = new TimeContextStub();
    const stream = new TelemetryStream(object(), api as never, time as never);
    stream.start();
    await flush();

    expect(api.requests).toHaveLength(1);
    expect(api.requests[0].bounds).toEqual({ start: 1000, end: 2000 });
    expect(stream.points()).toHaveLength(1);
  });

  it('appends realtime data within the window (02.02)', async () => {
    const api = new TelemetryApiStub();
    const time = new TimeContextStub();
    const stream = new TelemetryStream(object(), api as never, time as never);
    stream.start();
    await flush();

    api.emit(datum(1800, 31) as WideDatum);
    expect(stream.points().map((point) => point.value)).toEqual([31]);
  });

  it('re-requests when the followed bounds change', async () => {
    const api = new TelemetryApiStub();
    const time = new TimeContextStub();
    const stream = new TelemetryStream(object(), api as never, time as never);
    stream.start();
    await flush();

    time.setBounds({ start: 3000, end: 4000 });
    await flush();
    expect(api.requests).toHaveLength(2);
    expect(api.requests[1].bounds).toEqual({ start: 3000, end: 4000 });
  });

  it('does not follow the conductor once detached (02.06 pause)', async () => {
    const api = new TelemetryApiStub();
    const time = new TimeContextStub();
    const stream = new TelemetryStream(object(), api as never, time as never);
    stream.start();
    await flush();

    stream.setFollowing(false);
    time.setBounds({ start: 3000, end: 4000 });
    await flush();
    expect(api.requests).toHaveLength(1);

    // A paused pan/zoom still re-requests explicitly, without resuming.
    await stream.reload({ start: 5000, end: 6000 });
    expect(api.requests).toHaveLength(2);
    expect(api.requests[1].bounds).toEqual({ start: 5000, end: 6000 });
  });
});
