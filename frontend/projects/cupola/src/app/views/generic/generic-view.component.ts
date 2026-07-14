import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DomainObject } from '@cupola/core';

@Component({
  selector: 'cp-generic-view',
  templateUrl: './generic-view.component.html',
  styleUrl: './generic-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericViewComponent {
  readonly object = input.required<DomainObject>();
}
