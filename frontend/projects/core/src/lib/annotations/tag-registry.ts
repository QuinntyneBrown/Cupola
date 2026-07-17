import { Injectable } from '@angular/core';

/**
 * The available annotation-tag vocabulary. Tag lifecycle operations return the
 * updated available-tag set (OMCT-C13-L2-04.04); tag search returns the tags
 * matching a nonempty term and nothing for an empty term (OMCT-C13-L2-04.05).
 */
@Injectable({ providedIn: 'root' })
export class TagRegistry {
  private readonly available = new Set<string>();

  /** Adds a tag to the available vocabulary and returns the updated set. */
  addTag(tag: string): string[] {
    this.available.add(tag);
    return this.listTags();
  }

  /** Removes a tag from the available vocabulary and returns the updated set. */
  deleteTag(tag: string): string[] {
    this.available.delete(tag);
    return this.listTags();
  }

  /** Clears every available tag and returns the (now empty) set. */
  clearTags(): string[] {
    this.available.clear();
    return this.listTags();
  }

  /** The available tags in insertion order. */
  listTags(): string[] {
    return [...this.available];
  }

  /**
   * Returns the available tags containing the term (case-insensitive); an empty
   * or whitespace-only term matches nothing.
   */
  searchByTag(term: string): string[] {
    const needle = term.trim().toLowerCase();
    if (needle.length === 0) {
      return [];
    }
    return this.listTags().filter((tag) => tag.toLowerCase().includes(needle));
  }
}
