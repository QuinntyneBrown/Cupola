import { TelemetryFilterDefinition } from './telemetry-filter';

export interface TelemetryMetadata {
  hints: string[];
  unit?: string;
  /** Filter definitions this source supports (B08, OMCT-C10-L2-04.01). */
  filters?: TelemetryFilterDefinition[];
}
