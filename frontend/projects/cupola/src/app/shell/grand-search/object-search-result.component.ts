import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DomainObject, objectGlyph } from '@cupola/core';

import { highlightSegments } from './highlight';

@Component({
  selector: 'cp-object-search-result',
  templateUrl: './object-search-result.component.html',
  styleUrl: './object-search-result.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ObjectSearchResultComponent {
  readonly object = input.required<DomainObject>();
  readonly term = input<string>('');
  readonly active = input<boolean>(false);

  protected readonly glyph = computed(() => objectGlyph(this.object()));
  protected readonly segments = computed(() => highlightSegments(this.object().name, this.term()));
}
