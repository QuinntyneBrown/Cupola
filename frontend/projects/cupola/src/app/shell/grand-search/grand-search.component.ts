import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { Annotation, DomainObject, SearchGateway, SearchResults } from '@cupola/core';

import { AnnotationSearchResultComponent } from './annotation-search-result.component';
import { ObjectSearchResultComponent } from './object-search-result.component';

interface FlatResult {
  kind: 'object' | 'annotation';
  object?: DomainObject;
  annotation?: Annotation;
}

@Component({
  selector: 'cp-grand-search',
  templateUrl: './grand-search.component.html',
  styleUrl: './grand-search.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ObjectSearchResultComponent, AnnotationSearchResultComponent],
})
export class GrandSearchComponent {
  private readonly search = inject(SearchGateway);
  private readonly router = inject(Router);
  private readonly queries$ = new Subject<string>();

  protected readonly term = signal('');
  protected readonly focused = signal(false);
  protected readonly results = signal<SearchResults>({ objects: [], annotations: [] });
  protected readonly activeIndex = signal(0);

  protected readonly flat = computed<FlatResult[]>(() => [
    ...this.results().objects.map((object) => ({ kind: 'object' as const, object })),
    ...this.results().annotations.map((annotation) => ({ kind: 'annotation' as const, annotation })),
  ]);
  protected readonly open = computed(
    () => this.focused() && this.term().trim().length > 0 && this.flat().length > 0,
  );

  constructor() {
    const subscription = this.queries$
      .pipe(
        debounceTime(250),
        switchMap((query) => this.search.search(query)),
      )
      .subscribe((results) => {
        this.results.set(results);
        this.activeIndex.set(0);
      });
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.focused.set(true);
    this.term.set(value);
    if (value.trim()) {
      this.queries$.next(value.trim());
    } else {
      this.results.set({ objects: [], annotations: [] });
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    const results = this.flat();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.update((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.update((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      const result = results[this.activeIndex()];
      if (result) {
        this.activate(result);
      }
    } else if (event.key === 'Escape') {
      this.focused.set(false);
    }
  }

  protected activateAt(index: number): void {
    const result = this.flat()[index];
    if (result) {
      this.activate(result);
    }
  }

  protected onBlur(): void {
    // Delay so a result click registers before the panel closes.
    setTimeout(() => this.focused.set(false), 150);
  }

  private activate(result: FlatResult): void {
    if (result.kind === 'object' && result.object) {
      void this.router.navigate(['/browse', result.object.keyString]);
    } else if (result.annotation) {
      const target = result.annotation.targets[0];
      if (target) {
        void this.router.navigate(['/browse', target], {
          queryParams: { annotation: result.annotation.keyString },
        });
      }
    }
    this.focused.set(false);
    this.term.set('');
    this.results.set({ objects: [], annotations: [] });
  }
}
