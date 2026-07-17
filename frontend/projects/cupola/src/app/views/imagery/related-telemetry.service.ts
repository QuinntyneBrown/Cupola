import { Injectable, inject } from '@angular/core';
import { DomainObject, ObjectApi, TelemetryApiService } from '@cupola/core';

/** The latest related value at or before the focused image's time (03.01). */
export interface RelatedSample {
  keyString: string;
  name: string;
  value: number | null;
  timestamp: string | null;
  unit?: string;
}

/** Trailing request window; wide enough to catch sparse related sources. */
const WINDOW_MS = 15 * 60_000;

/**
 * Retrieves the latest configured related telemetry at a focused image's time
 * (OMCT-C11-L2-03.01): one trailing-window request per source ending at the
 * image time, taking the last datum at or before it — never a later one.
 */
@Injectable({ providedIn: 'root' })
export class RelatedTelemetryService {
  private readonly objects = inject(ObjectApi);
  private readonly telemetry = inject(TelemetryApiService);

  async sample(sources: string[], imageTime: number): Promise<RelatedSample[]> {
    return Promise.all(
      sources.map(async (keyString) => {
        try {
          const object = await this.objects.get(keyString);
          const values = await this.telemetry.request(object, {
            bounds: { start: imageTime - WINDOW_MS, end: imageTime },
          });
          let latest: { value: number; timestamp: string } | null = null;
          for (const datum of values) {
            const time = Date.parse(datum.timestamp);
            if (Number.isFinite(time) && time <= imageTime) {
              latest = datum;
            }
          }
          return {
            keyString,
            name: object.name,
            value: latest?.value ?? null,
            timestamp: latest?.timestamp ?? null,
            unit: object.telemetry?.unit,
          };
        } catch {
          return { keyString, name: keyString, value: null, timestamp: null };
        }
      }),
    );
  }
}
