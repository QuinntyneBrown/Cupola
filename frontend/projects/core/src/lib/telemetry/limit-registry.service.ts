import { Injectable } from '@angular/core';

import { DomainObject } from '../models/domain-object';
import { TelemetryValue } from '../models/telemetry-value';
import { LimitEvaluation } from './limits';

/** Evaluates a datum against an object's limits. */
export interface LimitProvider {
  supportsLimits(object: DomainObject): boolean;
  evaluate(datum: TelemetryValue, object: DomainObject): LimitEvaluation | undefined;
}

/**
 * Returns the first applicable limit provider's evaluation for a datum.
 * Requirement: OMCT-C06-L2-04.03.
 */
@Injectable({ providedIn: 'root' })
export class LimitRegistry {
  private readonly providers: LimitProvider[] = [];

  addProvider(provider: LimitProvider): void {
    this.providers.push(provider);
  }

  evaluate(datum: TelemetryValue, object: DomainObject): LimitEvaluation | undefined {
    const provider = this.providers.find((candidate) => candidate.supportsLimits(object));
    return provider?.evaluate(datum, object);
  }
}
