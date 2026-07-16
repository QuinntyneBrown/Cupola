import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Fault, FaultManagementService } from '@cupola/core';
import { FakeFaultProvider } from '@cupola/api';

import { FaultListComponent } from './fault-list.component';

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

async function settle(fixture: ComponentFixture<FaultListComponent>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

function setup(faults: Fault[]) {
  TestBed.configureTestingModule({});
  const provider = new FakeFaultProvider(faults);
  TestBed.inject(FaultManagementService).setProvider(provider);
  const fixture = TestBed.createComponent(FaultListComponent);
  fixture.detectChanges();
  return { fixture, provider };
}

describe('OMCT-C14-L2-03.01 Fault request and subscription', () => {
  it('loads current faults from the provider on initialization', async () => {
    const { fixture } = setup([fault(), fault({ id: 'f-2', name: 'Battery temperature' })]);
    await settle(fixture);

    const rows = fixture.nativeElement.querySelectorAll('[data-testid="fault-row"]');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('Fuel pressure above limit');
    expect(rows[1].textContent).toContain('Battery temperature');
  });

  it('relays subsequent provider updates into the list', async () => {
    const { fixture, provider } = setup([fault()]);
    await settle(fixture);

    provider.emit(fault({ acknowledged: true }));
    await settle(fixture);

    const state = fixture.nativeElement.querySelector('[data-testid="fault-state"]');
    expect(state.textContent).toContain('Acknowledged');
  });
});

describe('FaultListComponent actions', () => {
  it('submits acknowledgement for the fault behind the acknowledge button', async () => {
    const { fixture, provider } = setup([fault()]);
    await settle(fixture);

    fixture.nativeElement.querySelector('[data-testid="fault-acknowledge"]').click();
    await settle(fixture);

    expect(provider.acknowledgeCalls).toHaveLength(1);
    expect(provider.acknowledgeCalls[0].fault.id).toBe('f-1');
  });

  it('submits shelving with the toggled shelved state', async () => {
    const { fixture, provider } = setup([fault()]);
    await settle(fixture);

    fixture.nativeElement.querySelector('[data-testid="fault-shelve"]').click();
    await settle(fixture);

    expect(provider.shelveCalls).toEqual([
      expect.objectContaining({ options: { shelved: true } }),
    ]);
    const state = fixture.nativeElement.querySelector('[data-testid="fault-state"]');
    expect(state.textContent).toContain('Shelved');
  });
});
