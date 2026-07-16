import { Injectable, inject } from '@angular/core';

import { RealtimeGateway } from '../gateways/realtime-gateway';
import { DomainObject } from '../models/domain-object';
import { TelemetryValue } from '../models/telemetry-value';
import { isTelemetryObject } from './default-metadata-provider';
import { applyFilters, matchesFilters } from './telemetry-filtering';
import { TelemetryDatum, TelemetryProvider, TelemetrySubscribeOptions } from './telemetry-provider';
import { TelemetryGateway } from './telemetry-gateway';
import { TelemetryRequest } from './telemetry-request';

/**
 * Default telemetry provider: historical via the {@link TelemetryGateway} and
 * realtime via the {@link RealtimeGateway}. As a legacy single-datum provider it
 * relays each realtime value unchanged (OMCT-C06-L2-02.05). Active filters (B08)
 * forward to the transport and apply to historical results and realtime emissions
 * (OMCT-C10-L2-04.03).
 */
@Injectable({ providedIn: 'root' })
export class GatewayTelemetryProvider implements TelemetryProvider {
  private readonly gateway = inject(TelemetryGateway);
  private readonly realtime = inject(RealtimeGateway);

  supportsRequest(object: DomainObject): boolean {
    return isTelemetryObject(object);
  }

  supportsSubscribe(object: DomainObject): boolean {
    return isTelemetryObject(object);
  }

  async request(object: DomainObject, request: TelemetryRequest): Promise<TelemetryValue[]> {
    const values = await this.gateway.requestHistory(
      object.keyString,
      request.bounds.start,
      request.bounds.end,
      request.filters,
    );
    return applyFilters(values, request.filters);
  }

  subscribe(
    object: DomainObject,
    emit: (datum: TelemetryDatum) => void,
    options?: TelemetrySubscribeOptions,
  ): () => void {
    const subscription = this.realtime.telemetry(object.keyString).subscribe((datum) => {
      if (matchesFilters(datum, options?.filters)) {
        emit(datum);
      }
    });
    return () => subscription.unsubscribe();
  }
}
