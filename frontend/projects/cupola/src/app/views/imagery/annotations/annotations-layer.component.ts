import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { DomainObject, SelectionService } from '@cupola/core';

import {
  NormalizedPoint,
  NormalizedRect,
  normalizedRectFrom,
  pointInRect,
  rectsIntersect,
} from './annotation-hit-testing';

/** A pixel-spatial annotation resolved for the focused frame (03.02). */
export interface FrameAnnotation {
  keyString: string;
  text: string;
  rectangle: NormalizedRect;
}

/**
 * Renders existing pixel-spatial annotations over their targeted image at the
 * stored normalized coordinates (OMCT-C11-L2-03.02) and publishes click and
 * marquee selections through application selection (OMCT-C11-L2-03.03). Sits
 * inside the pan/zoom transform container so rectangles track the image.
 */
@Component({
  selector: 'cp-imagery-annotations',
  template: `
    @for (annotation of annotations(); track annotation.keyString) {
      <div
        class="im-anno"
        [class.is-selected]="selectedKeys().has(annotation.keyString)"
        data-testid="image-annotation"
        [attr.data-key]="annotation.keyString"
        [style.left.%]="annotation.rectangle.x * 100"
        [style.top.%]="annotation.rectangle.y * 100"
        [style.width.%]="annotation.rectangle.w * 100"
        [style.height.%]="annotation.rectangle.h * 100"
        (pointerdown)="onAnnotationPointerDown($event, annotation)"
      >
        <span class="im-anno-tag">{{ annotation.text }}</span>
      </div>
    }
    @if (marquee(); as rect) {
      <div
        class="im-marquee"
        data-testid="image-marquee"
        [style.left.%]="rect.x * 100"
        [style.top.%]="rect.y * 100"
        [style.width.%]="rect.w * 100"
        [style.height.%]="rect.h * 100"
      ></div>
    }
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      display: block;
    }
    .im-anno {
      position: absolute;
      border: 1.5px solid var(--cp-chart-3);
      border-radius: 2px;
      z-index: 3;
      cursor: pointer;
    }
    .im-anno-tag {
      position: absolute;
      top: -21px;
      left: -1.5px;
      font: var(--cp-type-data-s);
      line-height: 16px;
      padding: 0 6px;
      border-radius: 2px;
      background: var(--cp-chart-3);
      color: var(--cp-color-ink-inverse);
      white-space: nowrap;
    }
    .im-anno.is-selected {
      border-color: var(--cp-color-primary);
    }
    .im-anno.is-selected .im-anno-tag {
      background: var(--cp-color-primary);
    }
    .im-marquee {
      position: absolute;
      border: 1px dashed var(--cp-color-primary);
      background: var(--cp-color-primary-dim);
      z-index: 3;
      pointer-events: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(pointerdown)': 'onHostPointerDown($event)',
  },
})
export class AnnotationsLayerComponent {
  private readonly selection = inject(SelectionService);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly annotations = input.required<FrameAnnotation[]>();
  readonly object = input.required<DomainObject>();
  /** Marquee selection is meaningful only at scale one (the parent decides). */
  readonly marqueeEnabled = input(true);

  protected readonly marquee = signal<NormalizedRect | null>(null);
  protected readonly selectedKeys = signal<ReadonlySet<string>>(new Set());

  private marqueeStart: NormalizedPoint | null = null;

  protected onAnnotationPointerDown(event: PointerEvent, annotation: FrameAnnotation): void {
    event.stopPropagation();
    const multi = event.ctrlKey || event.metaKey;
    this.publish([annotation], multi);
  }

  protected onHostPointerDown(event: PointerEvent): void {
    if (!this.marqueeEnabled() || event.target !== this.elementRef.nativeElement) {
      return;
    }
    event.stopPropagation();
    const host = this.elementRef.nativeElement;
    host.setPointerCapture(event.pointerId);
    this.marqueeStart = this.normalizedPoint(event);
    const onMove = (move: PointerEvent) => {
      if (this.marqueeStart) {
        this.marquee.set(normalizedRectFrom(this.marqueeStart, this.normalizedPoint(move)));
      }
    };
    const onUp = (up: PointerEvent) => {
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerup', onUp);
      this.finishMarquee(up);
    };
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerup', onUp);
  }

  private finishMarquee(event: PointerEvent): void {
    const start = this.marqueeStart;
    this.marqueeStart = null;
    const rect = this.marquee();
    this.marquee.set(null);
    if (!start) {
      return;
    }
    if (rect && (rect.w > 0.005 || rect.h > 0.005)) {
      const intersecting = this.annotations().filter((annotation) =>
        rectsIntersect(annotation.rectangle, rect),
      );
      this.publish(intersecting, false);
      return;
    }
    // A plain click on empty image space selects intersecting annotations too
    // (covers zero-size marquees on annotation edges).
    const point = this.normalizedPoint(event);
    const hit = this.annotations().filter((annotation) =>
      pointInRect(point, annotation.rectangle),
    );
    this.publish(hit, false);
  }

  /** Publishes intersecting annotations: clear-then-select, never toggle-off. */
  private publish(annotations: FrameAnnotation[], multi: boolean): void {
    const object = this.object();
    if (annotations.length === 0) {
      if (!multi) {
        this.selection.clear();
        this.selectedKeys.set(new Set());
      }
      return;
    }
    const host = this.elementRef.nativeElement;
    annotations.forEach((annotation, index) => {
      const element =
        (host.querySelector(`[data-key="${annotation.keyString}"]`) as HTMLElement | null) ?? host;
      this.selection.select(
        {
          element,
          context: {
            key: annotation.keyString,
            label: annotation.text,
            object,
            type: 'image-annotation',
          },
        },
        multi || index > 0,
      );
    });
    this.selectedKeys.update((current) => {
      const next = multi ? new Set(current) : new Set<string>();
      for (const annotation of annotations) {
        next.add(annotation.keyString);
      }
      return next;
    });
  }

  private normalizedPoint(event: PointerEvent): NormalizedPoint {
    const bounds = this.elementRef.nativeElement.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) / Math.max(1, bounds.width),
      y: (event.clientY - bounds.top) / Math.max(1, bounds.height),
    };
  }
}
