import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CUPOLA_CONFIG, TelemetryFilter, TelemetryGateway, TelemetryValue } from '@cupola/core';

/**
 * Historical telemetry transport: GET /api/telemetry/{keyString}?start=&end= (B06).
 * Active filters (B08) travel as a `filters` JSON query parameter; the backend may
 * ignore it, and the calling provider applies the filters to the returned data.
 */
@Injectable()
export class HttpTelemetryGateway extends TelemetryGateway {
  private readonly http = inject(HttpClient);
  private readonly config = inject(CUPOLA_CONFIG);

  override requestHistory(
    keyString: string,
    start: number,
    end: number,
    filters?: TelemetryFilter[],
  ): Promise<TelemetryValue[]> {
    const params: Record<string, string> = { start: String(start), end: String(end) };
    if (filters?.length) {
      params['filters'] = JSON.stringify(filters);
    }
    return firstValueFrom(
      this.http.get<TelemetryValue[]>(
        `${this.config.apiBaseUrl}/telemetry/${encodeURIComponent(keyString)}`,
        { params },
      ),
    );
  }
}
