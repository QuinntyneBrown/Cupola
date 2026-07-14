import { ComponentPortal } from '@angular/cdk/portal';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { EnvironmentInjector, Injectable, inject } from '@angular/core';

import { MenuComponent } from './menu.component';
import { MenuItem } from './menu-item';
import { MenuPlacement } from './menu-placement';
import { calculateMenuPosition } from './menu-position';
import { SuperMenuComponent } from './super-menu.component';

/**
 * Displays menus and super-menus at a screen location, invoking the
 * selected item's callback and dismissing the menu.
 * Requirements: OMCT-C15-L2-03.03, OMCT-C15-L2-03.04.
 */
@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly overlay = inject(Overlay);
  private readonly environmentInjector = inject(EnvironmentInjector);

  /** Shows a menu at a screen coordinate (e.g. a context menu). */
  showMenu(x: number, y: number, items: MenuItem[], onDismiss?: () => void): OverlayRef {
    const position = this.overlay
      .position()
      .global()
      .left(`${x}px`)
      .top(`${y}px`);
    const overlayRef = this.overlay.create({
      positionStrategy: position,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });

    const portal = new ComponentPortal(MenuComponent, null, this.environmentInjector);
    const ref = overlayRef.attach(portal);
    ref.setInput('items', items);

    const dismiss = () => {
      overlayRef.dispose();
      onDismiss?.();
    };
    ref.instance.itemSelected.subscribe((item) => {
      item.onClick();
      dismiss();
    });
    overlayRef.backdropClick().subscribe(dismiss);
    overlayRef.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape') {
        dismiss();
      }
    });

    return overlayRef;
  }

  /** Shows a super-menu anchored to an element with the given placement. */
  showSuperMenu(
    anchor: HTMLElement,
    items: MenuItem[],
    placement: MenuPlacement = 'bottom-start',
    onDismiss?: () => void,
  ): OverlayRef {
    const rect = anchor.getBoundingClientRect();
    const { x, y } = calculateMenuPosition(
      { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
      { width: 360, height: 240 },
      placement,
      { width: window.innerWidth, height: window.innerHeight },
    );
    const overlayRef = this.overlay.create({
      positionStrategy: this.overlay.position().global().left(`${x}px`).top(`${y}px`),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });

    const portal = new ComponentPortal(SuperMenuComponent, null, this.environmentInjector);
    const ref = overlayRef.attach(portal);
    ref.setInput('items', items);

    const dismiss = () => {
      overlayRef.dispose();
      onDismiss?.();
    };
    ref.instance.itemSelected.subscribe((item) => {
      item.onClick();
      dismiss();
    });
    overlayRef.backdropClick().subscribe(dismiss);
    overlayRef.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape') {
        dismiss();
      }
    });

    return overlayRef;
  }
}
