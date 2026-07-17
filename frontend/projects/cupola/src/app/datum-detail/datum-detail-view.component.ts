import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One formatted metadata field of a datum. */
export interface DatumField {
  name: string;
  value: string;
}

/**
 * Datum detail overlay body: lists every metadata field of a selected telemetry
 * datum with its formatted value (OMCT-C08-L2-04.04).
 */
@Component({
  selector: 'cp-datum-detail-view',
  standalone: true,
  templateUrl: './datum-detail-view.component.html',
  styleUrl: './datum-detail-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatumDetailViewComponent {
  readonly title = input('Datum');
  readonly fields = input<DatumField[]>([]);
}
