import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Observable, map } from 'rxjs';
import { DomainObject, ObjectsGateway, RealtimeGateway } from '@cupola/core';

interface Series {
  keyString: string;
  name: string;
  unit: string;
  swatch: string;
  latest: number | null;
  points: number[];
}

const SWATCHES = ['var(--cp-chart-1)', 'var(--cp-chart-2)', 'var(--cp-chart-3)', 'var(--cp-chart-4)'];
const MAX_POINTS = 40;

@Component({
  selector: 'cp-plot-view',
  templateUrl: './plot-view.component.html',
  styleUrl: './plot-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlotViewComponent {
  private readonly objects = inject(ObjectsGateway);
  private readonly realtime = inject(RealtimeGateway);

  readonly object = input.required<DomainObject>();

  protected readonly series = signal<Series[]>([]);
  protected readonly polylines = computed(() =>
    this.series().map((s) => ({
      swatch: s.swatch,
      points: toPolyline(s.points),
    })),
  );

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      const subscriptions: { unsubscribe(): void }[] = [];

      const seriesKeys$ =
        object.composition.length > 0
          ? this.objects.getComposition(object.keyString)
          : this.objects.getObject(object.keyString).pipe(mapToArray());

      const seriesSub = seriesKeys$.subscribe((members) => {
        this.series.set(
          members.map((member, index) => ({
            keyString: member.keyString,
            name: member.name,
            unit: member.telemetry?.unit ?? '',
            swatch: SWATCHES[index % SWATCHES.length],
            latest: null,
            points: [],
          })),
        );

        for (const member of members) {
          const sub = this.realtime.telemetry(member.keyString).subscribe((value) => {
            this.series.update((all) =>
              all.map((s) =>
                s.keyString === member.keyString
                  ? {
                      ...s,
                      latest: value.value,
                      points: [...s.points, value.value].slice(-MAX_POINTS),
                    }
                  : s,
              ),
            );
          });
          subscriptions.push(sub);
        }
      });
      subscriptions.push(seriesSub);

      onCleanup(() => subscriptions.forEach((s) => s.unsubscribe()));
    });
  }

  protected formatValue(value: number | null): string {
    return value === null ? '—' : value.toFixed(1);
  }
}

function mapToArray() {
  return (source: Observable<DomainObject>): Observable<DomainObject[]> =>
    source.pipe(map((object) => [object]));
}

function toPolyline(points: number[]): string {
  if (points.length < 2) {
    return '';
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = 600 / (points.length - 1);
  return points
    .map((value, index) => {
      const x = index * stepX;
      const y = 232 - ((value - min) / range) * 224;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}
