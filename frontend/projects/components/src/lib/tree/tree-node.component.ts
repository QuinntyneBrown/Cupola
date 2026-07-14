import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { DomainObject, ObjectUpdatesService, ObjectsGateway, objectGlyph } from '@cupola/core';

import { TooltipDirective } from '../tooltips/tooltip.directive';

@Component({
  selector: 'cp-tree-node',
  templateUrl: './tree-node.component.html',
  styleUrl: './tree-node.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [forwardRef(() => TreeNodeComponent), TooltipDirective],
})
export class TreeNodeComponent {
  private readonly objects = inject(ObjectsGateway);
  private readonly objectUpdates = inject(ObjectUpdatesService);

  readonly object = input.required<DomainObject>();
  /** Objects from the tree root down to this node, inclusive. */
  readonly path = input.required<DomainObject[]>();
  /** keyStrings of the currently navigated browse path. */
  readonly selectedPath = input<string[]>([]);
  readonly activated = output<DomainObject[]>();
  readonly contextMenu = output<{ path: DomainObject[]; x: number; y: number }>();

  protected readonly current = linkedSignal(() => this.object());
  protected readonly expanded = signal(false);
  protected readonly children = signal<DomainObject[] | null>(null);
  /** Stable per-child path arrays (see TreeComponent.rootEntries). */
  protected readonly childEntries = computed(() =>
    (this.children() ?? []).map((child) => ({ object: child, path: [...this.path(), child] })),
  );
  protected readonly depth = computed(() => this.path().length - 1);
  protected readonly hasChildren = computed(() => this.current().composition.length > 0);
  protected readonly isSelected = computed(
    () => this.selectedPath().at(-1) === this.object().keyString,
  );
  protected readonly glyph = computed(() => objectGlyph(this.current()));

  constructor() {
    // Observe object updates so renames propagate into the tree label.
    effect((onCleanup) => {
      const keyString = this.object().keyString;
      const subscription = this.objectUpdates
        .forKeyString(keyString)
        .subscribe((updated) => this.current.set(updated));
      onCleanup(() => subscription.unsubscribe());
    });

    // Auto-expand nodes that are part of the navigated path.
    effect(() => {
      const keyString = this.object().keyString;
      const selected = this.selectedPath();
      if (selected.includes(keyString) && selected.at(-1) !== keyString) {
        this.expanded.set(true);
      }
    });

    // Lazily load composition children on first expansion.
    effect(() => {
      if (this.expanded() && this.children() === null) {
        this.objects
          .getComposition(this.object().keyString)
          .subscribe((children) => this.children.set(children));
      }
    });
  }

  protected toggle(event: Event): void {
    event.stopPropagation();
    this.expanded.update((expanded) => !expanded);
  }

  protected activate(): void {
    this.activated.emit(this.path());
  }

  protected onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.contextMenu.emit({ path: this.path(), x: event.clientX, y: event.clientY });
  }
}
