import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { OverlayService, componentView } from '@cupola/components';
import { EnvironmentInjector } from '@angular/core';

import { AboutDialogComponent } from '../about-dialog/about-dialog.component';

/**
 * The application logo. Activating it opens the about dialog in a large
 * overlay. Requirement: OMCT-C15-L2-05.04.
 */
@Component({
  selector: 'cp-app-logo',
  templateUrl: './app-logo.component.html',
  styleUrl: './app-logo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLogoComponent {
  private readonly overlays = inject(OverlayService);
  private readonly environmentInjector = inject(EnvironmentInjector);

  protected openAbout(): void {
    const view = componentView(this.environmentInjector, AboutDialogComponent);
    this.overlays.show({ view, size: 'large', dismissible: true });
  }
}
