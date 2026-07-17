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

import { CompsMathEngine } from './comps-math-engine';
import { DerivedExpressionConfig, isDerivedKind, readDerivedConfig } from './derived-models';

/**
 * Derived telemetry provider that evaluates a mathematical expression over
 * timestamp-aligned source telemetry (OMCT-C10-L2-03.01) and delays accumulated
 * output until the sample window is full (OMCT-C10-L2-03.02). Sources are
 * consumed through the telemetry API.
 */
@Injectable({ providedIn: 'root' })
export class DerivedTelemetryProvider implements TelemetryProvider {
  private readonly objects = inject(ObjectApi);
  private readonly telemetry = inject(TelemetryApiService);

  supportsRequest(object: DomainObject): boolean {
    return isDerivedKind(object, 'expression');
  }

  supportsSubscribe(object: DomainObject): boolean {
    return isDerivedKind(object, 'expression');
  }

  async request(object: DomainObject, request: TelemetryRequest): Promise<TelemetryValue[]> {
    const config = readDerivedConfig(object) as DerivedExpressionConfig;
    const engine = new CompsMathEngine(config, object.keyString);
    const sources = new Map<string, TelemetryValue[]>();
    for (const parameter of config.parameters) {
      const source = await this.objects.get(parameter.keyString);
      sources.set(parameter.keyString, await this.telemetry.request(source, request));
    }
    return engine.calculate(sources);
  }

  subscribe(object: DomainObject, emit: (datum: TelemetryDatum) => void): () => void {
    const config = readDerivedConfig(object) as DerivedExpressionConfig;
    const engine = new CompsMathEngine(config, object.keyString);
    const buffers = new Map<string, TelemetryValue[]>();
    const emitted = new Set<string>();
    let active = true;
    let teardown = () => {};

    void Promise.all(config.parameters.map((parameter) => this.objects.get(parameter.keyString))).then((sources) => {
      if (!active) {
        return;
      }
      const unsubscribes = sources.map((source) =>
        this.telemetry.subscribe(source, (datum) => {
          const value = Array.isArray(datum) ? datum[datum.length - 1] : datum;
          if (!value) {
            return;
          }
          const buffer = buffers.get(source.keyString) ?? [];
          buffer.push(value);
          buffers.set(source.keyString, buffer);
          for (const result of engine.calculate(buffers)) {
            if (!emitted.has(result.timestamp)) {
              emitted.add(result.timestamp);
              emit(result);
            }
          }
        }),
      );
      teardown = () => unsubscribes.forEach((unsubscribe) => unsubscribe());
    });

    return () => {
      active = false;
      teardown();
    };
  }
}
