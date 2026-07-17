import { Injectable, Signal } from '@angular/core';

import { ImageFrame } from './image-history';

interface Registration {
  element: HTMLElement;
  focused: Signal<ImageFrame | null>;
}

/**
 * Maps a mounted imagery view's host element to its focused-frame signal so
 * the registered open/save actions can resolve "the focused image" from their
 * action context (OMCT-C11-L2-04.01, 04.02).
 */
@Injectable({ providedIn: 'root' })
export class ImageryFocusService {
  private readonly registrations = new Set<Registration>();

  register(element: HTMLElement, focused: Signal<ImageFrame | null>): () => void {
    const registration: Registration = { element, focused };
    this.registrations.add(registration);
    return () => this.registrations.delete(registration);
  }

  /** The focused frame of the imagery view containing (or contained by) `target`. */
  focusedFor(target: HTMLElement | undefined | null): ImageFrame | null {
    if (!target) {
      return null;
    }
    for (const { element, focused } of this.registrations) {
      if (element === target || target.contains(element) || element.contains(target)) {
        return focused();
      }
    }
    return null;
  }
}
