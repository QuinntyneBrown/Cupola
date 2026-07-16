import { DomainObject } from '../models/domain-object';
import { TelemetryValue } from '../models/telemetry-value';
import { TelemetryRequest } from './telemetry-request';

/** A single datum or a batch of data delivered by a provider subscription. */
export type TelemetryDatum = TelemetryValue | TelemetryValue[];

/**
 * A source of telemetry for the domain objects it supports.
 * Requirement: OMCT-C06-L2-01.01 (provider selection).
 */
export interface TelemetryProvider {
  supportsRequest(object: DomainObject): boolean;
  supportsSubscribe(object: DomainObject): boolean;
  /** Loads historical data bounded by the request. */
  request(object: DomainObject, request: TelemetryRequest): Promise<TelemetryValue[]>;
  /** Subscribes to realtime data; emits a datum or batch. Returns an unsubscribe function. */
  subscribe(object: DomainObject, emit: (datum: TelemetryDatum) => void): () => void;
}
