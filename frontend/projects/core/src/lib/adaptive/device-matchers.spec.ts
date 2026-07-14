import { DeviceAgent } from './device-agent';
import { DEVICE_MATCHERS } from './device-matchers';

function agent(overrides: Partial<Record<keyof DeviceAgent, boolean>>): DeviceAgent {
  return {
    isMobile: () => overrides.isMobile ?? false,
    isPhone: () => overrides.isPhone ?? false,
    isTablet: () => overrides.isTablet ?? false,
    isDesktop: () => overrides.isDesktop ?? false,
    isPortrait: () => overrides.isPortrait ?? false,
    isLandscape: () => overrides.isLandscape ?? false,
    isTouch: () => overrides.isTouch ?? false,
  };
}

describe('OMCT-C15-L2-05.01 device matchers', () => {
  it('matches phone characteristics for a portrait touch phone', () => {
    const phone = agent({ isMobile: true, isPhone: true, isPortrait: true, isTouch: true });
    const matched = [...DEVICE_MATCHERS].filter(([, predicate]) => predicate(phone)).map(([n]) => n);
    expect(matched.sort()).toEqual(['mobile', 'phone', 'portrait', 'touch']);
  });

  it('matches desktop characteristics for a landscape non-touch desktop', () => {
    const desktop = agent({ isDesktop: true, isLandscape: true });
    const matched = [...DEVICE_MATCHERS].filter(([, predicate]) => predicate(desktop)).map(([n]) => n);
    expect(matched.sort()).toEqual(['desktop', 'landscape']);
  });
});
