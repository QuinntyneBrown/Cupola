import { EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DomainObject, SelectedItem } from '@cupola/core';

import { DataVisualizationInspectorViewProvider } from './data-visualization-inspector-view-provider';

function selectionFor(object: DomainObject | undefined): SelectedItem[] {
  return object
    ? [{ element: document.createElement('div'), context: { key: object.keyString, object } }]
    : [];
}

function telemetry(hints: string[]): DomainObject {
  return {
    identifier: { namespace: '', key: 'pwr' },
    keyString: 'pwr',
    name: 'Power',
    type: 'telemetry',
    location: null,
    composition: [],
    telemetry: { hints },
  };
}

describe('OMCT-C15-L2-02.05 DataVisualizationInspectorViewProvider', () => {
  let provider: DataVisualizationInspectorViewProvider;

  beforeEach(() => {
    provider = new DataVisualizationInspectorViewProvider(TestBed.inject(EnvironmentInjector));
  });

  it('applies to telemetry selections', () => {
    expect(provider.canView(selectionFor(telemetry(['range'])))).toBe(true);
    expect(provider.canView(selectionFor(telemetry(['image'])))).toBe(true);
  });

  it('does not apply to non-telemetry selections', () => {
    const folder: DomainObject = {
      identifier: { namespace: '', key: 'f' },
      keyString: 'f',
      name: 'F',
      type: 'folder',
      location: null,
      composition: [],
    };
    expect(provider.canView(selectionFor(folder))).toBe(false);
    expect(provider.canView(selectionFor(undefined))).toBe(false);
  });
});
