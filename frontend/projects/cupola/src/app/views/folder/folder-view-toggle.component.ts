import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { UrlParamsService } from '@cupola/core';

/**
 * Grid/list presentation toggle shared by the folder views (OMCT-C09-L2-03.04).
 * Selection rides the `?view=` URL parameter the view host already honours.
 */
@Component({
  selector: 'cp-folder-view-toggle',
  template: `
    <div class="cp-toggle-group" data-testid="folder-view-toggle" role="group" aria-label="Folder presentation">
      <button
        type="button"
        data-testid="folder-toggle-grid"
        [class.is-active]="active() === 'folder'"
        [attr.aria-pressed]="active() === 'folder'"
        (click)="select('folder')"
      >
        <svg class="cp-icon cp-icon--s"><use href="#i-grid" /></svg>
        Grid
      </button>
      <button
        type="button"
        data-testid="folder-toggle-list"
        [class.is-active]="active() === 'list'"
        [attr.aria-pressed]="active() === 'list'"
        (click)="select('list')"
      >
        <svg class="cp-icon cp-icon--s"><use href="#i-list" /></svg>
        List
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FolderViewToggleComponent {
  private readonly urlParams = inject(UrlParamsService);

  /** The active folder view provider key: 'folder' (grid) or 'list'. */
  readonly active = input.required<'folder' | 'list'>();

  protected select(key: 'folder' | 'list'): void {
    void this.urlParams.setParams({ view: key });
  }
}
