import { Injectable, inject } from '@angular/core';
import {
  DomainObject,
  ObjectApi,
  TelemetryApiService,
  TelemetryDatum,
  TelemetryProvider,
  TelemetryRequest,
  TelemetryValue,
} from '@cupola/core';

import { DerivedMeanConfig, isDerivedKind, readDerivedConfig } from './derived-models';

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Emits the arithmetic mean of the latest sample window of a source range
 * (OMCT-C10-L2-03.03). A mean is produced only once at least the configured
 * sample count is available.
 */
@Injectable({ providedIn: 'root' })
export class MeanTelemetryProvider implements TelemetryProvider {
  private readonly objects = inject(ObjectApi);
  private readonly telemetry = inject(TelemetryApiService);

  supportsRequest(object: DomainObject): boolean {
    return isDerivedKind(object, 'mean');
  }

  supportsSubscribe(object: DomainObject): boolean {
    return isDerivedKind(object, 'mean');
  }

  async request(object: DomainObject, request: TelemetryRequest): Promise<TelemetryValue[]> {
    const config = readDerivedConfig(object) as DerivedMeanConfig;
    const source = await this.objects.get(config.sourceKeyString);
    const values = await this.telemetry.request(source, request);
    const results: TelemetryValue[] = [];
    for (let index = config.sampleCount - 1; index < values.length; index += 1) {
      const window = values.slice(index - config.sampleCount + 1, index + 1);
      results.push({
        keyString: object.keyString,
        timestamp: values[index].timestamp,
        value: mean(window.map((datum) => datum.value)),
      });
    }
    return results;
  }

  subscribe(object: DomainObject, emit: (datum: TelemetryDatum) => void): () => void {
    const config = readDerivedConfig(object) as DerivedMeanConfig;
    const window: TelemetryValue[] = [];
    let active = true;
    let teardown = () => {};

    void this.objects.get(config.sourceKeyString).then((source) => {
      if (!active) {
        return;
      }
      const unsubscribe = this.telemetry.subscribe(source, (datum) => {
        const value = Array.isArray(datum) ? datum[datum.length - 1] : datum;
        if (!value) {
          return;
        }
        window.push(value);
        if (window.length > config.sampleCount) {
          window.shift();
        }
        if (window.length === config.sampleCount) {
          emit({
            keyString: object.keyString,
            timestamp: value.timestamp,
            value: mean(window.map((entry) => entry.value)),
          });
        }
      });
      teardown = () => unsubscribe();
    });

    return () => {
      active = false;
      teardown();
    };
  }
}
