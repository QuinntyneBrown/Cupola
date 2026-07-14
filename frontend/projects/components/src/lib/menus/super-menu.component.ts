import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

import { MenuItem } from './menu-item';

@Component({
  selector: 'cp-super-menu',
  templateUrl: './super-menu.component.html',
  styleUrl: './super-menu.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperMenuComponent {
  readonly items = input.required<MenuItem[]>();
  readonly itemSelected = output<MenuItem>();

  protected readonly active = signal<MenuItem | null>(null);

  protected focusItem(item: MenuItem): void {
    this.active.set(item);
  }

  protected select(item: MenuItem): void {
    if (item.disabled) {
      return;
    }
    this.itemSelected.emit(item);
  }
}
