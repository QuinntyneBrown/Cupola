import { Injectable } from '@angular/core';

import { TimeFormat } from './time-format';

/**
 * Registry of time formats keyed by {@link TimeFormat.key}. A time system
 * references a format by key; consumers resolve the formatter through this
 * registry. Requirements: OMCT-C05-L2-05.01, OMCT-C05-L2-05.02.
 */
@Injectable({ providedIn: 'root' })
export class FormatRegistry {
  private readonly formats = new Map<string, TimeFormat>();

  register(format: TimeFormat): void {
    this.formats.set(format.key, format);
  }

  get(key: string): TimeFormat | undefined {
    return this.formats.get(key);
  }

  has(key: string): boolean {
    return this.formats.has(key);
  }
}
