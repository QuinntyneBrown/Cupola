import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { DomainObject, TelemetryApiService, TelemetryValue } from '@cupola/core';

/**
 * Minimal latest-value view for a derived-telemetry object, exposing the current
 * emission so it can be observed (OMCT-C10-L2-03.01–03.04). The derived provider
 * selected by the telemetry API supplies the values.
 */
@Component({
  selector: 'cp-derived-view',
  templateUrl: './derived-view.component.html',
  styleUrl: './derived-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DerivedViewComponent {
  private readonly telemetry = inject(TelemetryApiService);

  readonly object = input.required<DomainObject>();

  protected readonly latest = signal<number | null>(null);

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      this.latest.set(null);
      const unsubscribe = this.telemetry.subscribe(object, (datum) => {
        const value = Array.isArray(datum) ? (datum[datum.length - 1] as TelemetryValue) : datum;
        if (value) {
          this.latest.set(value.value);
        }
      });
      onCleanup(unsubscribe);
    });
  }

  protected formatValue(value: number | null): string {
    return value === null ? '—' : value.toFixed(2);
  }
}
