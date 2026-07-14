import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Annotation } from '@cupola/core';

import { highlightSegments } from './highlight';

@Component({
  selector: 'cp-annotation-search-result',
  templateUrl: './annotation-search-result.component.html',
  styleUrl: './annotation-search-result.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnotationSearchResultComponent {
  readonly annotation = input.required<Annotation>();
  readonly term = input<string>('');
  readonly active = input<boolean>(false);

  protected readonly segments = computed(() =>
    highlightSegments(this.annotation().text, this.term()),
  );
}
