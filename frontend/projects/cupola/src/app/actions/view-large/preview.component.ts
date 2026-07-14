import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DomainObject, objectGlyph } from '@cupola/core';

import { ViewHostComponent } from '../../browse/view-host.component';

@Component({
  selector: 'cp-preview',
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ViewHostComponent],
})
export class PreviewComponent {
  readonly objectPath = input.required<DomainObject[]>();

  protected readonly object = computed(() => this.objectPath().at(-1) ?? null);
  protected readonly glyph = computed(() => {
    const object = this.object();
    return object ? objectGlyph(object) : 'i-folder';
  });
}
