import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import {
  ActionRegistry,
  DomainObject,
  ObjectApi,
  ObjectsGateway,
  TelemetryApiService,
  TelemetryValue,
  TimeBounds,
  TimeContext,
} from '@cupola/core';

import { RelatedTelemetryService } from './related-telemetry.service';
import { ImageryViewComponent } from './imagery-view.component';

function camera(over: Partial<DomainObject> = {}): DomainObject {
  return {
    identifier: { namespace: '', key: 'cam.aft' },
    keyString: 'cam.aft',
    name: 'Aft camera',
    type: 'telemetry',
    location: null,
    composition: [],
    telemetry: {
      hints: ['image'],
      imagery: {
        layers: [
          { key: 'reticle', name: 'Reticle', source: '/imagery/layers/reticle.svg', visible: true },
        ],
        relatedTelemetry: ['pwr.bus_v'],
      },
    },
    ...over,
  };
}

function image(time: number, heading?: number): TelemetryValue {
  return {
    keyString: 'cam.aft',
    timestamp: new Date(time).toISOString(),
    value: 0,
    url: `/imagery/frame-${(time / 30_000) % 4}.svg`,
    heading,
  };
}

class FakeTimeContext {
  bounds(): TimeBounds {
    return { start: 0, end: 120_000 };
  }
  boundsChanged() {
    return new Subject<TimeBounds>().asObservable();
  }
  timeSystem() {
    return { key: 'utc' };
  }
}

class TelemetryApiStub {
  values: TelemetryValue[] = [];
  request(): Promise<TelemetryValue[]> {
    return Promise.resolve(this.values);
  }
  subscribe(): () => void {
    return () => {};
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function setup(values: TelemetryValue[], object = camera()) {
  const api = new TelemetryApiStub();
  api.values = values;
  const related = { sample: jest.fn().mockResolvedValue([]) };
  TestBed.configureTestingModule({
    providers: [
      { provide: TelemetryApiService, useValue: api },
      { provide: TimeContext, useValue: new FakeTimeContext() },
      {
        provide: ObjectApi,
        useValue: { supportsMutation: () => false, get: () => Promise.reject(new Error('x')) },
      },
      {
        provide: ObjectsGateway,
        useValue: { getAnnotations: () => of([]) },
      },
      { provide: RelatedTelemetryService, useValue: related },
    ],
  });
  const fixture: ComponentFixture<ImageryViewComponent> =
    TestBed.createComponent(ImageryViewComponent);
  fixture.componentRef.setInput('object', object);
  fixture.detectChanges();
  await flush();
  await flush();
  fixture.detectChanges();
  return { fixture, related, actions: TestBed.inject(ActionRegistry) };
}

describe('OMCT-C11-L2-01.02 Initial focused image', () => {
  it('focuses the most recent returned image within the active bounds on mount', async () => {
    const { fixture } = await setup([image(30_000), image(60_000), image(90_000)]);

    const focused = fixture.nativeElement.querySelector('[data-testid="focused-image"]');
    expect(focused.getAttribute('src')).toBe('/imagery/frame-3.svg');
    expect(fixture.nativeElement.querySelector('[data-testid="frame-time"]').textContent).toBe(
      new Date(90_000).toISOString(),
    );
    expect(fixture.nativeElement.querySelector('[data-testid="imagery-live"]')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="imagery-thumb"]'),
    ).toHaveLength(3);
  });
});

describe('OMCT-C11-L2-02.02 Viewable-area indicator', () => {
  it('shows the indicator only while zoom exceeds one', async () => {
    const { fixture } = await setup([image(30_000)]);
    expect(fixture.nativeElement.querySelector('[data-testid="viewable-area"]')).toBeNull();

    (
      fixture.nativeElement.querySelector('[data-testid="imagery-zoom-in"]') as HTMLElement
    ).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="viewable-area"]')).toBeTruthy();

    (
      fixture.nativeElement.querySelector('[data-testid="imagery-zoom-reset"]') as HTMLElement
    ).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="viewable-area"]')).toBeNull();
  });
});

describe('OMCT-C11-L2-02.03 Brightness and contrast', () => {
  it('applies the filter and restores both values to 100 percent on reset', async () => {
    const { fixture } = await setup([image(30_000)]);
    (
      fixture.nativeElement.querySelector('[data-testid="imagery-filters-toggle"]') as HTMLElement
    ).click();
    fixture.detectChanges();

    const brightness = fixture.nativeElement.querySelector(
      '[data-testid="imagery-brightness"]',
    ) as HTMLInputElement;
    brightness.value = '160';
    brightness.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const focused = fixture.nativeElement.querySelector(
      '[data-testid="focused-image"]',
    ) as HTMLElement;
    expect(focused.style.filter).toBe('brightness(160%) contrast(100%)');

    (
      fixture.nativeElement.querySelector('[data-testid="imagery-filters-reset"]') as HTMLElement
    ).click();
    fixture.detectChanges();
    expect(focused.style.filter).toBe('brightness(100%) contrast(100%)');
  });
});
