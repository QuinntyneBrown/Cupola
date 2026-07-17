import { Injectable, inject } from '@angular/core';

import { Annotation, AnnotationTarget } from '../models/annotation';
import { DomainObject } from '../models/domain-object';
import { makeKeyString } from '../models/key-string';
import { ObjectApi } from '../objects/object-api.service';
import { TagRegistry } from './tag-registry';
import { TargetComparator, TargetComparatorRegistry } from './target-comparators';

/** Whether an annotation persistence namespace accepts writes. */
export interface AnnotationNamespaceOptions {
  writable: boolean;
}

/** Options for creating an annotation. */
export interface CreateAnnotationOptions {
  /** Namespace the annotation object is stored in (default: the writable root). */
  namespace?: string;
}

/**
 * Creates, validates, and categorizes annotations. Annotations are persisted as
 * standalone `annotation`-typed domain objects (keys `ann.<uuid>`, payload under
 * `configuration.annotation`) through the shared object store, so an immutable
 * target is annotated without ever mutating it (OMCT-C13-L2-04.01–04.03). Tag
 * and target-comparison support is delegated to the tag and comparator
 * registries (OMCT-C13-L2-04.04–04.06).
 */
@Injectable({ providedIn: 'root' })
export class AnnotationService {
  private readonly objects = inject(ObjectApi);
  private readonly tags = inject(TagRegistry);
  private readonly comparators = inject(TargetComparatorRegistry);

  private readonly knownTypes = new Set<string>();
  private readonly namespaces = new Map<string, AnnotationNamespaceOptions>([
    ['', { writable: true }],
  ]);

  /** Registers a known annotation type (OMCT-C13-L2-04.01). */
  registerType(annotationType: string): void {
    this.knownTypes.add(annotationType);
  }

  /** Whether an annotation type has been registered. */
  isKnownType(annotationType: string | undefined): boolean {
    return annotationType !== undefined && this.knownTypes.has(annotationType);
  }

  /** Registers an annotation persistence namespace and its writability. */
  registerNamespace(namespace: string, options: AnnotationNamespaceOptions): void {
    this.namespaces.set(namespace, options);
  }

  /**
   * Validates the annotation type and target namespace, then persists the
   * annotation and returns it. Rejects an unknown type or an unavailable or
   * immutable namespace without creating anything (OMCT-C13-L2-04.03).
   */
  async create(annotation: Annotation, options: CreateAnnotationOptions = {}): Promise<Annotation> {
    if (!this.isKnownType(annotation.annotationType)) {
      throw new Error(`Unknown annotation type: ${annotation.annotationType ?? '(none)'}`);
    }
    const namespace = options.namespace ?? '';
    const target = this.namespaces.get(namespace);
    if (!target) {
      throw new Error(`Annotation namespace “${namespace}” is not available.`);
    }
    if (!target.writable) {
      throw new Error(`Annotation namespace “${namespace}” is immutable.`);
    }

    const identifier = { namespace, key: `ann.${uniqueId()}` };
    const keyString = makeKeyString(identifier);
    const object: DomainObject = {
      identifier,
      keyString,
      name: annotation.text || 'Annotation',
      type: 'annotation',
      location: null,
      composition: [],
      configuration: {
        annotation: {
          text: annotation.text,
          targets: annotation.targets,
          tags: annotation.tags,
        },
        annotationType: annotation.annotationType,
        ...(annotation.targetDetails ? { targetDetails: annotation.targetDetails } : {}),
      },
    };
    await this.objects.save(object);
    return { ...annotation, keyString };
  }

  // --- Tag support (delegated to TagRegistry) ------------------------------

  addTag(tag: string): string[] {
    return this.tags.addTag(tag);
  }

  deleteTag(tag: string): string[] {
    return this.tags.deleteTag(tag);
  }

  clearTags(): string[] {
    return this.tags.clearTags();
  }

  listTags(): string[] {
    return this.tags.listTags();
  }

  searchByTag(term: string): string[] {
    return this.tags.searchByTag(term);
  }

  // --- Target comparison (delegated to TargetComparatorRegistry) -----------

  registerComparator(annotationType: string, comparator: TargetComparator): void {
    this.comparators.registerComparator(annotationType, comparator);
  }

  targetsMatch(annotationType: string, a: AnnotationTarget, b: AnnotationTarget): boolean {
    return this.comparators.targetsMatch(annotationType, a, b);
  }
}

/** A UUID when the platform offers one, else a timestamped random fallback. */
function uniqueId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}
