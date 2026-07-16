import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { DomainObject } from '@cupola/core';

import { ConditionResult } from '../models/condition-models';
import { ConditionResultService } from '../engine/condition-result.service';
import { ConditionWidgetConfiguration, ConditionWidgetViewComponent } from './condition-widget-view.component';

class ConditionResultStub {
  readonly subject = new Subject<ConditionResult>();
  outputs() {
    return this.subject.asObservable();
  }
}

function widget(config: ConditionWidgetConfiguration): DomainObject {
  return {
    identifier: { namespace: '', key: 'w' },
    keyString: 'w',
    name: 'Widget',
    type: 'condition-widget',
    location: null,
    composition: [],
    configuration: { conditionWidget: config },
  };
}

function setup(config: ConditionWidgetConfiguration) {
  const results = new ConditionResultStub();
  TestBed.configureTestingModule({ providers: [{ provide: ConditionResultService, useValue: results }] });
  const fixture: ComponentFixture<ConditionWidgetViewComponent> =
    TestBed.createComponent(ConditionWidgetViewComponent);
  fixture.componentRef.setInput('object', widget(config));
  fixture.detectChanges();
  return { fixture, results };
}

function view(fixture: ComponentFixture<ConditionWidgetViewComponent>): HTMLElement {
  return fixture.nativeElement.querySelector('[data-testid="condition-widget-view"]');
}

describe('OMCT-C10-L2-02.02 Condition widget output', () => {
  it('renders the active output label and severity styling', () => {
    const { fixture, results } = setup({
      conditionSetKeyString: 'cs',
      outputs: [{ conditionId: 'crit', label: 'Heater fault', severity: 'critical' }],
    });

    results.subject.next({ conditionId: 'crit', output: 'CRITICAL', timestamp: 't1' });
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('[data-testid="condition-widget-label"]');
    expect(label.textContent).toContain('Heater fault');
    expect(view(fixture).classList).toContain('condw--critical');
  });

  it('falls back to the raw output when no label override is configured', () => {
    const { fixture, results } = setup({ conditionSetKeyString: 'cs' });

    results.subject.next({ conditionId: 'nominal', output: 'ON', timestamp: 't1' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="condition-widget-label"]').textContent).toContain('ON');
  });

  it('renders a sanitized URL as a link', () => {
    const { fixture, results } = setup({
      conditionSetKeyString: 'cs',
      outputs: [{ conditionId: 'ok', severity: 'ok', url: 'https://status.example.com' }],
    });

    results.subject.next({ conditionId: 'ok', output: 'OK', timestamp: 't1' });
    fixture.detectChanges();

    const anchor = view(fixture) as HTMLAnchorElement;
    expect(anchor.tagName).toBe('A');
    expect(anchor.getAttribute('href')).toBe('https://status.example.com');
  });

  it('renders inert when the configured URL is rejected', () => {
    const { fixture, results } = setup({
      conditionSetKeyString: 'cs',
      // eslint-disable-next-line no-script-url
      outputs: [{ conditionId: 'ok', url: 'javascript:alert(1)' }],
    });

    results.subject.next({ conditionId: 'ok', output: 'OK', timestamp: 't1' });
    fixture.detectChanges();

    expect(view(fixture).tagName).toBe('DIV');
    expect(view(fixture).querySelector('a')).toBeNull();
  });
});
