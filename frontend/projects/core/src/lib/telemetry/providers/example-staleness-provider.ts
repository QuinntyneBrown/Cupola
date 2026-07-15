import { Injectable, inject } from '@angular/core';

import { RealtimeGateway } from '../../gateways/realtime-gateway';
import { DomainObject } from '../../models/domain-object';
import { isTelemetryObject } from '../default-metadata-provider';
import { StalenessEvent } from '../limits';
import { StalenessProvider } from '../staleness-registry.service';

/**
 * Example staleness provider: an object is stale when no telemetry arrives within
 * {@link stalenessMs}; each datum clears staleness and re-arms the timer.
 * Requirement: OMCT-C06-L2-04.04.
 */
@Injectable({ providedIn: 'root' })
export class ExampleStalenessProvider implements StalenessProvider {
  private readonly realtime = inject(RealtimeGateway);
  readonly stalenessMs = 10_000;

  supportsStaleness(object: DomainObject): boolean {
    return isTelemetryObject(object);
  }

  subscribe(object: DomainObject, callback: (event: StalenessEvent) => void): () => void {
    let timer: ReturnType<typeof setTimeout>;
    const markStale = () =>
      callback({ keyString: object.keyString, isStale: true, timestamp: new Date().toISOString() });
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(markStale, this.stalenessMs);
    };

    const subscription = this.realtime.telemetry(object.keyString).subscribe(() => {
      callback({ keyString: object.keyString, isStale: false, timestamp: new Date().toISOString() });
      arm();
    });
    arm();

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }
}
