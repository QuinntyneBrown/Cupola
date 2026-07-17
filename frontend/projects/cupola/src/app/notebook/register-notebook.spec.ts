import { TestBed } from '@angular/core/testing';
import { EMPTY, Observable, of } from 'rxjs';
import {
  Annotation,
  DefaultNotificationService,
  DomainObject,
  NotificationService,
  ObjectSaveResult,
  ObjectsGateway,
  TypeRegistry,
  ViewRegistry,
  readNotebookConfiguration,
} from '@cupola/core';

import { registerNotebook } from './register-notebook';

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

function setup(): void {
  TestBed.configureTestingModule({
    providers: [
      { provide: ObjectsGateway, useClass: ObjectsGatewayStub },
      { provide: NotificationService, useExisting: DefaultNotificationService },
    ],
  });
  TestBed.runInInjectionContext(() => registerNotebook());
}

describe('OMCT-C13-L2-01.01 — Notebook creation', () => {
  it('registers standard and restricted notebook types as creatable', () => {
    setup();
    const types = TestBed.inject(TypeRegistry);
    expect(types.get('notebook')).toMatchObject({ creatable: true });
    expect(types.get('restricted-notebook')).toMatchObject({ creatable: true });
    expect(types.get('annotation')).toMatchObject({ creatable: false });
  });

  it('initializes a new notebook with one section and one page', () => {
    setup();
    const notebook = object({ type: 'notebook' });
    TestBed.inject(TypeRegistry).get('notebook')?.initialize?.(notebook);
    const config = readNotebookConfiguration(notebook);
    expect(config.sections).toHaveLength(1);
    expect(config.sections[0].pages).toHaveLength(1);
  });

  it('marks a restricted notebook and seeds its URL whitelist', () => {
    setup();
    const notebook = object({ type: 'restricted-notebook' });
    TestBed.inject(TypeRegistry).get('restricted-notebook')?.initialize?.(notebook);
    const config = readNotebookConfiguration(notebook);
    expect(config.sections).toHaveLength(1);
    expect(config.isRestricted).toBe(true);
    expect(config.urlWhitelist?.length).toBeGreaterThan(0);
  });

  it('registers a notebook view for standard and restricted notebooks', () => {
    setup();
    const views = TestBed.inject(ViewRegistry);
    const notebook = object({ type: 'notebook' });
    const restricted = object({ type: 'restricted-notebook' });
    expect(views.applicableViews(notebook, [notebook]).map((v) => v.key)).toContain(
      'notebook-view',
    );
    expect(views.applicableViews(restricted, [restricted]).map((v) => v.key)).toContain(
      'notebook-view',
    );
  });
});
