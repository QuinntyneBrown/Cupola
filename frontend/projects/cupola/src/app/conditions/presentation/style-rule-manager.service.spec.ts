import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ObjectStyleConfiguration } from '@cupola/core';

import { ConditionResult } from '../models/condition-models';
import { ConditionResultService } from '../engine/condition-result.service';
import { StyleRuleManager } from './style-rule-manager.service';

class ConditionResultStub {
  readonly subject = new Subject<ConditionResult>();
  outputs() {
    return this.subject.asObservable();
  }
}

function config(overrides: Partial<ObjectStyleConfiguration> = {}): ObjectStyleConfiguration {
  return {
    conditionSetKeyString: 'cs',
    enabled: true,
    styles: [
      { conditionId: 'critical', style: { backgroundColor: '#a00', color: '#fff' } },
      { conditionId: 'nominal', style: { backgroundColor: '#0a0' } },
    ],
    defaultStyle: { backgroundColor: '#000' },
    ...overrides,
  };
}

function setup() {
  const results = new ConditionResultStub();
  TestBed.configureTestingModule({ providers: [{ provide: ConditionResultService, useValue: results }] });
  return { manager: TestBed.inject(StyleRuleManager), results };
}

describe('OMCT-C10-L2-02.01 Conditional styles', () => {
  it('replaces the applied style when the active condition output changes', () => {
    const { manager, results } = setup();
    const binding = manager.attach(config());

    expect(binding.style()).toEqual({ backgroundColor: '#000' }); // default before any output

    results.subject.next({ conditionId: 'critical', output: 'CRIT', timestamp: 't1' });
    expect(binding.style()).toEqual({ backgroundColor: '#a00', color: '#fff' });

    results.subject.next({ conditionId: 'nominal', output: 'OK', timestamp: 't2' });
    expect(binding.style()).toEqual({ backgroundColor: '#0a0' });
  });

  it('applies the default style when the active condition has no matching rule', () => {
    const { manager, results } = setup();
    const binding = manager.attach(config());

    results.subject.next({ conditionId: 'unstyled', output: 'X', timestamp: 't1' });
    expect(binding.style()).toEqual({ backgroundColor: '#000' });
  });

  it('keeps the default style and does not subscribe when disabled', () => {
    const { manager, results } = setup();
    const binding = manager.attach(config({ enabled: false }));

    results.subject.next({ conditionId: 'critical', output: 'CRIT', timestamp: 't1' });
    expect(binding.style()).toEqual({ backgroundColor: '#000' });
  });
});
