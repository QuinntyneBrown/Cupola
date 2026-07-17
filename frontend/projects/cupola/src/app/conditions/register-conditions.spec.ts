import { TestBed } from '@angular/core/testing';
import { EMPTY, Observable, of } from 'rxjs';
import {
  Annotation,
  CompositionApi,
  DomainObject,
  GlobalTimeContext,
  InspectorViewRegistry,
  ObjectSaveResult,
  ObjectsGateway,
  TimeContext,
  TypeRegistry,
  ViewRegistry,
} from '@cupola/core';

import { registerConditions } from './register-conditions';

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
    providers: [
      { provide: ObjectsGateway, useClass: ObjectsGatewayStub },
      { provide: TimeContext, useExisting: GlobalTimeContext },
    ],
  });
  TestBed.runInInjectionContext(() => registerConditions());
}

describe('registerConditions', () => {
  it('registers the C10 object types as creatable', () => {
    setup();
    const types = TestBed.inject(TypeRegistry);
    for (const key of ['condition-set', 'condition-widget', 'summary-widget', 'derived-telemetry']) {
      expect(types.get(key)).toMatchObject({ creatable: true });
    }
  });

  it('seeds a default condition when a condition set is created', () => {
    setup();
    const conditionSet = object({ type: 'condition-set' });
    TestBed.inject(TypeRegistry).get('condition-set')?.initialize?.(conditionSet);
    expect((conditionSet.configuration?.['conditions'] as unknown[]).length).toBe(1);
  });

  it('enforces the condition-set composition policy (01.01)', () => {
    setup();
    const composition = TestBed.inject(CompositionApi);
    const conditionSet = object({ keyString: 'cs', type: 'condition-set' });
    expect(composition.checkPolicy(conditionSet, object({ type: 'telemetry', telemetry: { hints: ['range'] } }))).toBe(
      true,
    );
    expect(composition.checkPolicy(conditionSet, object({ type: 'folder' }))).toBe(false);
  });

  it('registers the condition-set and filter views', () => {
    setup();
    const conditionSet = object({ keyString: 'cs', type: 'condition-set' });
    const views = TestBed.inject(ViewRegistry).applicableViews(conditionSet, [conditionSet]);
    expect(views.map((view) => view.key)).toContain('condition-set');

    const inspectorViews = TestBed.inject(InspectorViewRegistry).applicableViews([
      { element: document.createElement('div'), context: { key: 'cs', object: conditionSet } },
    ]);
    expect(inspectorViews.map((view) => view.key)).toContain('filters');
  });
});
