/**
 * Tabs loading policy persisted at `configuration.tabs` (OMCT-C09-L2-03.02):
 * eager loading instantiates every child up front; keep-alive retains views
 * instantiated on demand; with neither flag, deactivated views destroy.
 */
export interface TabsConfiguration {
  eagerLoad?: boolean;
  keepAlive?: boolean;
  emptyMessage?: string;
}

export const DEFAULT_EMPTY_TABS_MESSAGE = 'Drag objects here to add tabs.';

/** Whether inactive tab views are retained rather than destroyed. */
export function retainsInactiveViews(config: TabsConfiguration | undefined): boolean {
  return config?.eagerLoad === true || config?.keepAlive === true;
}

/** Whether every child view instantiates as soon as the tabs object renders. */
export function loadsEagerly(config: TabsConfiguration | undefined): boolean {
  return config?.eagerLoad === true;
}

export function emptyTabsMessage(config: TabsConfiguration | undefined): string {
  return config?.emptyMessage?.trim() || DEFAULT_EMPTY_TABS_MESSAGE;
}
