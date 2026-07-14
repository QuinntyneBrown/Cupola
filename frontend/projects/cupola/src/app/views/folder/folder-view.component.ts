import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DomainObject, ObjectsGateway, objectGlyph } from '@cupola/core';
import { SelectableDirective } from '@cupola/components';

@Component({
  selector: 'cp-folder-view',
  templateUrl: './folder-view.component.html',
  styleUrl: './folder-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SelectableDirective],
})
export class FolderViewComponent {
  private readonly objects = inject(ObjectsGateway);

  readonly object = input.required<DomainObject>();

  protected readonly children = signal<DomainObject[]>([]);
  protected readonly childEntries = computed(() =>
    this.children().map((child) => ({
      object: child,
      glyph: objectGlyph(child),
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
