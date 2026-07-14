import { TestBed } from '@angular/core/testing';

import { DeviceAgent } from './device-agent';
import { DeviceClassifierService } from './device-classifier.service';

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

describe('OMCT-C15-L2-05.01 DeviceClassifierService', () => {
  let service: DeviceClassifierService;
  let body: HTMLElement;

  beforeEach(() => {
    service = TestBed.inject(DeviceClassifierService);
    body = document.createElement('div');
  });

  it('adds classes for matching characteristics and omits nonmatching ones', () => {
    service.classify(agent({ isMobile: true, isPhone: true, isPortrait: true, isTouch: true }), body);

    expect(body.classList.contains('mobile')).toBe(true);
    expect(body.classList.contains('phone')).toBe(true);
    expect(body.classList.contains('portrait')).toBe(true);
    expect(body.classList.contains('touch')).toBe(true);
    expect(body.classList.contains('desktop')).toBe(false);
    expect(body.classList.contains('landscape')).toBe(false);
    expect(body.classList.contains('tablet')).toBe(false);
  });

  it('updates classes when the device characteristics change', () => {
    service.classify(agent({ isPhone: true, isMobile: true, isPortrait: true, isTouch: true }), body);
    service.classify(agent({ isDesktop: true, isLandscape: true }), body);

    expect(body.classList.contains('desktop')).toBe(true);
    expect(body.classList.contains('landscape')).toBe(true);
    expect(body.classList.contains('phone')).toBe(false);
    expect(body.classList.contains('touch')).toBe(false);
  });
});
