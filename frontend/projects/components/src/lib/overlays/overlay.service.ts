import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

import { Overlay } from './overlay';
import { OverlayConfig } from './overlay-config';

/**
 * Manages overlays as a stack: showing a new overlay hides an auto-hide
 * previous overlay and restores it when the new overlay is destroyed;
 * Escape dismisses the last dismissible overlay.
 * Requirement: OMCT-C15-L2-04.04.
 */
@Injectable({ providedIn: 'root' })
export class OverlayService {
  private readonly document = inject(DOCUMENT);
  private readonly stack = signal<Overlay[]>([]);

  /** Active overlays, bottom-most first. */
  readonly activeOverlays = this.stack.asReadonly();

  constructor() {
    this.document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }
      const lastDismissible = [...this.stack()].reverse().find((overlay) => overlay.dismissible);
      if (lastDismissible) {
        event.stopPropagation();
        lastDismissible.dismiss();
      }
    });
  }

  show(config: OverlayConfig): Overlay {
    const previous = this.stack().at(-1);

    const scrim = this.document.createElement('div');
    scrim.className = 'cp-scrim';
    scrim.setAttribute('data-testid', 'overlay-scrim');
    const container = this.document.createElement('div');
    container.className = `cp-dialog ${sizeClass(config.size)}`;
    container.setAttribute('data-testid', 'overlay-container');
    scrim.appendChild(container);
    this.document.body.appendChild(scrim);

    const overlay = new Overlay(config, scrim, () => {
      config.view.destroy();
      scrim.remove();
      this.stack.update((overlays) => overlays.filter((o) => o !== overlay));
      if (previous?.autoHide && this.stack().includes(previous)) {
        previous.restore();
      }
      config.onDestroy?.();
    });

    if (previous?.autoHide) {
      previous.hide();
    }

    this.stack.update((overlays) => [...overlays, overlay]);
    config.view.show(container);
    return overlay;
  }
}

function sizeClass(size: OverlayConfig['size']): string {
  switch (size) {
    case 'small':
      return 'cp-dialog--s';
    case 'fit':
      return 'cp-dialog--fit';
    default:
      return 'cp-dialog--l';
  }
}
