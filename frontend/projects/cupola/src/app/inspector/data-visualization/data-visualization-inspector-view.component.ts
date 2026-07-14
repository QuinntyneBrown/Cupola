import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SelectedItem } from '@cupola/core';

import { ImageryInspectorViewComponent } from './imagery-inspector-view.component';
import { NumericInspectorViewComponent } from './numeric-inspector-view.component';

@Component({
  selector: 'cp-data-visualization-inspector-view',
  templateUrl: './data-visualization-inspector-view.component.html',
  styleUrl: './data-visualization-inspector-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ImageryInspectorViewComponent, NumericInspectorViewComponent],
})
export class DataVisualizationInspectorViewComponent {
  readonly selection = input.required<SelectedItem[]>();

  protected readonly object = computed(() => this.selection()[0]?.context.object ?? null);
  protected readonly isImagery = computed(
    () => this.object()?.telemetry?.hints.includes('image') ?? false,
  );
}
