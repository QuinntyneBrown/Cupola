import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DomainObject, ObjectsGateway, TypeRegistry, objectGlyph } from '@cupola/core';
import { SelectableDirective } from '@cupola/components';

import { FolderViewToggleComponent } from './folder-view-toggle.component';

/**
 * Folder list view (OMCT-C09-L2-03.04): every folder child as a selectable
 * row with its type name and modification time, beside the existing grid.
 */
@Component({
  selector: 'cp-folder-list-view',
  templateUrl: './folder-list-view.component.html',
  styleUrl: './folder-list-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SelectableDirective, FolderViewToggleComponent],
})
export class FolderListViewComponent {
  private readonly objects = inject(ObjectsGateway);
  private readonly types = inject(TypeRegistry);

  readonly object = input.required<DomainObject>();

  protected readonly children = signal<DomainObject[]>([]);
  protected readonly rows = computed(() =>
    this.children().map((child) => ({
      object: child,
      glyph: objectGlyph(child),
      typeName: this.types.get(child.type)?.name ?? child.type,
      modified: child.modified ?? child.created ?? '',
      context: { key: child.keyString, label: child.name, object: child, type: 'object' },
    })),
  );

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      this.children.set([]);
      const subscription = this.objects
        .getComposition(object.keyString)
        .subscribe((children) => this.children.set(children));
      onCleanup(() => subscription.unsubscribe());
    });
  }
}
