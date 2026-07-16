import {
  AcknowledgeOptions,
  Fault,
  FaultProvider,
  ShelveOptions,
} from '@cupola/core';

/**
 * Fake fault provider standing behind the B13 fault contract: seeded faults,
 * an `emit` hook for tests, and recorded acknowledge/shelve calls.
 * See docs/capability-contracts/cross-capability-contracts.md.
 */
export class FakeFaultProvider implements FaultProvider {
  private readonly listeners = new Set<(fault: Fault) => void>();
  readonly acknowledgeCalls: Array<{ fault: Fault; options?: AcknowledgeOptions }> = [];
  readonly shelveCalls: Array<{ fault: Fault; options: ShelveOptions }> = [];

  constructor(private readonly faults: Fault[] = seedFaults()) {}

  supportsRequest(): boolean {
    return true;
  }

  supportsSubscribe(): boolean {
    return true;
  }

  request(): Promise<Fault[]> {
    return Promise.resolve([...this.faults]);
  }

  subscribe(onChange: (fault: Fault) => void): () => void {
    this.listeners.add(onChange);
    return () => this.listeners.delete(onChange);
  }

  /** Applies a fault change and notifies subscribers, as a live provider would. */
  emit(fault: Fault): void {
    const index = this.faults.findIndex(
      (existing) => existing.namespace === fault.namespace && existing.id === fault.id,
    );
    if (index >= 0) {
      this.faults[index] = fault;
    } else {
      this.faults.push(fault);
    }
    this.listeners.forEach((listener) => listener(fault));
  }

  acknowledgeFault(fault: Fault, options?: AcknowledgeOptions): Promise<void> {
    this.acknowledgeCalls.push({ fault, options });
    this.emit({ ...(this.find(fault) ?? fault), acknowledged: true });
    return Promise.resolve();
  }

  shelveFault(fault: Fault, options: ShelveOptions): Promise<void> {
    this.shelveCalls.push({ fault, options });
    this.emit({ ...(this.find(fault) ?? fault), shelved: options.shelved });
    return Promise.resolve();
  }

  private find(fault: Fault): Fault | undefined {
    return this.faults.find(
      (existing) => existing.namespace === fault.namespace && existing.id === fault.id,
    );
  }
}

function seedFaults(): Fault[] {
  return [
    {
      id: 'fuel-pressure-high',
      name: 'Fuel pressure above limit',
      namespace: 'propulsion',
      triggerTime: '2026-07-15T11:42:00.000Z',
      severity: 'CRITICAL',
      acknowledged: false,
      shelved: false,
      shortDescription: 'Tank 2 pressure exceeded the red-high limit.',
      seqNum: 1,
      currentValueInfo: { value: 412.6, rangeCondition: 'HIGH', monitoringResult: 'RED_HIGH' },
      triggerValueInfo: { value: 408.1, rangeCondition: 'HIGH', monitoringResult: 'RED_HIGH' },
    },
    {
      id: 'battery-temp-warm',
      name: 'Battery temperature elevated',
      namespace: 'power',
      triggerTime: '2026-07-15T11:47:30.000Z',
      severity: 'WARNING',
      acknowledged: false,
      shelved: false,
      shortDescription: 'Bus B battery above the yellow-high limit.',
      seqNum: 2,
      currentValueInfo: { value: 41.3, rangeCondition: 'HIGH', monitoringResult: 'YELLOW_HIGH' },
      triggerValueInfo: { value: 40.2, rangeCondition: 'HIGH', monitoringResult: 'YELLOW_HIGH' },
    },
    {
      id: 'comm-signal-drift',
      name: 'Downlink signal drift',
      namespace: 'comms',
      triggerTime: '2026-07-15T11:51:12.000Z',
      severity: 'WATCH',
      acknowledged: false,
      shelved: false,
      shortDescription: 'Signal-to-noise trending down over the last three passes.',
      seqNum: 3,
    },
  ];
}
