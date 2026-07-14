import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SelectionService, ToolbarRegistry } from '@cupola/core';

@Component({
  selector: 'cp-toolbar-container',
  templateUrl: './toolbar-container.component.html',
  styleUrl: './toolbar-container.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarContainerComponent {
  private readonly registry = inject(ToolbarRegistry);
  private readonly selection = inject(SelectionService);

  protected readonly controls = computed(() =>
    this.registry.getStructure(this.selection.selected()),
  );
}
