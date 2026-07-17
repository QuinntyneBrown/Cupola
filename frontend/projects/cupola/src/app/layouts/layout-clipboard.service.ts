import { Injectable, Signal, computed, signal } from '@angular/core';

import { LayoutItem, layoutItemId } from './display-layout/layout-model';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * The layout clipboard (OMCT-C09-L2-01.05): an in-memory store shared by every
 * display layout, deliberately independent of the system clipboard so copy and
 * paste stay deterministic and permission-free. Pasted copies get fresh ids and
 * a one-grid-unit offset.
 */
@Injectable({ providedIn: 'root' })
export class LayoutClipboardService {
  private readonly stored = signal<LayoutItem[]>([]);

  readonly hasContent: Signal<boolean> = computed(() => this.stored().length > 0);

  store(items: LayoutItem[]): void {
    this.stored.set(items.map((item) => clone(item)));
  }

  /** Fresh-id, offset copies of the stored items; empty when nothing was copied. */
  read(): LayoutItem[] {
    return this.stored().map((item) => ({
      ...clone(item),
      id: layoutItemId(),
      x: item.x + 1,
      y: item.y + 1,
      ...(item.kind === 'line' ? { x2: (item.x2 ?? item.x) + 1, y2: (item.y2 ?? item.y) + 1 } : {}),
    }));
  }
}
