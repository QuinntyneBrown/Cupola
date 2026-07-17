import {
  DEFAULT_EMPTY_TABS_MESSAGE,
  emptyTabsMessage,
  loadsEagerly,
  retainsInactiveViews,
} from './tab-retention';

describe('OMCT-C09-L2-03.02 Tab view retention', () => {
  it('retains inactive views only under eager loading or keep-alive', () => {
    expect(retainsInactiveViews(undefined)).toBe(false);
    expect(retainsInactiveViews({})).toBe(false);
    expect(retainsInactiveViews({ eagerLoad: true })).toBe(true);
    expect(retainsInactiveViews({ keepAlive: true })).toBe(true);
  });

  it('loads every child eagerly only when eager loading is enabled', () => {
    expect(loadsEagerly({ keepAlive: true })).toBe(false);
    expect(loadsEagerly({ eagerLoad: true })).toBe(true);
  });
});

describe('OMCT-C09-L2-03.03 Empty tabs state', () => {
  it('falls back to the default empty-state message', () => {
    expect(emptyTabsMessage(undefined)).toBe(DEFAULT_EMPTY_TABS_MESSAGE);
    expect(emptyTabsMessage({ emptyMessage: '  ' })).toBe(DEFAULT_EMPTY_TABS_MESSAGE);
    expect(emptyTabsMessage({ emptyMessage: 'Nothing here.' })).toBe('Nothing here.');
  });
});
