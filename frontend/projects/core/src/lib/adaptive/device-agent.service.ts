import { Injectable } from '@angular/core';

import { DeviceAgent } from './device-agent';

/** Detects device characteristics from matchMedia and navigator. */
@Injectable({ providedIn: 'root' })
export class DeviceAgentService implements DeviceAgent {
  isPhone(): boolean {
    return matchMedia('(max-width: 640px)').matches;
  }

  isTablet(): boolean {
    return matchMedia('(min-width: 641px) and (max-width: 1024px)').matches && this.isTouch();
  }

  isMobile(): boolean {
    return this.isPhone() || this.isTablet();
  }

  isDesktop(): boolean {
    return !this.isMobile();
  }

  isPortrait(): boolean {
    return matchMedia('(orientation: portrait)').matches;
  }

  isLandscape(): boolean {
    return !this.isPortrait();
  }

  isTouch(): boolean {
    return matchMedia('(any-pointer: coarse)').matches;
  }
}
