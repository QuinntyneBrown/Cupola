import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { provideRouter } from '@angular/router';
import {
  Annotation,
  DomainObject,
  ObjectSaveResult,
  ObjectsGateway,
  TypeRegistry,
} from '@cupola/core';

import { FolderListViewComponent } from './folder-list-view.component';

function domainObject(key: string, over: Partial<DomainObject> = {}): DomainObject {
  return {
    identifier: { namespace: '', key },
    keyString: key,
    name: key,
    type: 'telemetry',
    location: null,
    composition: [],
    modified: '2026-07-13T09:12:44Z',
    ...over,
  };
}

class ObjectsGatewayStub extends ObjectsGateway {
  children: DomainObject[] = [];
  override getObject(): Observable<DomainObject> {
    return of(domainObject('unused'));
  }
  override getComposition(): Observable<DomainObject[]> {
    return of(this.children);
  }
  override getAnnotations(): Observable<Annotation[]> {
    return of([]);
  }
  override updateObject(): Observable<DomainObject> {
    return of(domainObject('unused'));
  }
  override saveObject(): Observable<ObjectSaveResult> {
    return of({ keyString: 'unused', outcome: 'updated', object: domainObject('unused') });
  }
  override getObjects(): Observable<DomainObject[]> {
    return of([]);
  }
  override saveObjects(): Observable<ObjectSaveResult[]> {
    return of([]);
  }
}

function setup(children: DomainObject[]): ComponentFixture<FolderListViewComponent> {
  const gateway = new ObjectsGatewayStub();
  gateway.children = children;
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: ObjectsGateway, useValue: gateway }],
  });
  TestBed.inject(TypeRegistry).register({ key: 'telemetry', name: 'Telemetry Point' });
  const fixture = TestBed.createComponent(FolderListViewComponent);
  fixture.componentRef.setInput(
    'object',
    domainObject('layouts-lab', { type: 'folder', composition: children.map((c) => c.keyString) }),
  );
  fixture.detectChanges();
  return fixture;
}

describe('OMCT-C09-L2-03.04 Folder grid and list', () => {
  it('renders every folder child as a list row with type and modification time', () => {
    const fixture = setup([
      domainObject('pwr.bus_v', { name: 'Bus voltage' }),
      domainObject('cam.cupola', { name: 'Cupola camera' }),
    ]);

    const rows = [...fixture.nativeElement.querySelectorAll('[data-testid="child-row"]')];
    expect(rows).toHaveLength(2);
    expect(rows[0].getAttribute('data-key')).toBe('pwr.bus_v');
    expect(rows[0].textContent).toContain('Bus voltage');
    expect(rows[0].textContent).toContain('Telemetry Point');
    expect(rows[0].textContent).toContain('2026-07-13');
  });

  it('offers the grid/list toggle with the list presentation active', () => {
    const fixture = setup([]);

    const toggle = fixture.nativeElement.querySelector('[data-testid="folder-view-toggle"]');
    expect(toggle).toBeTruthy();
    const list = fixture.nativeElement.querySelector('[data-testid="folder-toggle-list"]');
    expect(list.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows the empty state for a folder without children', () => {
    const fixture = setup([]);

    expect(fixture.nativeElement.querySelector('[data-testid="empty-folder"]')).toBeTruthy();
  });
});
