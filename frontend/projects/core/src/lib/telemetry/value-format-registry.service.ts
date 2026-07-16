import { Injectable } from '@angular/core';

import { Format } from './value-format';

/** Registry of named value formats. Requirement: OMCT-C06-L2-03.04. */
@Injectable({ providedIn: 'root' })
export class ValueFormatRegistry {
  private readonly formats = new Map<string, Format>();

  register(format: Format): void {
    this.formats.set(format.key, format);
  }

  get(key: string): Format | undefined {
    return this.formats.get(key);
  }
}
