import { Signal, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { DomainObject, ObjectApi, ObjectUpdatesService } from '@cupola/core';

/**
 * Resolves the members a chart renders — the composed children, or the object
 * itself when it carries telemetry and has no composition — and stays live as
 * members are added to or removed from composition (OMCT-C07-L2-03.02).
 *
 * A per-resolution token discards stale async results so rapid composition
 * changes settle on the latest membership.
 */
export class CompositionMembers {
  private readonly _members = signal<DomainObject[]>([]);
  private readonly _loading = signal(false);
  readonly members: Signal<DomainObject[]> = this._members.asReadonly();
  readonly loading: Signal<boolean> = this._loading.asReadonly();

  private object: DomainObject;
  private updates?: Subscription;
  private destroyed = false;
  private token = 0;

  constructor(
    object: DomainObject,
    private readonly objects: ObjectApi,
    private readonly objectUpdates: ObjectUpdatesService,
  ) {
    this.object = object;
  }

  start(): void {
    void this.resolve(this.object);
    this.updates = this.objectUpdates.forKeyString(this.object.keyString).subscribe((updated) => {
      this.object = updated;
      void this.resolve(updated);
    });
  }

  private async resolve(object: DomainObject): Promise<void> {
    const current = ++this.token;
    const keys = object.composition ?? [];
    if (keys.length === 0) {
      this._members.set(object.telemetry ? [object] : []);
      return;
    }
    this._loading.set(true);
    const resolved = await Promise.all(keys.map((key) => this.objects.get(key).catch(() => null)));
    if (this.destroyed || current !== this.token) {
      return;
    }
    this._members.set(resolved.filter((member): member is DomainObject => member !== null));
    this._loading.set(false);
  }

  destroy(): void {
    this.destroyed = true;
    this.updates?.unsubscribe();
  }
}
