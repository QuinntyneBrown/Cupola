import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DomainObject, ObjectsGateway, SelectedItem } from '@cupola/core';

const SWATCHES = ['var(--cp-chart-1)', 'var(--cp-chart-2)', 'var(--cp-chart-3)', 'var(--cp-chart-4)'];

@Component({
  selector: 'cp-plot-series-inspector-view',
  templateUrl: './plot-series-inspector-view.component.html',
  styleUrl: './plot-series-inspector-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlotSeriesInspectorViewComponent {
  private readonly objects = inject(ObjectsGateway);

  readonly selection = input.required<SelectedItem[]>();

  protected readonly object = computed(() => this.selection()[0]?.context.object ?? null);
  protected readonly series = signal<{ keyString: string; name: string; swatch: string }[]>([]);

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      this.series.set([]);
      if (!object) {
        return;
      }
      const subscription = this.objects
        .getComposition(object.keyString)
        .subscribe((members: DomainObject[]) =>
          this.series.set(
            members.map((member, index) => ({
              keyString: member.keyString,
              name: member.name,
              swatch: SWATCHES[index % SWATCHES.length],
            })),
          ),
        );
      onCleanup(() => subscription.unsubscribe());
    });
  }
}
