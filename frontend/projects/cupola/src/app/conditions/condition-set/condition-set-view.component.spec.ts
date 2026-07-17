import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { DomainObject, ObjectApi, ObjectSaveResult } from '@cupola/core';

import { ConditionConfiguration, ConditionResult, defaultCondition, readConditionSet } from '../models/condition-models';
import { ConditionSetEvaluationService } from '../engine/condition-set-evaluation.service';
import { ConditionSetViewComponent } from './condition-set-view.component';

class ObjectApiStub {
  save(object: DomainObject): Promise<ObjectSaveResult> {
    return Promise.resolve({ keyString: object.keyString, outcome: 'updated', object });
  }
}

class EvaluationStub {
  readonly subject = new Subject<ConditionResult>();
  evaluate() {
    return this.subject.asObservable();
  }
}

const undervolt: ConditionConfiguration = {
  id: 'undervolt',
  name: 'Undervoltage',
  trigger: 'all',
  output: 'UNDERVOLTAGE',
  criteria: [{ id: 'u1', telemetryKeyString: 'pwr.bus_v', metadataKey: 'value', operation: 'lessThan', input: [28] }],
};

function conditionSet(): DomainObject {
  return {
    identifier: { namespace: '', key: 'cs' },
    keyString: 'cs',
    name: 'Bus monitor',
    type: 'condition-set',
    location: null,
    composition: ['pwr.bus_v'],
    configuration: { conditions: [undervolt, defaultCondition()] },
  };
}

async function settle(fixture: ComponentFixture<ConditionSetViewComponent>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

function setup() {
  const evaluation = new EvaluationStub();
  TestBed.configureTestingModule({
    providers: [
      { provide: ObjectApi, useClass: ObjectApiStub },
      { provide: ConditionSetEvaluationService, useValue: evaluation },
    ],
  });
  const fixture = TestBed.createComponent(ConditionSetViewComponent);
  fixture.componentRef.setInput('object', conditionSet());
  fixture.detectChanges();
  return { fixture, evaluation };
}

describe('ConditionSetViewComponent', () => {
  it('renders the editable conditions and the default condition', () => {
    const { fixture } = setup();
    const rows = fixture.nativeElement.querySelectorAll('[data-testid="condition-row"]');
    expect(rows).toHaveLength(2);
  });

  it('badges the active condition from the running evaluation', async () => {
    const { fixture, evaluation } = setup();

    evaluation.subject.next({ conditionId: 'undervolt', output: 'UNDERVOLTAGE', timestamp: 't1' });
    fixture.detectChanges();

    const activeRow = fixture.nativeElement.querySelector('[data-testid="condition-row"][data-key="undervolt"]');
    expect(activeRow.querySelector('[data-testid="condition-active-badge"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="condition-active-output"]').textContent).toContain(
      'UNDERVOLTAGE',
    );
  });

  it('persists an added condition and shows the new row (01.06)', async () => {
    const { fixture } = setup();

    fixture.nativeElement.querySelector('[data-testid="condition-add"]').click();
    await settle(fixture);

    const rows = fixture.nativeElement.querySelectorAll('[data-testid="condition-row"]');
    expect(rows).toHaveLength(3);
  });

  it('persists an edited output', async () => {
    const { fixture } = setup();
    const saved: DomainObject[] = [];
    jest.spyOn(TestBed.inject(ObjectApi), 'save').mockImplementation((object) => {
      saved.push(object);
      return Promise.resolve({ keyString: object.keyString, outcome: 'updated', object });
    });

    const output = fixture.nativeElement.querySelector('[data-testid="condition-output"][data-key="undervolt"]');
    output.value = 'LOW_BUS';
    output.dispatchEvent(new Event('change'));
    await settle(fixture);

    expect(readConditionSet(saved[saved.length - 1]).conditions[0].output).toBe('LOW_BUS');
  });
});
