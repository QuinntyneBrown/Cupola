import { Injectable, inject, signal } from '@angular/core';

import { BrandingGateway } from '../gateways/branding-gateway';
import { BrandingInfo } from '../models/branding-info';
import { BuildInfo } from '../models/build-info';

/**
 * Exposes configured branding options and build information to shell
 * components. Requirement: OMCT-C15-L2-05.03.
 */
@Injectable({ providedIn: 'root' })
export class BrandingService {
  private readonly gateway = inject(BrandingGateway);
  private readonly brandingState = signal<BrandingInfo | null>(null);
  private readonly buildInfoState = signal<BuildInfo | null>(null);

  readonly branding = this.brandingState.asReadonly();
  readonly buildInfo = this.buildInfoState.asReadonly();

  load(): void {
    this.gateway.getBranding().subscribe((branding) => this.brandingState.set(branding));
    this.gateway.getBuildInfo().subscribe((buildInfo) => this.buildInfoState.set(buildInfo));
  }
}
