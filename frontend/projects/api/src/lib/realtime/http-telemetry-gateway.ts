import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CUPOLA_CONFIG, TelemetryGateway, TelemetryValue } from '@cupola/core';

/** Historical telemetry transport: GET /api/telemetry/{keyString}?start=&end= (B06). */
@Injectable()
export class HttpTelemetryGateway extends TelemetryGateway {
  private readonly http = inject(HttpClient);
  private readonly config = inject(CUPOLA_CONFIG);

  override requestHistory(keyString: string, start: number, end: number): Promise<TelemetryValue[]> {
    return firstValueFrom(
      this.http.get<TelemetryValue[]>(
        `${this.config.apiBaseUrl}/telemetry/${encodeURIComponent(keyString)}`,
        { params: { start: String(start), end: String(end) } },
      ),
    );
  }
}
