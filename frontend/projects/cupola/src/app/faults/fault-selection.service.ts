import { Injectable, signal } from '@angular/core';
import { Fault } from '@cupola/core';

/**
 * Carries the fault selected in the fault list to the fault inspector, since
 * `SelectionContext.object` is typed for domain objects only.
 * Requirement: OMCT-C14-L2-03.02.
 */
@Injectable({ providedIn: 'root' })
export class FaultSelectionService {
  private readonly selected = signal<Fault | null>(null);

  readonly selectedFault = this.selected.asReadonly();

  select(fault: Fault | null): void {
    this.selected.set(fault);
  }
}
