import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { FaultSelectionService } from '../fault-selection.service';

/**
 * Read-only fault detail shown in the inspector for a selected fault.
 * Requirement: OMCT-C14-L2-03.02.
 */
@Component({
  selector: 'cp-fault-inspector',
  templateUrl: './fault-inspector.component.html',
  styleUrl: './fault-inspector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaultInspectorComponent {
  private readonly faultSelection = inject(FaultSelectionService);

  protected readonly fault = this.faultSelection.selectedFault;
  protected readonly state = computed(() => {
    const fault = this.fault();
    if (!fault) {
      return '';
    }
    return fault.shelved ? 'Shelved' : fault.acknowledged ? 'Acknowledged' : 'Unacknowledged';
  });
}
