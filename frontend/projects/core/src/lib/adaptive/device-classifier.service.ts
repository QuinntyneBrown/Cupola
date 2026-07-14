import { DOCUMENT, Injectable, inject } from '@angular/core';

import { DeviceAgent } from './device-agent';
import { DeviceAgentService } from './device-agent.service';
import { DEVICE_MATCHERS } from './device-matchers';

/**
 * Adds body classes for detected device, orientation, and touch
 * characteristics, omitting classes for nonmatching characteristics.
 * Requirement: OMCT-C15-L2-05.01.
 */
@Injectable({ providedIn: 'root' })
export class DeviceClassifierService {
  private readonly document = inject(DOCUMENT);
  private readonly agentService = inject(DeviceAgentService);

  /** Applies the matching device classes to the body element. */
  classify(agent: DeviceAgent = this.agentService, body: HTMLElement = this.document.body): void {
    for (const [className, matches] of DEVICE_MATCHERS) {
      body.classList.toggle(className, matches(agent));
    }
  }

  /** Runs classification now and re-runs it on resize and orientation change. */
  start(): void {
    this.classify();
    const reclassify = () => this.classify();
    window.addEventListener('resize', reclassify);
    window.addEventListener('orientationchange', reclassify);
  }
}
