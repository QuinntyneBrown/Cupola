import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ActionRegistry, DomainObject } from '@cupola/core';
import { MenuItem, MenuService, TreeComponent } from '@cupola/components';

import { BrowseStateService } from '../../browse/browse-state.service';

@Component({
  selector: 'cp-tree-pane',
  templateUrl: './tree-pane.component.html',
  styleUrl: './tree-pane.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TreeComponent],
})
export class TreePaneComponent {
  private readonly router = inject(Router);
  private readonly browseState = inject(BrowseStateService);
  private readonly actions = inject(ActionRegistry);
  private readonly menu = inject(MenuService);

  protected readonly selectedPath = this.browseState.pathKeyStrings;

  protected onActivated(path: DomainObject[]): void {
    void this.router.navigate(['/browse', ...path.map((object) => object.keyString)], {
      queryParamsHandling: 'preserve',
    });
  }

  protected onContextMenu(request: { path: DomainObject[]; x: number; y: number }): void {
    const collection = this.actions.getActionCollection({ objectPath: request.path });
    const items: MenuItem[] = collection.getVisibleActions().map((action) => ({
      name: action.name,
      glyph: action.glyph,
      description: action.description,
      onClick: () => action.invoke({ objectPath: request.path }),
    }));
    if (items.length > 0) {
      this.menu.showMenu(request.x, request.y, items);
    }
  }
}
