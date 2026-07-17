import {
  ChangeDetectionStrategy,
  Component,
  EnvironmentInjector,
  inject,
  input,
} from '@angular/core';
import { NotebookEmbed, ObjectApi } from '@cupola/core';
import { OverlayService, componentView } from '@cupola/components';

import { PreviewComponent } from '../../actions/view-large/preview.component';

/**
 * Renders a captured snapshot as a compact card (OMCT-C13-L2-02.02) that expands
 * to the referenced object's live view in a large overlay on click
 * (OMCT-C13-L2-02.03).
 */
@Component({
  selector: 'cp-notebook-embed',
  templateUrl: './notebook-embed.component.html',
  styleUrl: './notebook-embed.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotebookEmbedComponent {
  private readonly overlays = inject(OverlayService);
  private readonly objects = inject(ObjectApi);
  private readonly injector = inject(EnvironmentInjector);

  readonly embed = input.required<NotebookEmbed>();

  protected capturedLabel(): string {
    return this.embed().capturedAt.replace('T', ' ').slice(0, 19);
  }

  /** Expands the snapshot to the referenced object's live view in an overlay. */
  protected expand(): void {
    void this.openLiveView();
  }

  private async openLiveView(): Promise<void> {
    const path = await this.objects.getOriginalPath(this.embed().objectKeyString);
    const objectPath = [...path].reverse();
    const view = componentView(this.injector, PreviewComponent, { objectPath });
    this.overlays.show({ view, size: 'large', dismissible: true });
  }
}
