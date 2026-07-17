import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  DefaultMetadataProvider,
  DomainObject,
  MetadataRegistry,
  ObjectApi,
  ObjectSaveResult,
  SelectedItem,
  TelemetryFilterDefinition,
} from '@cupola/core';

import { FilterStore } from './filter-store.service';
import { FilterInspectorViewComponent } from './filter-inspector-view.component';

const radioDef: TelemetryFilterDefinition = {
  key: 'mode',
  name: 'Mode',
  comparator: 'equals',
  singleSelection: true,
  possibleValues: [
    { label: 'Safe', value: 'SAFE' },
    { label: 'Nominal', value: 'NOMINAL' },
  ],
};
const checkboxDef: TelemetryFilterDefinition = {
  key: 'quality',
  name: 'Quality',
  comparator: 'equals',
  possibleValues: [
    { label: 'Good', value: 'GOOD' },
    { label: 'Suspect', value: 'SUSPECT' },
  ],
};
const textDef: TelemetryFilterDefinition = { key: 'label', name: 'Label', comparator: 'contains' };

function pwrMode(): DomainObject {
  return {
    identifier: { namespace: '', key: 'pwr.mode' },
    keyString: 'pwr.mode',
    name: 'Bus mode',
    type: 'telemetry',
    location: null,
    composition: [],
    telemetry: { hints: ['range'], filters: [radioDef, checkboxDef, textDef] },
  };
}

function conditionSet(): DomainObject {
  return {
    identifier: { namespace: '', key: 'cs' },
    keyString: 'cs',
    name: 'Bus monitor',
    type: 'condition-set',
    location: null,
    composition: ['pwr.mode'],
  };
}

class ObjectApiStub {
  saved: DomainObject[] = [];
  get(): Promise<DomainObject> {
    return Promise.resolve(pwrMode());
  }
  save(object: DomainObject): Promise<ObjectSaveResult> {
    this.saved.push(object);
    return Promise.resolve({ keyString: object.keyString, outcome: 'updated', object });
  }
}

async function settle(fixture: ComponentFixture<FilterInspectorViewComponent>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

async function setup() {
  const objects = new ObjectApiStub();
  TestBed.configureTestingModule({ providers: [{ provide: ObjectApi, useValue: objects }] });
  TestBed.inject(MetadataRegistry).addProvider(TestBed.inject(DefaultMetadataProvider));
  const fixture = TestBed.createComponent(FilterInspectorViewComponent);
  const selection: SelectedItem[] = [
    { element: document.createElement('div'), context: { key: 'cs', object: conditionSet() } },
  ];
  fixture.componentRef.setInput('selection', selection);
  fixture.detectChanges();
  await settle(fixture);
  return { fixture, objects };
}

describe('OMCT-C10-L2-04.01 Filter control selection', () => {
  it('renders radio, checkbox, and text controls according to the filter metadata', async () => {
    const { fixture } = await setup();

    expect(fixture.nativeElement.querySelectorAll('[data-testid="filter-radio"]')).toHaveLength(2);
    expect(fixture.nativeElement.querySelectorAll('[data-testid="filter-checkbox"]')).toHaveLength(2);
    expect(fixture.nativeElement.querySelectorAll('[data-testid="filter-text"]')).toHaveLength(1);
  });

  it('persists the selected filter for the composed object', async () => {
    const { fixture, objects } = await setup();

    const radio = fixture.nativeElement.querySelector('[data-testid="filter-radio"][data-value="SAFE"]');
    radio.checked = true;
    radio.dispatchEvent(new Event('change'));
    await settle(fixture);

    const saved = objects.saved[objects.saved.length - 1];
    const byObject = (saved.configuration?.['filters'] as { byObject: Record<string, unknown> }).byObject;
    expect(byObject['pwr.mode']).toEqual([{ key: 'mode', comparator: 'equals', values: ['SAFE'] }]);
  });
});
