import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SelectedItem } from '@cupola/core';

@Component({
  selector: 'cp-styles-inspector-view',
  templateUrl: './styles-inspector-view.component.html',
  styleUrl: './styles-inspector-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StylesInspectorViewComponent {
  readonly selection = input.required<SelectedItem[]>();

  protected readonly object = computed(() => this.selection()[0]?.context.object ?? null);
}
