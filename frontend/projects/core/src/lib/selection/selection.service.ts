import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

import { SelectedItem } from './selected-item';

/**
 * Maintains shell selection state, annotating selected elements with the
 * `s-selected` attribute and their parents with `s-selected-parent`, and
 * emitting a change event. Requirement: OMCT-C15-L2-01.05.
 */
@Injectable({ providedIn: 'root' })
export class SelectionService {
  private readonly selectedState = signal<SelectedItem[]>([]);
  private readonly changes$ = new Subject<SelectedItem[]>();

  /** The current selected collection. */
  readonly selected = this.selectedState.asReadonly();
  /** Emits the selected collection on every selection change. */
  readonly changes = this.changes$.asObservable();

  /**
   * Selects an item. With `multiSelect`, the item is added to (or, when
   * already selected, removed from) the current collection.
   */
  select(item: SelectedItem, multiSelect = false): void {
    const current = this.selectedState();
    let next: SelectedItem[];
    if (multiSelect) {
      const existingIndex = current.findIndex((s) => s.context.key === item.context.key);
      next =
        existingIndex >= 0 ? current.filter((_, i) => i !== existingIndex) : [...current, item];
    } else {
      next = [item];
    }
    this.apply(current, next);
  }

  clear(): void {
    this.apply(this.selectedState(), []);
  }

  private apply(previous: SelectedItem[], next: SelectedItem[]): void {
    for (const item of previous) {
      item.element.removeAttribute('s-selected');
      this.parentOf(item)?.removeAttribute('s-selected-parent');
    }
    for (const item of next) {
      item.element.setAttribute('s-selected', '');
      this.parentOf(item)?.setAttribute('s-selected-parent', '');
    }
    this.selectedState.set(next);
    this.changes$.next(next);
  }

  private parentOf(item: SelectedItem): Element | null {
    return item.element.parentElement?.closest('[data-selection-parent]') ?? null;
  }
}
