import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import {
  CupolaView,
  DomainObject,
  UrlParamsService,
  ViewProvider,
  ViewRegistry,
} from '@cupola/core';

/**
 * Hosts the applicable object view for the navigated object. Picks the
 * requested `?view=` provider when it applies, otherwise the highest
 * priority applicable view.
 * Requirements: OMCT-C15-L2-01.03, OMCT-C15-L2-02.01, OMCT-C15-L2-02.02.
 */
@Component({
  selector: 'cp-view-host',
  templateUrl: './view-host.component.html',
  styleUrl: './view-host.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-selection-parent': '',
    'data-testid': 'object-view',
  },
})
export class ViewHostComponent {
  private readonly registry = inject(ViewRegistry);
  private readonly urlParams = inject(UrlParamsService);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly object = input.required<DomainObject>();
  readonly objectPath = input.required<DomainObject[]>();

  private activeView: CupolaView | null = null;

  protected readonly resolvedView = computed<ViewProvider | null>(() => {
    const object = this.object();
    const path = this.objectPath();
    const applicable = this.registry.applicableViews(object, path);
    if (applicable.length === 0) {
      return null;
    }
    const requestedKey = this.urlParams.params()['view'];
    const requested = requestedKey ? applicable.find((v) => v.key === requestedKey) : undefined;
    return requested ?? applicable[0];
  });

  constructor() {
    effect(() => {
      const provider = this.resolvedView();
      const object = this.object();
      const path = this.objectPath();

      this.activeView?.destroy();
      this.activeView = null;

      if (provider) {
        this.activeView = this.registry.showView(
          provider,
          object,
          path,
          this.elementRef.nativeElement,
        );
      }
    });
  }
}
