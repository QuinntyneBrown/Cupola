import { ActionContext, DomainObject } from '@cupola/core';

/** The selected (last) object in an action context path. */
export function selectedObject(context: ActionContext): DomainObject | undefined {
  return context.objectPath.at(-1);
}

/** The parent (second-to-last) object in an action context path, if any. */
export function parentObject(context: ActionContext): DomainObject | undefined {
  return context.objectPath.at(-2);
}

/** Whether an object's properties can be edited (persistable, not a missing placeholder). */
export function isEditable(object: DomainObject): boolean {
  return object.type !== 'unknown';
}

/**
 * Whether an object is a locked original that must not be removed directly
 * (top-level roots). Requirement: OMCT-C03-L2-02.06.
 */
export function isLocked(object: DomainObject): boolean {
  return object.location === 'ROOT' || object.location === null;
}
