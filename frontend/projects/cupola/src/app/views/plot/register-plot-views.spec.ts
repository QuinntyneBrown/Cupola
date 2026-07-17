import { TestBed } from '@angular/core/testing';
import { EMPTY, Observable, of } from 'rxjs';
import {
  Annotation,
  CompositionApi,
  DefaultMetadataProvider,
  DomainObject,
  MetadataRegistry,
  ObjectSaveResult,
  ObjectsGateway,
  TypeRegistry,
  ViewRegistry,
} from '@cupola/core';

import { registerPlotViews } from './register-plot-views';

class ObjectsGatewayStub extends ObjectsGateway {
  override getObject(): Observable<DomainObject> {
    return EMPTY;
  }
  override getComposition(): Observable<DomainObject[]> {
    return of([]);
  }
  override getAnnotations(): Observable<Annotation[]> {
    return of([]);
  }
  override updateObject(): Observable<DomainObject> {
    return EMPTY;
  }
  override saveObject(): Observable<ObjectSaveResult> {
    return EMPTY;
  }
  override getObjects(): Observable<DomainObject[]> {
    return EMPTY;
  }
  override saveObjects(): Observable<ObjectSaveResult[]> {
    return of([]);
  }
}

function object(overrides: Partial<DomainObject>): DomainObject {
  return {
    identifier: { namespace: '', key: 'k' },
    keyString: 'k',
    name: 'k',
    type: 'folder',
    location: null,
    composition: [],
    ...overrides,
  };
}

function setup() {
  TestBed.configureTestingModule({
    providers: [{ provide: ObjectsGateway, useClass: ObjectsGatewayStub }],
  });
  TestBed.runInInjectionContext(() => registerPlotViews());
}

describe('registerPlotViews', () => {
  it('registers the plot and chart types as creatable', () => {
    setup();
    const types = TestBed.inject(TypeRegistry);
    for (const key of ['overlay-plot', 'stacked-plot', 'bar-graph', 'scatter-plot']) {
      expect(types.get(key)).toMatchObject({ creatable: true });
    }
  });

  it('seeds the default plot configuration on creation', () => {
    setup();
    const overlay = object({ type: 'overlay-plot' });
    TestBed.inject(TypeRegistry).get('overlay-plot')?.initialize?.(overlay);
    expect(overlay.configuration?.['plot']).toMatchObject({ grid: true, yAxisMode: 'single' });
  });

  it('enforces the overlay and stacked composition policies', () => {
    setup();
    const composition = TestBed.inject(CompositionApi);
    // The app registers the default metadata provider (C06) before plot views.
    TestBed.inject(MetadataRegistry).addProvider(TestBed.inject(DefaultMetadataProvider));
    const overlay = object({ keyString: 'op', type: 'overlay-plot' });
    expect(composition.checkPolicy(overlay, object({ type: 'telemetry', telemetry: { hints: ['range'] } }))).toBe(true);
    expect(composition.checkPolicy(overlay, object({ type: 'folder' }))).toBe(false);

    const bar = object({ keyString: 'bg', type: 'bar-graph' });
    expect(composition.checkPolicy(bar, object({ type: 'condition-set' }))).toBe(false);
  });

  it('registers the plot, stacked, bar, and scatter view providers', () => {
    setup();
    const views = TestBed.inject(ViewRegistry);
    expect(views.applicableViews(object({ type: 'overlay-plot' }), []).map((view) => view.key)).toContain('plot-single');
    expect(views.applicableViews(object({ type: 'stacked-plot' }), []).map((view) => view.key)).toContain('plot-stacked');
    expect(views.applicableViews(object({ type: 'bar-graph' }), []).map((view) => view.key)).toContain('bar-graph');
    expect(views.applicableViews(object({ type: 'scatter-plot' }), []).map((view) => view.key)).toContain('scatter-plot');
  });
});
