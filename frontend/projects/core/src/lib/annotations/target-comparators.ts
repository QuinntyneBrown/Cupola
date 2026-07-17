import { Injectable } from '@angular/core';

import { AnnotationTarget } from '../models/annotation';

/** Decides whether two annotation targets refer to the same thing. */
export type TargetComparator = (a: AnnotationTarget, b: AnnotationTarget) => boolean;

/**
 * Registry of per-annotation-type target comparators. When comparing two
 * targets, an applicable registered comparator is used; otherwise the targets
 * are compared by deep equality (OMCT-C13-L2-04.06).
 */
@Injectable({ providedIn: 'root' })
export class TargetComparatorRegistry {
  private readonly comparators = new Map<string, TargetComparator>();

  /** Registers the comparator used for a given annotation type. */
  registerComparator(annotationType: string, comparator: TargetComparator): void {
    this.comparators.set(annotationType, comparator);
  }

  /**
   * Compares two targets using the annotation type's registered comparator, or
   * deep equality when none is registered.
   */
  targetsMatch(annotationType: string, a: AnnotationTarget, b: AnnotationTarget): boolean {
    const comparator = this.comparators.get(annotationType);
    return comparator ? comparator(a, b) : deepEqual(a, b);
  }
}

/** Structural deep equality over plain JSON-compatible values. */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') {
    return false;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    return a.every((value, index) => deepEqual(value, b[index]));
  }
  const aRecord = a as Record<string, unknown>;
  const bRecord = b as Record<string, unknown>;
  const aKeys = Object.keys(aRecord);
  const bKeys = Object.keys(bRecord);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  return aKeys.every((key) => deepEqual(aRecord[key], bRecord[key]));
}
