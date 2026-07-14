import { ChangeDetectionStrategy, Component, output } from '@angular/core';

/**
 * Vertical pane splitter. Emits horizontal drag deltas in pixels; the host
 * layout applies and clamps the resulting pane width.
 */
@Component({
  selector: 'cp-splitter',
  templateUrl: './splitter.component.html',
  styleUrl: './splitter.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cp-splitter cp-splitter--v',
    role: 'separator',
    'aria-orientation': 'vertical',
    '[class.is-dragging]': 'dragging',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointercancel)': 'onPointerUp($event)',
  },
})
export class SplitterComponent {
  readonly dragDelta = output<number>();

  protected dragging = false;
  private lastX = 0;

  protected onPointerDown(event: PointerEvent): void {
    this.dragging = true;
    this.lastX = event.clientX;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    const delta = event.clientX - this.lastX;
    if (delta !== 0) {
      this.lastX = event.clientX;
      this.dragDelta.emit(delta);
    }
  }

  protected onPointerUp(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    this.dragging = false;
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
  }
}
