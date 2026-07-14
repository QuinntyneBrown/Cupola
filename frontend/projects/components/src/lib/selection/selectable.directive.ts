import { Directive, ElementRef, inject, input } from '@angular/core';
import { SelectionContext, SelectionService } from '@cupola/core';

/**
 * Marks an element as selectable: clicking selects it (ctrl/cmd-click
 * multi-selects) through the SelectionService.
 * Requirement: OMCT-C15-L2-01.05.
 */
@Directive({
  selector: '[cpSelectable]',
  host: {
    '(click)': 'onClick($event)',
  },
})
export class SelectableDirective {
  private readonly selection = inject(SelectionService);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly cpSelectable = input.required<SelectionContext>();

  protected onClick(event: MouseEvent): void {
    event.stopPropagation();
    this.selection.select(
      { element: this.elementRef.nativeElement, context: this.cpSelectable() },
      event.ctrlKey || event.metaKey,
    );
  }
}
