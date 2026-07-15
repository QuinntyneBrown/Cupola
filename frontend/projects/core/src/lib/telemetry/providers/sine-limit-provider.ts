import { Injectable } from '@angular/core';

import { DomainObject } from '../../models/domain-object';
import { TelemetryValue } from '../../models/telemetry-value';
import { isTelemetryObject } from '../default-metadata-provider';
import { LimitEvaluation } from '../limits';
import { LimitProvider } from '../limit-registry.service';

/**
 * Example limit provider for the sine-wave telemetry source: warning at |v| >= 0.5,
 * critical at |v| >= 0.9. Requirement: OMCT-C06-L2-04.03.
 */
@Injectable({ providedIn: 'root' })
export class SineLimitProvider implements LimitProvider {
  supportsLimits(object: DomainObject): boolean {
    return isTelemetryObject(object);
  }

  evaluate(datum: TelemetryValue): LimitEvaluation | undefined {
    const magnitude = Math.abs(datum.value);
    if (magnitude >= 0.9) {
      return { level: 'critical', name: 'Critical', cssClass: 'is-limit--critical', low: -0.9, high: 0.9 };
    }
    if (magnitude >= 0.5) {
      return { level: 'warning', name: 'Warning', cssClass: 'is-limit--warning', low: -0.5, high: 0.5 };
    }
    return undefined;
  }
}
