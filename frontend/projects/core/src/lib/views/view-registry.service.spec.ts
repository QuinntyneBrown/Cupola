import { CupolaView } from './cupola-view';
import { ViewProvider } from './view-provider';
import { ViewRegistry } from './view-registry.service';
import { DomainObject } from '../models/domain-object';

function object(type: string): DomainObject {
  return {
    identifier: { namespace: '', key: 'k' },
    keyString: 'k',
    name: 'K',
    type,
    location: null,
    composition: [],
  };
}

function provider(key: string, priority: number, canView: boolean, view?: CupolaView): ViewProvider {
  return {
    key,
    name: key,
    priority,
    canView: () => canView,
    view: () => view ?? { show: () => {}, destroy: () => {} },
  };
}

describe('OMCT-C15-L2-02.01 ViewRegistry applicability', () => {
  it('returns only providers whose canView is true, in descending priority order', () => {
    const registry = new ViewRegistry();
    registry.register(provider('low', 10, true));
    registry.register(provider('high', 90, true));
    registry.register(provider('mid', 50, true));
    registry.register(provider('hidden', 100, false));

    const applicable = registry.applicableViews(object('telemetry'), []);

    expect(applicable.map((p) => p.key)).toEqual(['high', 'mid', 'low']);
  });
});

describe('OMCT-C15-L2-02.02 ViewRegistry view lifecycle wrapping', () => {
  it('exposes the provider key and records the parent element before show runs', () => {
    const registry = new ViewRegistry();
    const events: string[] = [];
    let keyDuringShow: string | undefined;
    let parentDuringShow: HTMLElement | undefined;

    const view: CupolaView = {
      show() {
        keyDuringShow = view.key;
        parentDuringShow = view.parentElement;
        events.push('show');
      },
      destroy() {
        events.push('destroy');
      },
    };
    const element = document.createElement('div');
    const p = provider('plot', 90, true, view);
    registry.register(p);

    const returned = registry.showView(p, object('overlay-plot'), [], element);

    expect(keyDuringShow).toBe('plot');
    expect(parentDuringShow).toBe(element);
    expect(returned.key).toBe('plot');
    expect(returned.parentElement).toBe(element);
    expect(events).toEqual(['show']);
  });
});
