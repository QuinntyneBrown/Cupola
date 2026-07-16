import { inject } from '@angular/core';
import {
  DefaultMetadataProvider,
  ExampleStalenessProvider,
  GatewayTelemetryProvider,
  LimitRegistry,
  MetadataRegistry,
  NumberFormat,
  SineLimitProvider,
  StalenessRegistry,
  TelemetryApiService,
  UtcFormat,
  ValueFormatRegistry,
} from '@cupola/core';

/**
 * Registers C06 telemetry defaults during application startup: the gateway-backed
 * telemetry provider, the default metadata provider, the number/utc value formats,
 * and the sine-limit + example-staleness providers. Must run inside an injection
 * context (the app initializer).
 *
 * Requirements: OMCT-C06-L2-01.01, 03.01, 03.03, 03.04, 04.03, 04.04.
 */
export function registerDefaultTelemetry(): void {
  inject(TelemetryApiService).addProvider(inject(GatewayTelemetryProvider));

  inject(MetadataRegistry).addProvider(inject(DefaultMetadataProvider));

  const formats = inject(ValueFormatRegistry);
  formats.register(new NumberFormat());
  formats.register(new UtcFormat());

  inject(LimitRegistry).addProvider(inject(SineLimitProvider));
  inject(StalenessRegistry).addProvider(inject(ExampleStalenessProvider));
}
