import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomainObject, ObjectApi, ObjectSaveResult, ObjectStyleConfiguration, SelectedItem } from '@cupola/core';

import { StylesInspectorViewComponent } from './styles-inspector-view.component';

function conditionSet(): DomainObject {
  return {
    identifier: { namespace: '', key: 'bus-monitor' },
    keyString: 'bus-monitor',
    name: 'Bus monitor',
    type: 'condition-set',
    location: null,
    composition: [],
    configuration: {
      conditions: [
        { id: 'undervolt', name: 'Undervoltage', trigger: 'all', output: 'UNDERVOLTAGE', criteria: [] },
        { id: 'default', name: 'Default', trigger: 'all', output: 'DEFAULT', criteria: [], isDefault: true },
      ],
    },
  };
}

function styledObject(): DomainObject {
  return {
    identifier: { namespace: '', key: 'plot' },
    keyString: 'plot',
    name: 'Plot',
    type: 'overlay-plot',
    location: null,
    composition: [],
  };
}

class ObjectApiStub {
  saved: DomainObject[] = [];
  get(): Promise<DomainObject> {
    return Promise.resolve(conditionSet());
  }
  save(object: DomainObject): Promise<ObjectSaveResult> {
    this.saved.push(object);
    return Promise.resolve({ keyString: object.keyString, outcome: 'updated', object });
  }
}

async function settle(fixture: ComponentFixture<StylesInspectorViewComponent>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

function setup() {
  const objects = new ObjectApiStub();
  TestBed.configureTestingModule({ providers: [{ provide: ObjectApi, useValue: objects }] });
  const fixture = TestBed.createComponent(StylesInspectorViewComponent);
  const selection: SelectedItem[] = [
    { element: document.createElement('div'), context: { key: 'plot', object: styledObject() } },
  ];
  fixture.componentRef.setInput('selection', selection);
  fixture.detectChanges();
  return { fixture, objects };
}

describe('StylesInspectorViewComponent', () => {
  it('keeps the styles-inspector test id', () => {
    const { fixture } = setup();
    expect(fixture.nativeElement.querySelector('[data-testid="styles-inspector"]')).not.toBeNull();
  });

  it('binds a condition set and renders a row per condition', async () => {
    const { fixture } = setup();

    const input = fixture.nativeElement.querySelector('[data-testid="styles-condition-set"]');
    input.value = 'bus-monitor';
    input.dispatchEvent(new Event('change'));
    await settle(fixture);

    expect(fixture.nativeElement.querySelectorAll('[data-testid="style-row-name"]')).toHaveLength(2);
  });

  it('persists a per-condition style and the master switch', async () => {
    const { fixture, objects } = setup();

    const input = fixture.nativeElement.querySelector('[data-testid="styles-condition-set"]');
    input.value = 'bus-monitor';
    input.dispatchEvent(new Event('change'));
    await settle(fixture);

    fixture.nativeElement.querySelector('[data-testid="styles-enabled"]').click();
    await settle(fixture);
    fixture.nativeElement
      .querySelector('[data-testid="style-swatch-bg"][data-key="undervolt"]')
      .click();
    await settle(fixture);

    const saved = objects.saved[objects.saved.length - 1];
    const config = saved.configuration?.['objectStyles'] as ObjectStyleConfiguration;
    expect(config.enabled).toBe(true);
    expect(config.conditionSetKeyString).toBe('bus-monitor');
    expect(config.styles.find((entry) => entry.conditionId === 'undervolt')?.style.backgroundColor).toBeTruthy();
  });
});
