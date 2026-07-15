import { Observable, Subject } from 'rxjs';

import { DomainObject } from '../models/domain-object';
import { CompositionProvider } from './composition-provider';

type ChildResolver = (keyString: string) => Promise<DomainObject>;

/**
 * The composition of a single object: its loaded children plus membership and
 * ordering operations, backed by a {@link CompositionProvider}.
 *
 * Requirements: OMCT-C02-L2-03.02 (model-backed load/add/remove/reorder),
 * 03.03 (relaying provider membership changes).
 */
export class CompositionCollection {
  private readonly changes$ = new Subject<DomainObject[]>();
  readonly changes: Observable<DomainObject[]> = this.changes$.asObservable();
  private stopObserving?: () => void;

  constructor(
    readonly domainObject: DomainObject,
    private readonly provider: CompositionProvider,
    private readonly resolveChild: ChildResolver,
  ) {}

  /** Loads the children and begins relaying provider membership changes. */
  async load(): Promise<DomainObject[]> {
    const children = await this.resolveAll(await this.provider.load(this.domainObject));
    this.stopObserving?.();
    this.stopObserving = this.provider.observe?.(this.domainObject, (childKeyStrings) => {
      void this.resolveAll(childKeyStrings).then((resolved) => this.changes$.next(resolved));
    });
    return children;
  }

  add(child: DomainObject): Promise<void> {
    return this.provider.add?.(this.domainObject, child.keyString) ?? Promise.resolve();
  }

  remove(child: DomainObject): Promise<void> {
    return this.provider.remove?.(this.domainObject, child.keyString) ?? Promise.resolve();
  }

  reorder(oldIndex: number, newIndex: number): Promise<void> {
    return this.provider.reorder?.(this.domainObject, oldIndex, newIndex) ?? Promise.resolve();
  }

  destroy(): void {
    this.stopObserving?.();
    this.changes$.complete();
  }

  private resolveAll(childKeyStrings: string[]): Promise<DomainObject[]> {
    return Promise.all(childKeyStrings.map((keyString) => this.resolveChild(keyString)));
  }
}
