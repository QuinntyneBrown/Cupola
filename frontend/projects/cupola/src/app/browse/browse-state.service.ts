import { Injectable, computed, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { DomainObject, ObjectUpdatesService } from '@cupola/core';

/**
 * Holds the resolved browse object path (the `router.path` equivalent),
 * keeps the document title in sync with the navigated object, and observes
 * object updates for the navigated path.
 * Requirement: OMCT-C15-L2-01.03.
 */
@Injectable({ providedIn: 'root' })
export class BrowseStateService {
  private readonly objectUpdates = inject(ObjectUpdatesService);
  private readonly title = inject(Title);
  private readonly pathState = signal<DomainObject[]>([]);
  private updates: Subscription | null = null;

  /** Objects along the navigated browse path, root-most first. */
  readonly path = this.pathState.asReadonly();
  /** The navigated (leaf) object. */
  readonly navigatedObject = computed(() => this.pathState().at(-1) ?? null);
  /** keyStrings along the navigated path. */
  readonly pathKeyStrings = computed(() => this.pathState().map((o) => o.keyString));

  setPath(path: DomainObject[]): void {
    this.pathState.set(path);
    this.updates?.unsubscribe();
    this.updates = null;

    const leaf = path.at(-1);
    if (!leaf) {
      return;
    }
    this.title.setTitle(leaf.name);
    this.updates = this.objectUpdates.forKeyString(leaf.keyString).subscribe((updated) => {
      this.pathState.update((current) =>
        current.map((object) => (object.keyString === updated.keyString ? updated : object)),
      );
      this.title.setTitle(updated.name);
    });
  }

  objectFor(keyString: string): DomainObject | undefined {
    return this.pathState().find((object) => object.keyString === keyString);
  }
}
