import { FakeFaultProvider } from './fake-fault-provider';

describe('FakeFaultProvider', () => {
  it('serves seeded faults and notifies subscribers of emitted changes', async () => {
    const provider = new FakeFaultProvider();
    const faults = await provider.request();
    expect(faults.length).toBeGreaterThan(0);

    const received: string[] = [];
    const unsubscribe = provider.subscribe((fault) => received.push(fault.id));
    provider.emit({ ...faults[0], acknowledged: true });
    unsubscribe();
    provider.emit({ ...faults[0], acknowledged: false });

    expect(received).toEqual([faults[0].id]);
  });

  it('records acknowledge and shelve calls and applies them to the fault', async () => {
    const provider = new FakeFaultProvider();
    const [fault] = await provider.request();

    await provider.acknowledgeFault(fault, { comment: 'roger' });
    await provider.shelveFault(fault, { shelved: true });

    expect(provider.acknowledgeCalls).toHaveLength(1);
    expect(provider.shelveCalls).toHaveLength(1);
    const refreshed = await provider.request();
    expect(refreshed[0]).toMatchObject({ acknowledged: true, shelved: true });
  });
});
