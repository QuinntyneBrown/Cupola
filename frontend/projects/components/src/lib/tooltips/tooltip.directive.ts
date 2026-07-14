import { Directive, ElementRef, inject, input } from '@angular/core';

import { TooltipService } from './tooltip.service';

/**
 * Shows a tooltip while the host element is hovered or focused.
 * Requirement: OMCT-C15-L2-04.05.
 */
@Directive({
  selector: '[cpTooltip]',
  host: {
    '(mouseenter)': 'show()',
    '(focus)': 'show()',
    '(mouseleave)': 'hide()',
    '(blur)': 'hide()',
  },
})
export class TooltipDirective {
  private readonly tooltips = inject(TooltipService);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly cpTooltip = input.required<string>();
  readonly cpTooltipData = input<string>();

  protected show(): void {
    this.tooltips.showTooltip({
      anchor: this.elementRef.nativeElement,
      text: this.cpTooltip(),
      dataText: this.cpTooltipData(),
    });
  }

  protected hide(): void {
    this.tooltips.hideAll();
  }
}
