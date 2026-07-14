import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SelectedItem } from '@cupola/core';

@Component({
  selector: 'cp-properties-inspector-view',
  templateUrl: './properties-inspector-view.component.html',
  styleUrl: './properties-inspector-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertiesInspectorViewComponent {
  readonly selection = input.required<SelectedItem[]>();

  protected readonly context = computed(() => this.selection()[0]?.context ?? null);
  protected readonly object = computed(() => this.context()?.object ?? null);
}
