import { TelemetryValueMetadata } from './telemetry-metadata-view';
import { ValueFormatRegistry } from './value-format-registry.service';

/**
 * Formats, parses, and validates the value of a single telemetry field using the
 * format named by its metadata. Requirement: OMCT-C06-L2-03.04.
 */
export class TelemetryValueFormatter {
  constructor(
    private readonly valueMetadata: TelemetryValueMetadata,
    private readonly registry: ValueFormatRegistry,
  ) {}

  private format() {
    const format = this.valueMetadata.format
      ? this.registry.get(this.valueMetadata.format)
      : undefined;
    if (!format) {
      throw new Error(
        `No registered format '${this.valueMetadata.format}' for value '${this.valueMetadata.key}'.`,
      );
    }
    return format;
  }

  /** Formats the datum's field value for display. */
  formatValue(datum: Record<string, unknown>): string {
    return this.format().format(datum[this.valueMetadata.key]);
  }

  parse(text: string): number {
    return this.format().parse(text);
  }

  validate(text: string): boolean {
    return this.format().validate(text);
  }
}
