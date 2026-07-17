import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { TableColumn } from './table-columns';
import { TableConfiguration, isColumnVisible, reconcileColumns } from './table-config';

interface MenuColumn {
  key: string;
  name: string;
  visible: boolean;
}

/**
 * Column-configuration menu: toggles visibility and reorders columns with
 * up/down controls, persisting through the parent view (OMCT-C08-L2-01.04).
 */
@Component({
  selector: 'cp-column-menu',
  standalone: true,
  templateUrl: './column-menu.component.html',
  styleUrl: './column-menu.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnMenuComponent {
  readonly columns = input.required<TableColumn[]>();
  readonly config = input.required<TableConfiguration>();

  readonly toggleColumn = output<string>();
  readonly moveColumn = output<{ key: string; direction: 'up' | 'down' }>();

  /** Columns in configured order with their current visibility. */
  protected readonly items = computed<MenuColumn[]>(() => {
    const derived = this.columns();
    const byKey = new Map(derived.map((column) => [column.key, column]));
    const order = reconcileColumns(derived, this.config());
    return order
      .map((entry) => byKey.get(entry.key))
      .filter((column): column is TableColumn => column !== undefined)
      .map((column) => ({
        key: column.key,
        name: column.name,
        visible: isColumnVisible(this.config(), column.key),
      }));
  });

  protected onToggle(key: string): void {
    this.toggleColumn.emit(key);
  }

  protected onMove(key: string, direction: 'up' | 'down'): void {
    this.moveColumn.emit({ key, direction });
  }
}
