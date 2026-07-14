import { DeviceAgent } from './device-agent';

/** Body-class name → predicate over the device agent. */
export const DEVICE_MATCHERS: ReadonlyMap<string, (agent: DeviceAgent) => boolean> = new Map([
  ['mobile', (agent: DeviceAgent) => agent.isMobile()],
  ['phone', (agent: DeviceAgent) => agent.isPhone()],
  ['tablet', (agent: DeviceAgent) => agent.isTablet()],
  ['desktop', (agent: DeviceAgent) => agent.isDesktop()],
  ['portrait', (agent: DeviceAgent) => agent.isPortrait()],
  ['landscape', (agent: DeviceAgent) => agent.isLandscape()],
  ['touch', (agent: DeviceAgent) => agent.isTouch()],
]);
