import { TestBed } from '@angular/core/testing';
import { EMPTY, Observable, of } from 'rxjs';
import {
  Annotation,
  CompositionApi,
  DefaultMetadataProvider,
  DomainObject,
  InspectorViewRegistry,
  MetadataRegistry,
  ObjectSaveResult,
  ObjectsGateway,
  TypeRegistry,
  ViewRegistry,
} from '@cupola/core';

import { registerTabularViews } from './register-tabular-views';

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
  TestBed.inject(MetadataRegistry).addProvider(TestBed.inject(DefaultMetadataProvider));
  TestBed.runInInjectionContext(() => registerTabularViews());
}

describe('registerTabularViews', () => {
  it('registers the tabular and gauge types as creatable', () => {
    setup();
    const types = TestBed.inject(TypeRegistry);
    for (const key of ['table', 'lad-table', 'lad-table-set', 'gauge', 'autoflow']) {
      expect(types.get(key)).toMatchObject({ creatable: true });
    }
  });

  it('seeds the default gauge configuration on creation', () => {
    setup();
    const gauge = object({ type: 'gauge' });
    TestBed.inject(TypeRegistry).get('gauge')?.initialize?.(gauge);
    expect(gauge.configuration?.['gauge']).toMatchObject({ form: 'filled-dial', boundsMode: 'manual' });
  });

  it('enforces the LAD, gauge, and autoflow composition policies', () => {
    setup();
    const composition = TestBed.inject(CompositionApi);
    const telemetry = object({ type: 'telemetry', telemetry: { hints: ['range'] } });

    const lad = object({ keyString: 'lad', type: 'lad-table' });
    expect(composition.checkPolicy(lad, telemetry)).toBe(true);
    expect(composition.checkPolicy(lad, object({ type: 'folder' }))).toBe(false);

    const set = object({ keyString: 'set', type: 'lad-table-set' });
    expect(composition.checkPolicy(set, object({ type: 'lad-table' }))).toBe(true);
    expect(composition.checkPolicy(set, telemetry)).toBe(false);

    const gauge = object({ keyString: 'g', type: 'gauge' });
    expect(composition.checkPolicy(gauge, telemetry)).toBe(true);
    expect(composition.checkPolicy(gauge, object({ type: 'folder' }))).toBe(false);

    const autoflow = object({ keyString: 'auto', type: 'autoflow' });
    expect(composition.checkPolicy(autoflow, telemetry)).toBe(true);
    expect(composition.checkPolicy(autoflow, object({ type: 'folder' }))).toBe(false);
  });

  it('registers the LAD, gauge, and autoflow view providers and gauge inspector', () => {
    setup();
    const views = TestBed.inject(ViewRegistry);
    expect(views.applicableViews(object({ type: 'lad-table' }), []).map((v) => v.key)).toContain('lad-table');
    expect(views.applicableViews(object({ type: 'lad-table-set' }), []).map((v) => v.key)).toContain('lad-table-set');
    expect(views.applicableViews(object({ type: 'gauge' }), []).map((v) => v.key)).toContain('gauge');
    expect(views.applicableViews(object({ type: 'autoflow' }), []).map((v) => v.key)).toContain('autoflow');

    const inspectors = TestBed.inject(InspectorViewRegistry);
    const applicable = inspectors
      .applicableViews([
        { element: document.createElement('div'), context: { key: 'g', object: object({ type: 'gauge' }) } },
      ])
      .map((view) => view.key);
    expect(applicable).toContain('gauge-options');
  });
});
