import { DomainObject, TelemetryValue } from '@cupola/core';

import { FakeRealtimeGateway } from './fake-realtime-gateway';

describe('FakeRealtimeGateway (supports OMCT-C15-L2-01.03, OMCT-C15-L2-02.05)', () => {
  let gateway: FakeRealtimeGateway;

  const object: DomainObject = {
    identifier: { namespace: '', key: 'mine' },
    keyString: 'mine',
    name: 'My Items',
    type: 'folder',
    location: 'ROOT',
    composition: [],
  };

  beforeEach(() => {
    gateway = new FakeRealtimeGateway();
  });

  it('publishes the window.__cupolaE2E hook', () => {
    expect(window.__cupolaE2E).toBeDefined();
  });

  it('routes pushed object updates to matching subscribers only', () => {
    const received: DomainObject[] = [];
    const other: DomainObject[] = [];
    gateway.objectUpdates('mine').subscribe((o) => received.push(o));
    gateway.objectUpdates('station').subscribe((o) => other.push(o));

    window.__cupolaE2E!.pushObjectUpdate({ ...object, name: 'Renamed' });

    expect(received).toHaveLength(1);
    expect(received[0].name).toBe('Renamed');
    expect(other).toHaveLength(0);
  });

  it('routes pushed telemetry to matching subscribers', () => {
    const received: TelemetryValue[] = [];
    gateway.telemetry('pwr.bus_v').subscribe((v) => received.push(v));

    window.__cupolaE2E!.pushTelemetry({
      keyString: 'pwr.bus_v',
      timestamp: '2026-07-13T00:00:00Z',
      value: 120.1,
    });

    expect(received).toEqual([
      { keyString: 'pwr.bus_v', timestamp: '2026-07-13T00:00:00Z', value: 120.1 },
    ]);
  });

  it('reflects pushed connection state in the signal', () => {
    window.__cupolaE2E!.setConnectionState('disconnected');
    expect(gateway.connectionState()).toBe('disconnected');
  });
});
