import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BrandingService } from '@cupola/core';

@Component({
  selector: 'cp-about-dialog',
  templateUrl: './about-dialog.component.html',
  styleUrl: './about-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutDialogComponent {
  private readonly branding = inject(BrandingService);

  protected readonly info = this.branding.branding;
  protected readonly build = this.branding.buildInfo;
}
