import { AcknowledgeOptions, Fault, ShelveOptions } from './fault';
import { FaultManagementService } from './fault-management.service';
import { FaultProvider } from './fault-provider';

function fault(overrides: Partial<Fault> = {}): Fault {
  return {
    id: 'f-1',
    name: 'Fuel pressure above limit',
    namespace: 'propulsion',
    triggerTime: '2026-07-15T11:42:00.000Z',
    severity: 'CRITICAL',
    acknowledged: false,
    shelved: false,
    ...overrides,
  };
}

class RecordingProvider implements FaultProvider {
  readonly acknowledgeCalls: Array<{ fault: Fault; options?: AcknowledgeOptions }> = [];
  readonly shelveCalls: Array<{ fault: Fault; options: ShelveOptions }> = [];
  private listener: ((fault: Fault) => void) | null = null;
  unsubscribed = false;

  supportsRequest(): boolean {
    return true;
  }
  supportsSubscribe(): boolean {
    return true;
  }
  request(): Promise<Fault[]> {
    return Promise.resolve([fault()]);
  }
  subscribe(onChange: (fault: Fault) => void): () => void {
    this.listener = onChange;
    return () => {
      this.unsubscribed = true;
    };
  }
  emit(change: Fault): void {
    this.listener?.(change);
  }
  acknowledgeFault(target: Fault, options?: AcknowledgeOptions): Promise<void> {
    this.acknowledgeCalls.push({ fault: target, options });
    return Promise.resolve();
  }
  shelveFault(target: Fault, options: ShelveOptions): Promise<void> {
    this.shelveCalls.push({ fault: target, options });
    return Promise.resolve();
  }
}

function setup() {
  const service = new FaultManagementService();
  const provider = new RecordingProvider();
  service.setProvider(provider);
  return { service, provider };
}

describe('OMCT-C14-L2-03.03 Fault acknowledge', () => {
  it('submits acknowledgement for the fault to the provider', async () => {
    const { service, provider } = setup();
    const target = fault();

    await service.acknowledge(target, { comment: 'seen' });

    expect(provider.acknowledgeCalls).toEqual([{ fault: target, options: { comment: 'seen' } }]);
  });
});

describe('OMCT-C14-L2-03.04 Fault shelving', () => {
  it('submits shelving for the fault to the provider', async () => {
    const { service, provider } = setup();
    const target = fault();

    await service.shelve(target, { shelved: true, shelveDuration: 60_000 });

    expect(provider.shelveCalls).toEqual([
      { fault: target, options: { shelved: true, shelveDuration: 60_000 } },
    ]);
  });
});

describe('FaultManagementService provider guards', () => {
  it('rejects a second provider', () => {
    const { service, provider } = setup();

    expect(() => service.setProvider(provider)).toThrow(/already configured/);
  });

  it('resolves empty and no-ops without a provider', async () => {
    const service = new FaultManagementService();

    await expect(service.requestFaults()).resolves.toEqual([]);
    expect(service.subscribe(() => {})).toEqual(expect.any(Function));
  });

  it('relays provider changes and releases the subscription', async () => {
    const { service, provider } = setup();
    const received: Fault[] = [];

    const unsubscribe = service.subscribe((change) => received.push(change));
    provider.emit(fault({ acknowledged: true }));
    unsubscribe();

    expect(received).toEqual([fault({ acknowledged: true })]);
    expect(provider.unsubscribed).toBe(true);
  });
});
