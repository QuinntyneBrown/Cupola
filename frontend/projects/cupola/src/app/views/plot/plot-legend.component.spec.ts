import { TestBed } from '@angular/core/testing';

import { LegendSeries, PlotLegendComponent } from './plot-legend.component';

const series: LegendSeries[] = [
  { keyString: 'a', name: 'Bus A', color: 'var(--cp-chart-1)', unit: 'V', latest: '32.36', min: '29.5', max: '32.7', timestamp: '18:22:00' },
  { keyString: 'b', name: 'Bus B', color: 'var(--cp-chart-2)', unit: 'V', latest: '31.81', min: '29.0', max: '32.2', timestamp: '18:22:00' },
];

function render(mode: 'collapsed' | 'expanded') {
  const fixture = TestBed.createComponent(PlotLegendComponent);
  fixture.componentRef.setInput('series', series);
  fixture.componentRef.setInput('mode', mode);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('OMCT-C07-L2-02.04 Legend modes', () => {
  it('renders a collapsed key per series with the latest value (02.04)', () => {
    const el = render('collapsed');
    expect(el.querySelectorAll('[data-testid="plot-key"]')).toHaveLength(2);
    expect(el.querySelector('[data-testid="plot-legend-table"]')).toBeNull();
    expect(el.textContent).toContain('32.36');
  });

  it('renders an expanded table with timestamp, min, and max (02.04)', () => {
    const el = render('expanded');
    expect(el.querySelector('[data-testid="plot-legend-table"]')).not.toBeNull();
    expect(el.querySelectorAll('[data-testid="plot-legend-row"]')).toHaveLength(2);
    expect(el.textContent).toContain('18:22:00');
  });
});
