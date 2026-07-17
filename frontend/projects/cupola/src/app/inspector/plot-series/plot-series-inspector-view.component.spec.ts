import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  DefaultMetadataProvider,
  DomainObject,
  MetadataRegistry,
  ObjectApi,
  ObjectSaveResult,
  ObjectUpdatesService,
  SelectedItem,
} from '@cupola/core';

import { PlotSeriesInspectorViewComponent } from './plot-series-inspector-view.component';

function telemetry(keyString: string): DomainObject {
  return {
    identifier: { namespace: '', key: keyString },
    keyString,
    name: keyString,
    type: 'telemetry',
    location: null,
    composition: [],
    telemetry: { hints: ['range'], unit: 'V' },
  };
}

function overlay(configuration?: Record<string, unknown>): DomainObject {
  return {
    identifier: { namespace: '', key: 'op' },
    keyString: 'op',
    name: 'Overlay',
    type: 'overlay-plot',
    location: null,
    composition: ['a', 'b'],
    telemetry: null,
    configuration,
  };
}

class ObjectApiStub {
  readonly saved: DomainObject[] = [];
  private readonly store: Record<string, DomainObject> = { a: telemetry('a'), b: telemetry('b') };
  get(keyString: string): Promise<DomainObject> {
    return Promise.resolve(this.store[keyString]);
  }
  save(object: DomainObject): Promise<ObjectSaveResult> {
    this.saved.push(object);
    return Promise.resolve({ keyString: object.keyString, outcome: 'updated', object });
  }
}

class ObjectUpdatesStub {
  emitLocal(): void {}
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function selectionFor(object: DomainObject): SelectedItem[] {
  return [{ element: document.createElement('div'), context: { key: object.keyString, object, type: 'object' } }];
}

async function setup(object: DomainObject) {
  TestBed.resetTestingModule();
  const api = new ObjectApiStub();
  TestBed.configureTestingModule({
    providers: [
      { provide: ObjectApi, useValue: api },
      { provide: ObjectUpdatesService, useClass: ObjectUpdatesStub },
    ],
  });
  TestBed.inject(MetadataRegistry).addProvider(TestBed.inject(DefaultMetadataProvider));
  const fixture = TestBed.createComponent(PlotSeriesInspectorViewComponent);
  fixture.componentRef.setInput('selection', selectionFor(object));
  fixture.detectChanges();
  await flush();
  fixture.detectChanges();
  return { fixture, api };
}

function lastConfig(api: ObjectApiStub): Record<string, unknown> {
  return api.saved[api.saved.length - 1].configuration as Record<string, unknown>;
}

async function click(fixture: ComponentFixture<PlotSeriesInspectorViewComponent>, selector: string) {
  (fixture.nativeElement.querySelector(selector) as HTMLElement).click();
  await flush();
  fixture.detectChanges();
}

describe('OMCT-C07-L2-04.05 Inspector persistence', () => {
  it('lists a row per composed series', async () => {
    const { fixture } = await setup(overlay());
    expect(fixture.nativeElement.querySelectorAll('[data-testid="plot-series-row"]')).toHaveLength(2);
  });

  it('persists a series colour change to configuration.plot', async () => {
    const { fixture, api } = await setup(overlay());
    await click(fixture, '[data-testid="plot-series-row"][data-key="a"] [data-testid="plot-series-color"][data-slot="4"]');
    expect((lastConfig(api)['plot'] as { series: Record<string, { colorSlot: number }> }).series['a'].colorSlot).toBe(4);
  });

  it('persists the y-axis mode option', async () => {
    const { fixture, api } = await setup(overlay());
    await click(fixture, '[data-testid="plot-opt-yaxis"][data-value="per-series"]');
    expect((lastConfig(api)['plot'] as { yAxisMode: string }).yAxisMode).toBe('per-series');
  });

  it('persists a grid toggle', async () => {
    const { fixture, api } = await setup(overlay());
    const toggle = fixture.nativeElement.querySelector('[data-testid="plot-opt-grid"]') as HTMLInputElement;
    toggle.checked = false;
    toggle.dispatchEvent(new Event('change'));
    await flush();
    expect((lastConfig(api)['plot'] as { grid: boolean }).grid).toBe(false);
  });
});
