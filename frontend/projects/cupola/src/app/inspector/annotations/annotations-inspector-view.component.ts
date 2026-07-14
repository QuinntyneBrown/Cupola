import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Annotation, ObjectsGateway, SelectedItem } from '@cupola/core';

@Component({
  selector: 'cp-annotations-inspector-view',
  templateUrl: './annotations-inspector-view.component.html',
  styleUrl: './annotations-inspector-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnotationsInspectorViewComponent {
  private readonly objects = inject(ObjectsGateway);

  readonly selection = input.required<SelectedItem[]>();

  protected readonly object = computed(() => this.selection()[0]?.context.object ?? null);
  protected readonly annotations = signal<Annotation[]>([]);

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      this.annotations.set([]);
      if (!object) {
        return;
      }
      const subscription = this.objects
        .getAnnotations(object.keyString)
        .subscribe((annotations) => this.annotations.set(annotations));
      onCleanup(() => subscription.unsubscribe());
    });
  }
}
