import { OverlayContainer } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';

import { TooltipService } from './tooltip.service';

describe('OMCT-C15-L2-04.05 TooltipService', () => {
  let service: TooltipService;
  let container: HTMLElement;
  let anchor: HTMLElement;

  beforeEach(() => {
    service = TestBed.inject(TooltipService);
    container = TestBed.inject(OverlayContainer).getContainerElement();
    anchor = document.createElement('button');
    document.body.appendChild(anchor);
  });

  afterEach(() => {
    service.hideAll();
    anchor.remove();
    TestBed.inject(OverlayContainer).ngOnDestroy();
  });

  function tooltips(): NodeListOf<Element> {
    return container.querySelectorAll('[data-testid="tooltip"]');
  }

  it('shows the requested tooltip and tracks it as active', () => {
    service.showTooltip({ anchor, text: 'First' });
    TestBed.tick();

    expect(tooltips()).toHaveLength(1);
    expect(container.textContent).toContain('First');
    expect(service.activeCount).toBe(1);
  });

  it('destroys existing tooltips before showing a new one', () => {
    service.showTooltip({ anchor, text: 'First' });
    TestBed.tick();
    service.showTooltip({ anchor, text: 'Second' });
    TestBed.tick();

    expect(tooltips()).toHaveLength(1);
    expect(container.textContent).toContain('Second');
    expect(container.textContent).not.toContain('First');
    expect(service.activeCount).toBe(1);
  });
});
