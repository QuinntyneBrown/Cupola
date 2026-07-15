import { inject } from '@angular/core';
import {
  DurationFormat,
  ISOTimeFormat,
  LocalClock,
  LocalTimeFormat,
  TimeApiService,
  UTCTimeFormat,
} from '@cupola/core';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

/**
 * Registers the default time formats, time systems, and clocks, and seeds the
 * global context with a fixed default window. Called from an app initializer
 * before {@link UrlTimeSyncService} starts, so these defaults are not written
 * back over existing URL state.
 *
 * Requirements: OMCT-C05-L2-01.01, 03.04, 05.01, 05.02.
 */
export function registerDefaultTime(): void {
  const api = inject(TimeApiService);

  api.registerFormat(new UTCTimeFormat());
  api.registerFormat(new DurationFormat());
  api.registerFormat(new ISOTimeFormat());
  api.registerFormat(new LocalTimeFormat());

  api.registerTimeSystem({ key: 'utc', name: 'UTC', timeFormat: 'utc' });
  api.registerTimeSystem({ key: 'local', name: 'Local Time', timeFormat: 'local' });

  api.registerClock(new LocalClock(1000));
  // Deferred: the remote-telemetry clock (OMCT-C05-L2-03.05) and the
  // latest-available-data clock (OMCT-C05-L2-03.06) require the historical /
  // latest telemetry route that arrives with C06 (open contract #5, B05). They
  // are registered when that route lands, mirroring C01's deferral of 02.07.

  const global = api.globalContext();
  global.setTimeSystem('utc');
  const now = Date.now();
  global.setBounds({ start: now - FIFTEEN_MINUTES, end: now });
}
