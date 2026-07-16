import { Injectable } from '@angular/core';

import { AcknowledgeOptions, Fault, ShelveOptions } from './fault';
import { FaultProvider } from './fault-provider';

/**
 * Retrieves, observes, acknowledges, and shelves faults through the configured
 * fault provider.
 * Requirements: OMCT-C14-L2-03.01, OMCT-C14-L2-03.03, OMCT-C14-L2-03.04.
 */
@Injectable({ providedIn: 'root' })
export class FaultManagementService {
  private provider: FaultProvider | null = null;

  setProvider(provider: FaultProvider): void {
    if (this.provider) {
      throw new Error('A fault provider is already configured; only one is allowed.');
    }
    this.provider = provider;
  }

  hasProvider(): boolean {
    return this.provider !== null;
  }

  async requestFaults(): Promise<Fault[]> {
    if (!this.provider?.supportsRequest()) {
      return [];
    }
    return this.provider.request();
  }

  subscribe(onChange: (fault: Fault) => void): () => void {
    if (!this.provider?.supportsSubscribe()) {
      return () => {};
    }
    return this.provider.subscribe(onChange);
  }

  async acknowledge(fault: Fault, options?: AcknowledgeOptions): Promise<void> {
    await this.provider?.acknowledgeFault(fault, options);
  }

  async shelve(fault: Fault, options: ShelveOptions): Promise<void> {
    await this.provider?.shelveFault(fault, options);
  }
}
