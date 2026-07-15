import { Action } from '@cupola/core';

import { ClearDataService } from './clear-data.service';

/** Emits the global clear-data event. Requirement: OMCT-C03-L2-04.04. */
export class ClearDataAction implements Action {
  readonly key = 'clearData';
  readonly name = 'Clear data';
  readonly glyph = 'i-eraser';
  readonly priority = 5;
  readonly showInStatusBar = true;

  constructor(private readonly clearData: ClearDataService) {}

  appliesTo(): boolean {
    return true;
  }

  invoke(): void {
    this.clearData.clear();
  }
}
