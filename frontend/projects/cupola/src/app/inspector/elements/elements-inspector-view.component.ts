import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DomainObject, ObjectsGateway, SelectedItem, objectGlyph } from '@cupola/core';

@Component({
  selector: 'cp-elements-inspector-view',
  templateUrl: './elements-inspector-view.component.html',
  styleUrl: './elements-inspector-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElementsInspectorViewComponent {
  private readonly objects = inject(ObjectsGateway);

  readonly selection = input.required<SelectedItem[]>();

  protected readonly object = computed(() => this.selection()[0]?.context.object ?? null);
  protected readonly elements = signal<{ object: DomainObject; glyph: string }[]>([]);

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      this.elements.set([]);
      if (!object || object.composition.length === 0) {
        return;
      }
      const subscription = this.objects
        .getComposition(object.keyString)
        .subscribe((children) =>
          this.elements.set(children.map((child) => ({ object: child, glyph: objectGlyph(child) }))),
        );
      onCleanup(() => subscription.unsubscribe());
    });
  }
}
