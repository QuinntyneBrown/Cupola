import { Injectable } from '@angular/core';

interface RootEntry {
  keyString: string;
  priority: number;
}

/**
 * Registry of root object key strings exposed in descending priority order.
 * Requirement: OMCT-C02-L2-03.05.
 */
@Injectable({ providedIn: 'root' })
export class RootRegistry {
  private readonly roots: RootEntry[] = [];

  addRoot(keyString: string, priority = 0): void {
    this.roots.push({ keyString, priority });
  }

  /** Root key strings ordered by descending priority. */
  getRoots(): string[] {
    return [...this.roots].sort((a, b) => b.priority - a.priority).map((entry) => entry.keyString);
  }
}
