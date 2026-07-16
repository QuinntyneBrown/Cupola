import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Fault, FaultManagementService, SelectionService } from '@cupola/core';

import { FaultSelectionService } from '../fault-selection.service';

/**
 * Fault list view: loads current faults, relays provider updates, and offers
 * acknowledge/shelve per fault.
 * Requirements: OMCT-C14-L2-03.01, OMCT-C14-L2-03.02, OMCT-C14-L2-03.03,
 * OMCT-C14-L2-03.04.
 */
@Component({
  selector: 'cp-fault-list',
  templateUrl: './fault-list.component.html',
  styleUrl: './fault-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaultListComponent {
  private readonly faultManagement = inject(FaultManagementService);
  private readonly selection = inject(SelectionService);
  private readonly faultSelection = inject(FaultSelectionService);

  protected readonly faults = signal<Fault[]>([]);
  protected readonly rows = computed(() =>
    this.faults().map((fault) => ({
      fault,
      key: `${fault.namespace}:${fault.id}`,
      severityClass: `severity-${fault.severity.toLowerCase()}`,
      state: fault.shelved ? 'Shelved' : fault.acknowledged ? 'Acknowledged' : 'Unacknowledged',
      shelveLabel: fault.shelved ? 'Unshelve' : 'Shelve',
    })),
  );

  constructor() {
    void this.faultManagement.requestFaults().then((faults) => this.faults.set(faults));
    const unsubscribe = this.faultManagement.subscribe((fault) => this.merge(fault));
    inject(DestroyRef).onDestroy(unsubscribe);
  }

  protected selectFault(fault: Fault, event: Event): void {
    this.faultSelection.select(fault);
    this.selection.select({
      element: event.currentTarget as HTMLElement,
      context: { key: `${fault.namespace}:${fault.id}`, label: fault.name, type: 'fault' },
    });
  }

  protected acknowledge(fault: Fault, event: Event): void {
    event.stopPropagation();
    void this.faultManagement.acknowledge(fault);
  }

  protected shelve(fault: Fault, event: Event): void {
    event.stopPropagation();
    void this.faultManagement.shelve(fault, { shelved: !fault.shelved });
  }

  private merge(fault: Fault): void {
    this.faults.update((list) => {
      const index = list.findIndex(
        (existing) => existing.namespace === fault.namespace && existing.id === fault.id,
      );
      return index >= 0 ? list.map((existing, i) => (i === index ? fault : existing)) : [...list, fault];
    });
  }
}
