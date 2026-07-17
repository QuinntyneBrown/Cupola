import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import {
  DomainObject,
  TelemetryApiService,
  TelemetryValue,
  TimeBounds,
  TimeContext,
} from '@cupola/core';

import { ImageryTimeViewComponent } from './imagery-time-view.component';

function camera(): DomainObject {
  return {
    identifier: { namespace: '', key: 'cam.aft' },
    keyString: 'cam.aft',
    name: 'Aft camera',
    type: 'telemetry',
    location: null,
    composition: [],
    telemetry: { hints: ['image'] },
  };
}

function image(time: number): TelemetryValue {
  return {
    keyString: 'cam.aft',
    timestamp: new Date(time).toISOString(),
    value: 0,
    url: `/imagery/frame-${(time / 30_000) % 4}.svg`,
  };
}

class FakeTimeContext {
  private current: TimeBounds;
  readonly changes = new Subject<TimeBounds>();
  constructor(bounds: TimeBounds) {
    this.current = bounds;
  }
  bounds(): TimeBounds {
    return this.current;
  }
  boundsChanged() {
    return this.changes.asObservable();
  }
  timeSystem() {
    return { key: 'utc' };
  }
  setBounds(bounds: TimeBounds): void {
    this.current = bounds;
    this.changes.next(bounds);
  }
}

class TelemetryApiStub {
  values: TelemetryValue[] = [];
  requests: { start: number; end: number }[] = [];
  request(_object: DomainObject, options: { bounds: { start: number; end: number } }) {
    this.requests.push(options.bounds);
    return Promise.resolve(
      this.values.filter((value) => {
        const time = Date.parse(value.timestamp);
        return time >= options.bounds.start && time <= options.bounds.end;
      }),
    );
  }
  subscribe(): () => void {
    return () => {};
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function setup(bounds: TimeBounds, values: TelemetryValue[]) {
  const context = new FakeTimeContext(bounds);
  const api = new TelemetryApiStub();
  api.values = values;
  TestBed.configureTestingModule({
    providers: [
      { provide: TelemetryApiService, useValue: api },
      { provide: TimeContext, useValue: new FakeTimeContext({ start: 0, end: 1 }) },
    ],
  });
  const fixture: ComponentFixture<ImageryTimeViewComponent> = TestBed.createComponent(
    ImageryTimeViewComponent,
  );
  fixture.componentRef.setInput('object', camera());
  fixture.componentRef.setInput('timeContext', context as unknown as TimeContext);
  fixture.componentRef.setInput('restricted', true);
  fixture.detectChanges();
  await flush();
  await flush();
  fixture.detectChanges();
  return { fixture, context, api };
}

function thumbs(fixture: ComponentFixture<ImageryTimeViewComponent>): HTMLElement[] {
  return [...fixture.nativeElement.querySelectorAll('[data-testid="imagery-track-thumb"]')];
}

describe('OMCT-C11-L2-01.05 Time-strip imagery', () => {
  it('positions thumbnails along the supplied shared axis with no time controls', async () => {
    const { fixture } = await setup({ start: 0, end: 120_000 }, [
      image(30_000),
      image(90_000),
    ]);

    const rendered = thumbs(fixture);
    expect(rendered).toHaveLength(2);
    expect(rendered[0].style.left).toBe('25%');
    expect(rendered[1].style.left).toBe('75%');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('shows images in new bounds and removes images outside them on bounds change', async () => {
    const { fixture, context } = await setup({ start: 0, end: 120_000 }, [
      image(30_000),
      image(90_000),
      image(150_000),
    ]);
    expect(thumbs(fixture)).toHaveLength(2);

    context.setBounds({ start: 120_000, end: 240_000 });
    await flush();
    await flush();
    fixture.detectChanges();

    const rendered = thumbs(fixture);
    expect(rendered).toHaveLength(1);
    expect(rendered[0].getAttribute('data-time')).toBe('150000');
  });
});
