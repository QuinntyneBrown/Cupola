import { Injectable } from '@angular/core';

import { Action, ActionContext } from './action';
import { ActionCollection } from './action-collection';

/**
 * Registers actions and returns the applicable actions for an object path
 * and optional view. Requirement: OMCT-C15-L2-03.01.
 */
@Injectable({ providedIn: 'root' })
export class ActionRegistry {
  private readonly actions = new Map<string, Action>();

  register(action: Action): void {
    this.actions.set(action.key, action);
  }

  getAction(key: string): Action | undefined {
    return this.actions.get(key);
  }

  getActionCollection(context: ActionContext): ActionCollection {
    const applicable = [...this.actions.values()]
      .filter((action) => !action.appliesTo || action.appliesTo(context))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    return new ActionCollection(applicable);
  }
}
