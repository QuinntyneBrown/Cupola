import { DomainObject } from '@cupola/core';

import { TimeListFilter } from './activity-filter';
import { TimeListSort } from './activity-sorter';

/** Configuration family under which time-list filter/sort is persisted. */
export const TIME_LIST_FAMILY = 'timeList';

/** Persisted time-list configuration (OMCT-C12-L2-03.02, 03.03). */
export interface TimeListConfiguration {
  filter: TimeListFilter;
  sort: TimeListSort;
}

export const TIME_LIST_DEFAULTS: TimeListConfiguration = {
  filter: {},
  sort: { property: 'start', direction: 'asc' },
};

/** Reads `configuration.timeList`, merged over the defaults. */
export function readTimeListConfig(object: DomainObject): TimeListConfiguration {
  const stored = (object.configuration?.[TIME_LIST_FAMILY] ?? {}) as Partial<TimeListConfiguration>;
  return {
    filter: stored.filter ?? { ...TIME_LIST_DEFAULTS.filter },
    sort: stored.sort ?? { ...TIME_LIST_DEFAULTS.sort },
  };
}
