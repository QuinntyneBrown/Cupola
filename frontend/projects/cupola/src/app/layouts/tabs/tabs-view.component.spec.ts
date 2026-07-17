import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import {
  CupolaView,
  DomainObject,
  ObjectApi,
  ObjectUpdatesService,
  ViewProvider,
  ViewRegistry,
} from '@cupola/core';

import { TabsViewComponent } from './tabs-view.component';

function domainObject(key: string, over: Partial<DomainObject> = {}): DomainObject {
  return {
    identifier: { namespace: '', key },
    keyString: key,
    name: key,
    type: 'telemetry',
    location: null,
    composition: [],
    ...over,
  };
}

class ObjectApiStub {
  known = new Map<string, DomainObject>();
  get(keyString: string): Promise<DomainObject> {
    const object = this.known.get(keyString);
    return object ? Promise.resolve(object) : Promise.reject(new Error('missing'));
  }
}

class ObjectUpdatesStub {
  readonly subject = new Subject<DomainObject>();
  forKeyString() {
    return this.subject.asObservable();
  }
  emitLocal = jest.fn();
}

function countingProvider(): ViewProvider & { created: string[]; destroyed: string[] } {
  const provider = {
    key: 'generic',
    name: 'Generic',
    priority: 0,
    created: [] as string[],
    destroyed: [] as string[],
    canView: () => true,
    view(object: DomainObject): CupolaView {
      return {
        show: (element: HTMLElement) => {
          provider.created.push(object.keyString);
          element.appendChild(document.createTextNode(object.name));
        },
        destroy: () => {
          provider.destroyed.push(object.keyString);
        },
      };
    },
  };
  return provider;
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await flush();
  await flush();
  fixture.detectChanges();
}

async function setup(tabsObject: DomainObject, children: DomainObject[]) {
  const objectApi = new ObjectApiStub();
  for (const child of children) {
    objectApi.known.set(child.keyString, child);
  }
  TestBed.configureTestingModule({
    providers: [
      { provide: ObjectApi, useValue: objectApi },
      { provide: ObjectUpdatesService, useValue: new ObjectUpdatesStub() },
    ],
  });
  const provider = countingProvider();
  TestBed.inject(ViewRegistry).register(provider);
  const fixture: ComponentFixture<TabsViewComponent> = TestBed.createComponent(TabsViewComponent);
  fixture.componentRef.setInput('object', tabsObject);
  fixture.detectChanges();
  await settle(fixture);
  await settle(fixture);
  return { fixture, provider };
}

function tabs(fixture: ComponentFixture<TabsViewComponent>): HTMLElement[] {
  return [...fixture.nativeElement.querySelectorAll('[data-testid="tab"]')];
}

function panels(fixture: ComponentFixture<TabsViewComponent>): HTMLElement[] {
  return [...fixture.nativeElement.querySelectorAll('[data-testid="tab-panel"]')];
}

describe('OMCT-C09-L2-03.01 Tab per child', () => {
  it('renders one selectable tab per composed child and the active child view', async () => {
    const { fixture } = await setup(
      domainObject('tabs.ops', { type: 'tabs', composition: ['a', 'b'] }),
      [domainObject('a'), domainObject('b')],
    );

    expect(tabs(fixture)).toHaveLength(2);
    expect(tabs(fixture)[0].getAttribute('aria-selected')).toBe('true');
    const visible = panels(fixture).filter((panel) => !panel.hidden);
    expect(visible).toHaveLength(1);
    expect(visible[0].getAttribute('data-key')).toBe('a');
  });
});

describe('OMCT-C09-L2-03.02 Tab view retention', () => {
  it('destroys the deactivated view without a retention policy', async () => {
    const { fixture, provider } = await setup(
      domainObject('tabs.ops', { type: 'tabs', composition: ['a', 'b'] }),
      [domainObject('a'), domainObject('b')],
    );

    tabs(fixture)[1].click();
    fixture.detectChanges();
    await settle(fixture);

    expect(provider.destroyed).toContain('a');
    expect(panels(fixture).map((panel) => panel.getAttribute('data-key'))).toEqual(['b']);
  });

  it('retains the deactivated view in the DOM under keep-alive', async () => {
    const { fixture, provider } = await setup(
      domainObject('tabs.keep', {
        type: 'tabs',
        composition: ['a', 'b'],
        configuration: { tabs: { keepAlive: true } },
      }),
      [domainObject('a'), domainObject('b')],
    );

    tabs(fixture)[1].click();
    fixture.detectChanges();
    await settle(fixture);

    expect(provider.destroyed).not.toContain('a');
    const byKey = new Map(panels(fixture).map((panel) => [panel.getAttribute('data-key'), panel]));
    expect(byKey.get('a')?.hidden).toBe(true);
    expect(byKey.get('b')?.hidden).toBe(false);
  });

  it('instantiates every child up front under eager loading', async () => {
    const { provider } = await setup(
      domainObject('tabs.eager', {
        type: 'tabs',
        composition: ['a', 'b'],
        configuration: { tabs: { eagerLoad: true } },
      }),
      [domainObject('a'), domainObject('b')],
    );

    expect(provider.created.sort()).toEqual(['a', 'b']);
  });
});

describe('OMCT-C09-L2-03.03 Empty tabs state', () => {
  it('displays the configured empty-state message', async () => {
    const { fixture } = await setup(
      domainObject('tabs.empty', {
        type: 'tabs',
        composition: [],
        configuration: { tabs: { emptyMessage: 'No station displays composed yet.' } },
      }),
      [],
    );

    const empty = fixture.nativeElement.querySelector('[data-testid="tabs-empty"]');
    expect(empty?.textContent).toContain('No station displays composed yet.');
    expect(tabs(fixture)).toHaveLength(0);
  });
});
