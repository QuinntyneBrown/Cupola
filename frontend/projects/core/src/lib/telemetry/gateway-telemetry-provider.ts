import { Injectable, inject } from '@angular/core';

import { RealtimeGateway } from '../gateways/realtime-gateway';
import { DomainObject } from '../models/domain-object';
import { TelemetryValue } from '../models/telemetry-value';
import { isTelemetryObject } from './default-metadata-provider';
import { TelemetryDatum, TelemetryProvider } from './telemetry-provider';
import { TelemetryGateway } from './telemetry-gateway';
import { TelemetryRequest } from './telemetry-request';

/**
 * Default telemetry provider: historical via the {@link TelemetryGateway} and
 * realtime via the {@link RealtimeGateway}. As a legacy single-datum provider it
 * relays each realtime value unchanged (OMCT-C06-L2-02.05).
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

  request(object: DomainObject, request: TelemetryRequest): Promise<TelemetryValue[]> {
    return this.gateway.requestHistory(object.keyString, request.bounds.start, request.bounds.end);
  }

  subscribe(object: DomainObject, emit: (datum: TelemetryDatum) => void): () => void {
    const subscription = this.realtime
      .telemetry(object.keyString)
      .subscribe((datum) => emit(datum));
    return () => subscription.unsubscribe();
  }
}
