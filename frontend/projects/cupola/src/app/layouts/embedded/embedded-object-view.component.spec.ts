import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CupolaView, DomainObject, ObjectApi, ViewProvider, ViewRegistry } from '@cupola/core';

import { EmbeddedObjectViewComponent } from './embedded-object-view.component';

function domainObject(key: string, type = 'telemetry'): DomainObject {
  return {
    identifier: { namespace: '', key },
    keyString: key,
    name: key,
    type,
    location: null,
    composition: [],
  };
}

function stubProvider(key: string, priority: number): ViewProvider & { shown: number } {
  const provider = {
    key,
    name: key,
    priority,
    shown: 0,
    canView: () => true,
    view(): CupolaView {
      return {
        show: () => {
          provider.shown += 1;
        },
        destroy: () => {},
      };
    },
  };
  return provider;
}

class ObjectApiStub {
  readonly known = new Map<string, DomainObject>();
  get(keyString: string): Promise<DomainObject> {
    const object = this.known.get(keyString);
    return object ? Promise.resolve(object) : Promise.reject(new Error('missing'));
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function setup(inputs: Record<string, unknown>, objects: DomainObject[], providers: ViewProvider[]) {
  const api = new ObjectApiStub();
  for (const object of objects) {
    api.known.set(object.keyString, object);
  }
  TestBed.configureTestingModule({ providers: [{ provide: ObjectApi, useValue: api }] });
  const registry = TestBed.inject(ViewRegistry);
  for (const provider of providers) {
    registry.register(provider);
  }
  const fixture: ComponentFixture<EmbeddedObjectViewComponent> = TestBed.createComponent(
    EmbeddedObjectViewComponent,
  );
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value);
  }
  fixture.detectChanges();
  await flush();
  await flush();
  fixture.detectChanges();
  return fixture;
}

describe('OMCT-C09-L2-01.04 Embedded object view selection', () => {
  it('instantiates the applicable view configured by view key', async () => {
    const table = stubProvider('table', 60);
    const plot = stubProvider('plot', 90);

    await setup({ keyString: 'pwr.bus_v', viewKey: 'table' }, [domainObject('pwr.bus_v')], [table, plot]);

    expect(table.shown).toBe(1);
    expect(plot.shown).toBe(0);
  });

  it('falls back to the highest-priority applicable view without a view key', async () => {
    const table = stubProvider('table', 60);
    const plot = stubProvider('plot', 90);

    await setup({ keyString: 'pwr.bus_v' }, [domainObject('pwr.bus_v')], [table, plot]);

    expect(plot.shown).toBe(1);
    expect(table.shown).toBe(0);
  });

  it('guards against a layout embedding itself along the object path', async () => {
    const generic = stubProvider('generic', 0);
    const layout = domainObject('dl.station', 'layout');

    const fixture = await setup(
      { keyString: 'dl.station', objectPath: [layout] },
      [layout],
      [generic],
    );

    expect(fixture.nativeElement.querySelector('[data-testid="embedded-recursive"]')).toBeTruthy();
    expect(generic.shown).toBe(0);
  });

  it('shows a missing state when the reference does not resolve', async () => {
    const fixture = await setup({ keyString: 'gone' }, [], [stubProvider('generic', 0)]);

    expect(fixture.nativeElement.querySelector('[data-testid="embedded-missing"]')).toBeTruthy();
  });
});
