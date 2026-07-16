import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IndicatorService } from '@cupola/core';

/**
 * Status bar rendering registered indicators in priority order.
 * Requirement: OMCT-C14-L2-05.01.
 */
@Component({
  selector: 'cp-status-bar',
  templateUrl: './status-bar.component.html',
  styleUrl: './status-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet],
})
export class StatusBarComponent {
  protected readonly indicators = inject(IndicatorService).indicators;
}
