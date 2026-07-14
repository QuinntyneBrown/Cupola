import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { FormsService, MenuItem, MenuService } from '@cupola/components';

import { CREATABLE_TYPES } from '../../actions/create/creatable-type';
import { CreateFolderAction } from '../../actions/create/create-folder-action';
import { AppLogoComponent } from '../app-logo/app-logo.component';
import { GrandSearchComponent } from '../grand-search/grand-search.component';

@Component({
  selector: 'cp-app-bar',
  templateUrl: './app-bar.component.html',
  styleUrl: './app-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppLogoComponent, GrandSearchComponent],
})
export class AppBarComponent {
  private readonly menu = inject(MenuService);
  private readonly forms = inject(FormsService);
  private readonly createButton = viewChild<ElementRef<HTMLElement>>('createButton');

  protected openCreateMenu(): void {
    const anchor = this.createButton()?.nativeElement;
    if (!anchor) {
      return;
    }
    const items: MenuItem[] = CREATABLE_TYPES.map((type) => ({
      name: type.name,
      glyph: type.glyph,
      description: type.description,
      onClick: () => {
        if (type.type === 'folder') {
          new CreateFolderAction(this.forms).invoke();
        }
      },
    }));
    this.menu.showSuperMenu(anchor, items, 'bottom-start');
  }
}
