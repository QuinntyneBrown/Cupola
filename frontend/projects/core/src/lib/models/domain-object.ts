import { Identifier } from './identifier';
import { TelemetryMetadata } from './telemetry-metadata';

export interface DomainObject {
  identifier: Identifier;
  keyString: string;
  name: string;
  type: string;
  location: string | null;
  composition: string[];
  telemetry?: TelemetryMetadata | null;
  created?: string;
  modified?: string;
  createdBy?: string;
}
