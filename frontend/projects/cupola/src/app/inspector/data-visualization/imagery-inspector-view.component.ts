import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DomainObject } from '@cupola/core';

@Component({
  selector: 'cp-imagery-inspector-view',
  templateUrl: './imagery-inspector-view.component.html',
  styleUrl: './imagery-inspector-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageryInspectorViewComponent {
  readonly object = input.required<DomainObject>();
}
