import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DomainObject, ObjectsGateway } from '@cupola/core';

import { TreeNodeComponent } from './tree-node.component';

/**
 * Lazy-loading object tree. Emits activation with the full object path;
 * it never mutates navigation state itself.
 */
@Component({
  selector: 'cp-tree',
  templateUrl: './tree.component.html',
  styleUrl: './tree.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TreeNodeComponent],
})
export class TreeComponent {
  private readonly objects = inject(ObjectsGateway);

  readonly rootKeyString = input('ROOT');
  /** keyStrings of the currently navigated browse path. */
  readonly selectedPath = input<string[]>([]);
  readonly nodeActivated = output<DomainObject[]>();
  readonly nodeContextMenu = output<{ path: DomainObject[]; x: number; y: number }>();

  protected readonly rootNodes = signal<DomainObject[]>([]);
  /** Stable per-node path arrays: template-level literals would re-create
   *  them on every change-detection pass and loop zoneless CD. */
  protected readonly rootEntries = computed(() =>
    this.rootNodes().map((node) => ({ object: node, path: [node] })),
  );

  constructor() {
    effect((onCleanup) => {
      const subscription = this.objects
        .getComposition(this.rootKeyString())
        .subscribe((children) => this.rootNodes.set(children));
      onCleanup(() => subscription.unsubscribe());
    });
  }
}
