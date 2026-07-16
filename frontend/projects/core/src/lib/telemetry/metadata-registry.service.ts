import { Injectable } from '@angular/core';

import { DomainObject } from '../models/domain-object';
import { TelemetryMetadataProvider, TelemetryMetadataView } from './telemetry-metadata-view';

/**
 * Selects telemetry metadata by provider priority, breaking ties by registration
 * order. Requirement: OMCT-C06-L2-03.01.
 */
@Injectable({ providedIn: 'root' })
export class MetadataRegistry {
  private readonly providers: TelemetryMetadataProvider[] = [];

  addProvider(provider: TelemetryMetadataProvider): void {
    this.providers.push(provider);
  }

  getMetadata(object: DomainObject): TelemetryMetadataView | undefined {
    const chosen = this.providers
      .map((provider, index) => ({ provider, index }))
      .filter(({ provider }) => provider.supportsMetadata(object))
      .sort(
        (a, b) =>
          (b.provider.priority ?? 0) - (a.provider.priority ?? 0) || a.index - b.index,
      )[0];
    return chosen ? new TelemetryMetadataView(chosen.provider.getMetadata(object)) : undefined;
  }
}
