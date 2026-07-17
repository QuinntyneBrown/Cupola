import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { CupolaView, DomainObject, ObjectApi, ViewRegistry } from '@cupola/core';

/**
 * Hosts an embedded object's applicable view inside a layout container
 * (OMCT-C09-L2-01.04): resolves the object, picks the configured view key when
 * it applies (highest-priority applicable view otherwise), and guards against
 * a layout embedding itself anywhere along the object path.
 */
@Component({
  selector: 'cp-embedded-object-view',
  template: `
    @if (recursive()) {
      <div class="cp-empty" data-testid="embedded-recursive">
        {{ object()?.name ?? keyString() }} cannot embed itself.
      </div>
    } @else if (missing()) {
      <div class="cp-empty" data-testid="embedded-missing">Object not found.</div>
    }
    <div class="embedded-host" #host></div>
  `,
  styles: `
    :host,
    .embedded-host {
      display: block;
      height: 100%;
      min-height: 0;
      overflow: hidden;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmbeddedObjectViewComponent {
  private readonly objects = inject(ObjectApi);
  private readonly views = inject(ViewRegistry);

  readonly keyString = input.required<string>();
  readonly objectPath = input<DomainObject[]>([]);
  readonly viewKey = input<string | undefined>(undefined);

  protected readonly object = signal<DomainObject | null>(null);
  protected readonly missing = signal(false);
  protected readonly recursive = computed(() =>
    this.objectPath().some((ancestor) => ancestor.keyString === this.keyString()),
  );

  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private view: CupolaView | null = null;
  private token = 0;

  constructor() {
    effect((onCleanup) => {
      const keyString = this.keyString();
      const recursive = this.recursive();
      const current = ++this.token;

      this.destroyView();
      this.object.set(null);
      this.missing.set(false);

      if (!recursive) {
        void this.objects
          .get(keyString)
          .then((object) => {
            if (current === this.token) {
              this.object.set(object);
              this.mount(object);
            }
          })
          .catch(() => {
            if (current === this.token) {
              this.missing.set(true);
            }
          });
      }

      onCleanup(() => this.destroyView());
    });
  }

  private mount(object: DomainObject): void {
    const path = [...this.objectPath(), object];
    const applicable = this.views.applicableViews(object, path);
    if (applicable.length === 0) {
      this.missing.set(true);
      return;
    }
    const requested = this.viewKey();
    const provider = applicable.find((candidate) => candidate.key === requested) ?? applicable[0];
    this.view = this.views.showView(provider, object, path, this.host().nativeElement);
  }

  private destroyView(): void {
    this.view?.destroy();
    this.view = null;
  }
}
