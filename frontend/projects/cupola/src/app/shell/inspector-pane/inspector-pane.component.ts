import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  CupolaView,
  InspectorViewProvider,
  InspectorViewRegistry,
  SelectionService,
} from '@cupola/core';

@Component({
  selector: 'cp-inspector-pane',
  templateUrl: './inspector-pane.component.html',
  styleUrl: './inspector-pane.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InspectorPaneComponent {
  private readonly registry = inject(InspectorViewRegistry);
  private readonly selection = inject(SelectionService);
  private readonly content = viewChild<ElementRef<HTMLElement>>('content');

  private activeView: CupolaView | null = null;

  protected readonly views = computed<InspectorViewProvider[]>(() =>
    this.registry.applicableViews(this.selection.selected()),
  );
  protected readonly activeKey = signal<string | null>(null);
  protected readonly activeProvider = computed<InspectorViewProvider | null>(() => {
    const views = this.views();
    if (views.length === 0) {
      return null;
    }
    return views.find((view) => view.key === this.activeKey()) ?? views[0];
  });

  constructor() {
    // Keep the active tab valid as the applicable views change.
    effect(() => {
      const views = this.views();
      const active = this.activeKey();
      if (views.length > 0 && !views.some((view) => view.key === active)) {
        this.activeKey.set(views[0].key);
      }
    });

    // Mount the active inspector view into the content element.
    effect(() => {
      const provider = this.activeProvider();
      const selection = this.selection.selected();
      const host = this.content()?.nativeElement;

      this.activeView?.destroy();
      this.activeView = null;

      if (provider && host) {
        this.activeView = provider.view(selection);
        this.activeView.show(host);
      }
    });
  }

  protected select(key: string): void {
    this.activeKey.set(key);
  }
}
