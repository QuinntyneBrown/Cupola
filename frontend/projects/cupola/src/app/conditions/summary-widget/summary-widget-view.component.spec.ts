import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomainObject, TelemetryApiService, TelemetryDatum } from '@cupola/core';

import { SummaryRule } from './summary-widget-evaluator';
import { SummaryWidgetViewComponent } from './summary-widget-view.component';

class TelemetryStub {
  private callbacks = new Map<string, (datum: TelemetryDatum) => void>();
  subscribe(object: DomainObject, callback: (datum: TelemetryDatum) => void): () => void {
    this.callbacks.set(object.keyString, callback);
    return () => this.callbacks.delete(object.keyString);
  }
  push(keyString: string, value: number): void {
    this.callbacks.get(keyString)?.({ keyString, value, timestamp: '2026-07-16T00:00:00.000Z' });
  }
}

const rules: SummaryRule[] = [
  {
    id: 'critical',
    name: 'Power critical',
    scope: 'any',
    metadataKey: 'value',
    operation: 'greaterThan',
    input: [90],
    label: 'CRITICAL',
    color: 'var(--cp-color-critical)',
  },
  { id: 'default', name: 'Nominal', scope: 'any', metadataKey: 'value', operation: 'equalTo', input: [0], isDefault: true, label: 'NOMINAL' },
];

function summaryWidget(): DomainObject {
  return {
    identifier: { namespace: '', key: 'sw' },
    keyString: 'sw',
    name: 'Power summary',
    type: 'summary-widget',
    location: null,
    composition: ['pwr.bus_v'],
    configuration: { summaryWidget: { rules } },
  };
}

function setup() {
  const telemetry = new TelemetryStub();
  TestBed.configureTestingModule({ providers: [{ provide: TelemetryApiService, useValue: telemetry }] });
  const fixture = TestBed.createComponent(SummaryWidgetViewComponent);
  fixture.componentRef.setInput('object', summaryWidget());
  fixture.detectChanges();
  return { fixture, telemetry };
}

function preview(fixture: ComponentFixture<SummaryWidgetViewComponent>): string {
  return fixture.nativeElement.querySelector('[data-testid="summary-widget-preview"]').textContent.trim();
}

describe('SummaryWidgetViewComponent', () => {
  it('shows the first matching rule as telemetry drives it', () => {
    const { fixture, telemetry } = setup();
    expect(preview(fixture)).toBe('NOMINAL');

    telemetry.push('pwr.bus_v', 95);
    fixture.detectChanges();

    expect(preview(fixture)).toBe('CRITICAL');
  });

  it('previews rules with test data without touching source telemetry', () => {
    const { fixture, telemetry } = setup();
    telemetry.push('pwr.bus_v', 10);
    fixture.detectChanges();
    expect(preview(fixture)).toBe('NOMINAL');

    fixture.nativeElement.querySelector('[data-testid="summary-widget-edit"]').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-testid="summary-test-toggle"]').click();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('[data-testid="summary-test-input"][data-key="pwr.bus_v"]');
    input.value = '99';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(preview(fixture)).toBe('CRITICAL');
  });
});
