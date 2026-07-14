import { TestBed } from '@angular/core/testing';
import { DomainObject, InspectorViewRegistry, SelectedItem } from '@cupola/core';

import { registerStandardInspectorViews } from './register-standard-inspector-views';

function selectionFor(object: DomainObject): SelectedItem[] {
  return [
    {
      element: document.createElement('div'),
      context: { key: object.keyString, object, type: 'object' },
    },
  ];
}

function makeObject(type: string, composition: string[] = []): DomainObject {
  return {
    identifier: { namespace: '', key: 't' },
    keyString: 't',
    name: 'T',
    type,
    location: null,
    composition,
  };
}

describe('OMCT-C15-L2-02.04 standard inspector views', () => {
  let registry: InspectorViewRegistry;

  beforeEach(() => {
    TestBed.runInInjectionContext(() => registerStandardInspectorViews());
    registry = TestBed.inject(InspectorViewRegistry);
  });

  it('registers the properties, elements, plot-series, styles, and annotations providers', () => {
    for (const key of ['properties', 'elements', 'plot-series', 'styles', 'annotations']) {
      expect(registry.getByProviderKey(key)).toBeDefined();
    }
  });

  it('applies properties and annotations to any selection', () => {
    const views = registry.applicableViews(selectionFor(makeObject('notebook')));
    expect(views.map((v) => v.key)).toEqual(expect.arrayContaining(['properties', 'annotations']));
  });

  it('applies plot-series and styles to an overlay plot', () => {
    const views = registry
      .applicableViews(selectionFor(makeObject('overlay-plot', ['a', 'b'])))
      .map((v) => v.key);
    expect(views).toEqual(expect.arrayContaining(['plot-series', 'styles', 'elements']));
  });

  it('does not apply plot-series to a folder', () => {
    const views = registry.applicableViews(selectionFor(makeObject('folder'))).map((v) => v.key);
    expect(views).not.toContain('plot-series');
  });
});
