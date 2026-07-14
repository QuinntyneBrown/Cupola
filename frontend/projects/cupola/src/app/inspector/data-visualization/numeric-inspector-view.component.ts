import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DomainObject, RealtimeGateway } from '@cupola/core';

const MAX_POINTS = 30;

@Component({
  selector: 'cp-numeric-inspector-view',
  templateUrl: './numeric-inspector-view.component.html',
  styleUrl: './numeric-inspector-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumericInspectorViewComponent {
  private readonly realtime = inject(RealtimeGateway);

  readonly object = input.required<DomainObject>();

  protected readonly latest = signal<number | null>(null);
  protected readonly points = signal<number[]>([]);
  protected readonly unit = computed(() => this.object().telemetry?.unit ?? '');
  protected readonly sparkline = computed(() => sparkPoints(this.points()));

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      this.latest.set(null);
      this.points.set([]);
      const subscription = this.realtime.telemetry(object.keyString).subscribe((value) => {
        this.latest.set(value.value);
        this.points.update((points) => [...points, value.value].slice(-MAX_POINTS));
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected formatValue(value: number | null): string {
    return value === null ? '—' : value.toFixed(2);
  }
}

function sparkPoints(points: number[]): string {
  if (points.length < 2) {
    return '';
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = 200 / (points.length - 1);
  return points
    .map((value, index) => `${(index * stepX).toFixed(1)},${(36 - ((value - min) / range) * 32).toFixed(1)}`)
    .join(' ');
}
