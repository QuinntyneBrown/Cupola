import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  untracked,
  viewChild,
} from '@angular/core';
import { ActionRegistry, SelectionService, objectGlyph } from '@cupola/core';

import { BrowseStateService } from './browse-state.service';
import { ViewHostComponent } from './view-host.component';
import { ToolbarContainerComponent } from '../shell/toolbar/toolbar-container.component';

@Component({
  selector: 'cp-browse',
  templateUrl: './browse.component.html',
  styleUrl: './browse.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ViewHostComponent, ToolbarContainerComponent],
})
export class BrowseComponent {
  private readonly browseState = inject(BrowseStateService);
  private readonly selection = inject(SelectionService);
  private readonly actions = inject(ActionRegistry);
  private readonly viewHost = viewChild('viewHost', { read: ElementRef });

  private lastDefaultSelectionKey: string | null = null;

  protected readonly object = this.browseState.navigatedObject;
  protected readonly objectPath = this.browseState.path;
  protected readonly ancestors = computed(() => this.browseState.path().slice(0, -1));
  protected readonly glyph = computed(() => {
    const object = this.object();
    return object ? objectGlyph(object) : 'i-folder';
  });

  constructor() {
    // Navigating selects the navigated object by default. Keyed by the
    // navigated keyString so re-renders neither loop change detection nor
    // stomp a user-made selection; the view-host element is read untracked
    // because viewChild yields a fresh ElementRef per render pass.
    afterRenderEffect(() => {
      const object = this.object();
      if (!object || this.lastDefaultSelectionKey === object.keyString) {
        return;
      }
      const host = untracked(this.viewHost)?.nativeElement;
      if (host) {
        this.lastDefaultSelectionKey = object.keyString;
        this.selection.select({
          element: host,
          context: { key: object.keyString, label: object.name, object, type: 'object' },
        });
      }
    });
  }

  protected expandView(): void {
    const host = this.viewHost()?.nativeElement as HTMLElement | undefined;
    if (!host) {
      return;
    }
    this.actions
      .getAction('large.view')
      ?.invoke({ objectPath: this.objectPath(), viewParentElement: host });
  }

  protected editProperties(): void {
    this.actions.getAction('edit.properties')?.invoke({ objectPath: this.objectPath() });
  }
}
