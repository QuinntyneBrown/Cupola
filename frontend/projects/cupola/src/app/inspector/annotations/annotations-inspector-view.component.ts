import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Annotation, AnnotationService, ObjectsGateway, SelectedItem } from '@cupola/core';

/**
 * Annotations inspector: lists the annotations targeting the selected object
 * (read model) and provides an authoring panel to create a new annotation with
 * a comment and removable tag chips (OMCT-C13-L2-04.01, 04.04). Tag suggestions
 * come from the available-tag vocabulary as the operator types
 * (OMCT-C13-L2-04.05). Creation failures surface as an inline banner
 * (OMCT-C13-L2-04.03).
 */
@Component({
  selector: 'cp-annotations-inspector-view',
  templateUrl: './annotations-inspector-view.component.html',
  styleUrl: './annotations-inspector-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnotationsInspectorViewComponent {
  private readonly objects = inject(ObjectsGateway);
  private readonly annotationService = inject(AnnotationService);

  readonly selection = input.required<SelectedItem[]>();

  protected readonly object = computed(() => this.selection()[0]?.context.object ?? null);
  protected readonly annotations = signal<Annotation[]>([]);

  protected readonly draftText = signal('');
  protected readonly draftTags = signal<string[]>([]);
  protected readonly tagInput = signal('');
  protected readonly error = signal<string | null>(null);
  private readonly refresh = signal(0);

  protected readonly suggestions = computed(() => {
    const term = this.tagInput();
    return this.annotationService
      .searchByTag(term)
      .filter((tag) => !this.draftTags().includes(tag));
  });

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      this.refresh();
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

  protected addTag(tag: string): void {
    const value = tag.trim();
    if (value.length === 0 || this.draftTags().includes(value)) {
      return;
    }
    this.annotationService.addTag(value);
    this.draftTags.update((tags) => [...tags, value]);
    this.tagInput.set('');
  }

  protected removeTag(tag: string): void {
    this.draftTags.update((tags) => tags.filter((candidate) => candidate !== tag));
  }

  protected async createAnnotation(): Promise<void> {
    const object = this.object();
    const text = this.draftText().trim();
    if (!object || text.length === 0) {
      return;
    }
    this.error.set(null);
    try {
      await this.annotationService.create({
        keyString: '',
        text,
        targets: [object.keyString],
        tags: this.draftTags(),
        annotationType: 'tag',
      });
      this.draftText.set('');
      this.draftTags.set([]);
      this.tagInput.set('');
      this.refresh.update((value) => value + 1);
    } catch (failure) {
      this.error.set(failure instanceof Error ? failure.message : 'Could not create annotation.');
    }
  }
}
