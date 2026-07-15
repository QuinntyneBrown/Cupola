import { Injectable, inject } from '@angular/core';

import { UrlParamsService } from '../routing/url-params.service';
import { GlobalTimeContext } from './global-time-context';

/**
 * Synchronizes the global time configuration into the URL `tc.*` search
 * parameters. Writes only on change and only the affected keys, so unrelated
 * parameters are preserved and no write occurs unless the time state actually
 * changes. Real-time moving bounds are not written (the URL carries mode and
 * offsets instead), only fixed-mode bounds.
 *
 * `tc.mode` is `fixed` or the active clock key (e.g. `local`), matching the
 * scheme the shell already round-trips.
 *
 * Requirement: OMCT-C05-L2-04.03.
 */
@Injectable({ providedIn: 'root' })
export class UrlTimeSyncService {
  private readonly urlParams = inject(UrlParamsService);
  private readonly context = inject(GlobalTimeContext);
  private started = false;

  /**
   * Begins mirroring global time changes to the URL. Call after the default
   * time systems, clock, and bounds are registered so startup defaults are not
   * written back over existing URL state.
   */
  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    this.context.timeSystemChanged().subscribe((system) => {
      void this.urlParams.setParams({ 'tc.timeSystem': system.key });
    });

    this.context.clockChanged().subscribe((clockKey) => {
      void this.urlParams.setParams({ 'tc.mode': clockKey ?? 'fixed' });
    });

    this.context.boundsChanged().subscribe((bounds) => {
      if (this.context.mode() === 'fixed') {
        void this.urlParams.setParams({
          'tc.startBound': String(bounds.start),
          'tc.endBound': String(bounds.end),
        });
      }
    });

    this.context.offsetsChanged().subscribe((offsets) => {
      void this.urlParams.setParams({
        'tc.startDelta': String(offsets.start),
        'tc.endDelta': String(offsets.end),
      });
    });
  }
}
