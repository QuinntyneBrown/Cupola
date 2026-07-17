import { TelemetryFilterDefinition } from './telemetry-filter';

/** An overlay layer an image source declares (B06 wave-5 extension, OMCT-C11-L2-02.04). */
export interface ImageLayerDefinition {
  key: string;
  name: string;
  /** Root-relative URL of the overlay asset. */
  source: string;
  /** Default visibility before any per-object persisted state. */
  visible?: boolean;
}

/** Imagery declarations carried by image-hinted telemetry metadata (OMCT-C11-L2-02.04, 03.01). */
export interface ImageryMetadata {
  layers?: ImageLayerDefinition[];
  /** Key strings of related telemetry sources sampled at the focused image's time. */
  relatedTelemetry?: string[];
}

export interface TelemetryMetadata {
  hints: string[];
  unit?: string;
  /** Filter definitions this source supports (B08, OMCT-C10-L2-04.01). */
  filters?: TelemetryFilterDefinition[];
  /** Imagery layer and related-source declarations (wave-5 B06 extension). */
  imagery?: ImageryMetadata;
}
