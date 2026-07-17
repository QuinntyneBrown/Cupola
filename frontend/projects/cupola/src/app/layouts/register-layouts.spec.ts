import { TestBed } from '@angular/core/testing';
import {
  ActionRegistry,
  DomainObject,
  InspectorViewRegistry,
  ToolbarRegistry,
  TypeRegistry,
  ViewRegistry,
} from '@cupola/core';

import { registerLayouts } from './register-layouts';

function domainObject(key: string, type: string): DomainObject {
  return {
    identifier: { namespace: '', key },
    keyString: key,
    name: key,
    type,
    location: null,
    composition: [],
  };
}

describe('OMCT-C09-L2-01.01 Display-layout type and view — registration', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
    TestBed.runInInjectionContext(() => registerLayouts());
  });

  it('registers the five layout types as creatable with default configuration', () => {
    const types = TestBed.inject(TypeRegistry);
    const creatable = types.listCreatable().map((type) => type.key);

    for (const key of ['layout', 'flexible-layout', 'tabs', 'hyperlink', 'web-page']) {
      expect(creatable).toContain(key);
    }

    const layout = domainObject('dl.new', 'layout');
    types.get('layout')?.initialize?.(layout);
    expect(layout.configuration?.['layout']).toEqual({ items: [] });
  });

  it('offers the layout views for their object types', () => {
    const views = TestBed.inject(ViewRegistry);

    expect(
      views.applicableViews(domainObject('dl', 'layout'), []).map((provider) => provider.key),
    ).toContain('layout');
    expect(
      views.applicableViews(domainObject('t', 'tabs'), []).map((provider) => provider.key),
    ).toContain('tabs');
    const folderViews = views
      .applicableViews(domainObject('f', 'folder'), [])
      .map((provider) => provider.key);
    expect(folderViews).toContain('list');
  });

  it('registers the layout toolbars, link inspector, and clipboard action', () => {
    const layout = domainObject('dl', 'layout');
    const selection = [
      { element: document.createElement('div'), context: { key: 'dl', object: layout, type: 'object' } },
    ];

    expect(TestBed.inject(ToolbarRegistry).getStructure(selection).length).toBeGreaterThan(0);
    expect(
      TestBed.inject(InspectorViewRegistry)
        .applicableViews([
          {
            element: document.createElement('div'),
            context: { key: 'l', object: domainObject('l', 'hyperlink'), type: 'object' },
          },
        ])
        .map((provider) => provider.key),
    ).toContain('link-options');
    expect(TestBed.inject(ActionRegistry).getAction('layout.copy-to-clipboard')).toBeTruthy();
  });
});
