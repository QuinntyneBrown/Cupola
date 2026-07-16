import { TestBed } from '@angular/core/testing';
import { EMPTY, Observable, of } from 'rxjs';
import {
  Annotation,
  DomainObject,
  FaultManagementService,
  InspectorViewRegistry,
  ObjectApi,
  ObjectSaveResult,
  ObjectsGateway,
  RootRegistry,
  TypeRegistry,
  ViewRegistry,
} from '@cupola/core';

import { registerFaults } from './register-faults';
import { FAULT_ROOT_KEY } from './fault-root-provider';

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

function setup() {
  TestBed.configureTestingModule({
    providers: [{ provide: ObjectsGateway, useClass: ObjectsGatewayStub }],
  });
  TestBed.runInInjectionContext(() => registerFaults());
}

describe('OMCT-C14-L2-03.02 Fault root and views', () => {
  it('registers the fault-management root object', async () => {
    setup();

    expect(TestBed.inject(RootRegistry).getRoots()).toContain(FAULT_ROOT_KEY);
    expect(TestBed.inject(TypeRegistry).get('fault-management')).toMatchObject({
      name: 'Fault Management',
      creatable: false,
    });

    const root = await TestBed.inject(ObjectApi).get(FAULT_ROOT_KEY);
    expect(root).toMatchObject({
      keyString: FAULT_ROOT_KEY,
      type: 'fault-management',
      name: 'Fault Management',
    });
  });

  it('registers applicable fault list and inspector views', async () => {
    setup();

    const root = (await TestBed.inject(ObjectApi).get(FAULT_ROOT_KEY))!;
    const views = TestBed.inject(ViewRegistry).applicableViews(root, [root]);
    expect(views.map((view) => view.key)).toContain('fault-list');

    const inspectorViews = TestBed.inject(InspectorViewRegistry).applicableViews([
      { element: document.createElement('div'), context: { key: 'propulsion:f-1', type: 'fault' } },
    ]);
    expect(inspectorViews.map((view) => view.key)).toContain('fault-inspector');
  });

  it('configures the fault provider', () => {
    setup();

    expect(TestBed.inject(FaultManagementService).hasProvider()).toBe(true);
  });
});
