import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { EventTrackViewComponent } from './event-track-view.component';
import { isEventTelemetry } from '../time-strip/strip-eligibility';

/**
 * Event timeline view provider (OMCT-C12-L2-02.04). Applies to telemetry with a
 * domain value and no numeric range or image hint. Priority 86 so it wins over
 * the tabular fallback for a domain-only object.
 */
export class EventTimelineViewProvider implements ViewProvider {
  readonly key = 'event-timeline';
  readonly name = 'Event Timeline';
  readonly glyph = 'i-flag';
  readonly priority = 86;

  constructor(private readonly injector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return isEventTelemetry(object);
  }

  view(object: DomainObject, objectPath: DomainObject[]): CupolaView {
    return componentView(this.injector, EventTrackViewComponent, { object, objectPath });
  }
}
