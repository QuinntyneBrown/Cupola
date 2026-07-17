import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import {
  ClockOffsets,
  DomainObject,
  TimeBounds,
  TimeContext,
  TimeMode,
  TimeSystem,
} from '@cupola/core';

import { SnapshotCaptureService } from './snapshot-capture.service';

class FakeTimeContext extends TimeContext {
  override timeSystem(): TimeSystem {
    return { key: 'utc', name: 'UTC' } as TimeSystem;
  }
  override bounds(): TimeBounds {
    return { start: 1000, end: 2000 };
  }
  override mode(): TimeMode {
    return 'fixed' as TimeMode;
  }
  override clockOffsets(): ClockOffsets | null {
    return null;
  }
  override setTimeSystem(): void {}
  override setBounds(): void {}
  override boundsChanged(): Observable<TimeBounds> {
    return of({ start: 1000, end: 2000 });
  }
  override modeChanged(): Observable<TimeMode> {
    return of('fixed' as TimeMode);
  }
  override tick(): Observable<number> {
    return of(0);
  }
}

function object(keyString: string, name: string): DomainObject {
  return {
    identifier: { namespace: '', key: keyString },
    keyString,
    name,
    type: 'telemetry',
    location: null,
    composition: [],
  };
}

describe('OMCT-C13-L2-02.02 — Embedded snapshot', () => {
  function setup(): SnapshotCaptureService {
    TestBed.configureTestingModule({
      providers: [SnapshotCaptureService, { provide: TimeContext, useClass: FakeTimeContext }],
    });
    return TestBed.inject(SnapshotCaptureService);
  }

  it('captures a view-reference to the object with its name, view key, and bounds', () => {
    const service = setup();
    const embed = service.capture(
      [object('power', 'Power'), object('pwr.bus_v', 'Bus voltage')],
      'plot-view',
    );

    expect(embed.objectKeyString).toBe('pwr.bus_v');
    expect(embed.objectName).toBe('Bus voltage');
    expect(embed.viewKey).toBe('plot-view');
    expect(embed.bounds).toEqual({ start: 1000, end: 2000 });
    expect(Date.parse(embed.capturedAt)).not.toBeNaN();
  });
});
