import { ComponentPortal } from '@angular/cdk/portal';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { EnvironmentInjector, Injectable, inject } from '@angular/core';

import { TooltipComponent } from './tooltip.component';
import { TooltipOptions } from './tooltip-options';

/**
 * Shows only the active tooltip set, removing existing tooltips before a
 * new tooltip appears. Requirement: OMCT-C15-L2-04.05.
 */
@Injectable({ providedIn: 'root' })
export class TooltipService {
  private readonly overlay = inject(Overlay);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private active: OverlayRef[] = [];

  showTooltip(options: TooltipOptions): void {
    this.hideAll();

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(options.anchor)
      .withPositions([
        { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 6 },
        { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -6 },
      ]);
    const overlayRef = this.overlay.create({
      positionStrategy,
      panelClass: 'cp-tooltip-overlay',
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });

    const ref = overlayRef.attach(
      new ComponentPortal(TooltipComponent, null, this.environmentInjector),
    );
    ref.setInput('text', options.text);
    if (options.dataText) {
      ref.setInput('dataText', options.dataText);
    }
    this.active.push(overlayRef);
  }

  hideAll(): void {
    for (const overlayRef of this.active) {
      overlayRef.dispose();
    }
    this.active = [];
  }

  get activeCount(): number {
    return this.active.length;
  }
}
