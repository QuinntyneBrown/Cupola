import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { DomainObject, ObjectApi, TelemetryFilter } from '@cupola/core';

/**
 * Persisted filter configuration for a composite telemetry view, stored under
 * `configuration.filters` (OMCT-C10-L2-04.02).
 */
export interface ViewFilterConfiguration {
  /** Filters applied to every compatible composed object. */
  global?: TelemetryFilter[];
  /** Filters applied to a single composed object, keyed by its keyString. */
  byObject?: Record<string, TelemetryFilter[]>;
}

/**
 * Reads and writes scoped telemetry filters on a view object and merges the
 * applicable set for a composed child (OMCT-C10-L2-04.02). Saves persist through
 * the object API (POST /api/objects); an in-session overlay keeps open views
 * reactive to a save without waiting for a provider round-trip.
 */
@Injectable({ providedIn: 'root' })
export class FilterStore {
  private readonly objects = inject(ObjectApi);
  private readonly overlay = new Map<string, ViewFilterConfiguration>();
  private readonly changes$ = new Subject<{ keyString: string; config: ViewFilterConfiguration }>();

  /** The stored filter configuration for a view, overlay first then persisted. */
  read(view: DomainObject): ViewFilterConfiguration {
    return (
      this.overlay.get(view.keyString) ??
      (view.configuration?.['filters'] as ViewFilterConfiguration | undefined) ??
      {}
    );
  }

  /**
   * Merges global and object-specific filters for a composed child; an
   * object-specific filter overrides a global filter with the same key.
   */
  applicableFilters(view: DomainObject, childKeyString: string): TelemetryFilter[] {
    const config = this.read(view);
    const byKey = new Map<string, TelemetryFilter>();
    for (const global of config.global ?? []) {
      byKey.set(global.key, global);
    }
    for (const scoped of config.byObject?.[childKeyString] ?? []) {
      byKey.set(scoped.key, scoped);
    }
    return [...byKey.values()];
  }

  /** Emits the filter configuration whenever a save changes it for a view. */
  changes(viewKeyString: string): Observable<ViewFilterConfiguration> {
    return this.changes$.pipe(
      filter((event) => event.keyString === viewKeyString),
      map((event) => event.config),
    );
  }

  /** Persists object-specific filters for a composed child (OMCT-C10-L2-04.02). */
  saveObjectFilter(
    view: DomainObject,
    childKeyString: string,
    filters: TelemetryFilter[],
  ): Promise<DomainObject> {
    const config = clone(this.read(view));
    const byObject = { ...(config.byObject ?? {}) };
    if (filters.length) {
      byObject[childKeyString] = filters;
    } else {
      delete byObject[childKeyString];
    }
    config.byObject = byObject;
    return this.persist(view, config);
  }

  /** Persists global filters for a view (OMCT-C10-L2-04.02). */
  saveGlobalFilter(view: DomainObject, filters: TelemetryFilter[]): Promise<DomainObject> {
    const config = clone(this.read(view));
    config.global = filters;
    return this.persist(view, config);
  }

  private async persist(view: DomainObject, config: ViewFilterConfiguration): Promise<DomainObject> {
    this.overlay.set(view.keyString, config);
    const updated: DomainObject = {
      ...view,
      configuration: { ...view.configuration, filters: config },
    };
    await this.objects.save(updated);
    this.changes$.next({ keyString: view.keyString, config });
    return updated;
  }
}

function clone(config: ViewFilterConfiguration): ViewFilterConfiguration {
  return JSON.parse(JSON.stringify(config)) as ViewFilterConfiguration;
}
