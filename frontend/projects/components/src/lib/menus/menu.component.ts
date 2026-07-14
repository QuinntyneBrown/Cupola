import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { MenuItem } from './menu-item';

@Component({
  selector: 'cp-menu',
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent {
  readonly items = input.required<MenuItem[]>();
  readonly itemSelected = output<MenuItem>();

  protected select(item: MenuItem): void {
    if (item.disabled) {
      return;
    }
    this.itemSelected.emit(item);
  }
}
