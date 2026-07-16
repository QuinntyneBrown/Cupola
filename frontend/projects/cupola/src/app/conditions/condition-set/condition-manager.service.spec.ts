import { TestBed } from '@angular/core/testing';
import { DomainObject, ObjectApi, ObjectSaveResult } from '@cupola/core';

import { ConditionConfiguration, defaultCondition, readConditionSet } from '../models/condition-models';
import { ConditionManager } from './condition-manager.service';

class ObjectApiStub {
  saved: DomainObject[] = [];
  save(object: DomainObject): Promise<ObjectSaveResult> {
    this.saved.push(object);
    return Promise.resolve({ keyString: object.keyString, outcome: 'updated', object });
  }
}

function conditionSet(conditions: ConditionConfiguration[]): DomainObject {
  return {
    identifier: { namespace: '', key: 'cs' },
    keyString: 'cs',
    name: 'Bus monitor',
    type: 'condition-set',
    location: null,
    composition: ['pwr.bus_v'],
    configuration: { conditions },
  };
}

const undervolt: ConditionConfiguration = {
  id: 'undervolt',
  name: 'Undervoltage',
  trigger: 'all',
  output: 'UNDERVOLTAGE',
  criteria: [{ id: 'u1', telemetryKeyString: 'pwr.bus_v', metadataKey: 'value', operation: 'lessThan', input: [28] }],
};

function setup() {
  const objects = new ObjectApiStub();
  TestBed.configureTestingModule({ providers: [{ provide: ObjectApi, useValue: objects }] });
  return { manager: TestBed.inject(ConditionManager), objects };
}

describe('OMCT-C10-L2-01.06 Condition editing', () => {
  it('adds a condition before the default and saves the configuration', async () => {
    const { manager, objects } = setup();

    const updated = await manager.addCondition(conditionSet([undervolt, defaultCondition()]));

    const conditions = readConditionSet(updated).conditions;
    expect(conditions).toHaveLength(3);
    expect(conditions[conditions.length - 1].isDefault).toBe(true);
    expect(objects.saved).toHaveLength(1);
  });

  it('updates an exposed condition property and saves', async () => {
    const { manager, objects } = setup();

    const updated = await manager.updateCondition(conditionSet([undervolt, defaultCondition()]), 'undervolt', {
      output: 'LOW_BUS',
      trigger: 'any',
    });

    const condition = readConditionSet(updated).conditions.find((c) => c.id === 'undervolt');
    expect(condition?.output).toBe('LOW_BUS');
    expect(condition?.trigger).toBe('any');
    expect(objects.saved).toHaveLength(1);
  });

  it('removes a condition', async () => {
    const { manager } = setup();
    const updated = await manager.removeCondition(conditionSet([undervolt, defaultCondition()]), 'undervolt');
    expect(readConditionSet(updated).conditions.map((c) => c.id)).toEqual(['default']);
  });

  it('reorders non-default conditions and keeps the default last', async () => {
    const { manager } = setup();
    const second: ConditionConfiguration = { ...undervolt, id: 'second', output: 'SECOND' };

    const updated = await manager.reorderConditions(conditionSet([undervolt, second, defaultCondition()]), 0, 1);

    expect(readConditionSet(updated).conditions.map((c) => c.id)).toEqual(['second', 'undervolt', 'default']);
  });

  it('edits a criterion operation and operands', async () => {
    const { manager } = setup();

    const updated = await manager.updateCriterion(conditionSet([undervolt, defaultCondition()]), 'undervolt', 'u1', {
      operation: 'greaterThan',
      input: [30],
    });

    const criterion = readConditionSet(updated).conditions[0].criteria[0];
    expect(criterion.operation).toBe('greaterThan');
    expect(criterion.input).toEqual([30]);
  });
});
