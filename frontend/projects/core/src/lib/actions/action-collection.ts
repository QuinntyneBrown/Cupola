import { Subject } from 'rxjs';

import { Action } from './action';

/**
 * A collection of applicable actions with per-action visibility and
 * enablement state. Requirement: OMCT-C15-L2-03.02.
 */
export class ActionCollection {
  private readonly hidden = new Set<string>();
  private readonly disabled = new Set<string>();
  private readonly changes$ = new Subject<void>();

  readonly changes = this.changes$.asObservable();

  constructor(private readonly actions: Action[]) {}

  getActions(): Action[] {
    return [...this.actions];
  }

  getVisibleActions(): Action[] {
    return this.actions.filter((action) => !this.hidden.has(action.key));
  }

  getStatusBarActions(): Action[] {
    return this.getVisibleActions().filter((action) => action.showInStatusBar);
  }

  isDisabled(key: string): boolean {
    return this.disabled.has(key);
  }

  hide(...keys: string[]): void {
    keys.forEach((key) => this.hidden.add(key));
    this.changes$.next();
  }

  show(...keys: string[]): void {
    keys.forEach((key) => this.hidden.delete(key));
    this.changes$.next();
  }

  disable(...keys: string[]): void {
    keys.forEach((key) => this.disabled.add(key));
    this.changes$.next();
  }

  enable(...keys: string[]): void {
    keys.forEach((key) => this.disabled.delete(key));
    this.changes$.next();
  }
}
