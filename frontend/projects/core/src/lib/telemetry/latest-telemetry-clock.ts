import { RealtimeGateway } from '../gateways/realtime-gateway';
import { DomainObject } from '../models/domain-object';
import { Clock } from '../time/clock';

/**
 * A C05 {@link Clock} that ticks from the latest available telemetry of a domain
 * object — the enabler for C05's latest-available-data clock (OMCT-C05-L2-03.06).
 * C06 provides this primitive; C05 registers it in its own time feature dir.
 */
export class LatestTelemetryClock implements Clock {
  readonly key = 'latest-telemetry';
  readonly name = 'Latest available data';

  constructor(
    private readonly realtime: RealtimeGateway,
    private readonly object: DomainObject,
  ) {}

  subscribe(callback: (tick: number) => void): () => void {
    const subscription = this.realtime
      .telemetry(this.object.keyString)
      .subscribe((datum) => callback(Date.parse(datum.timestamp)));
    return () => subscription.unsubscribe();
  }
}
