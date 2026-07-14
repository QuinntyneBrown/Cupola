import { Injectable } from '@angular/core';

import { SelectedItem } from '../selection/selected-item';
import { InspectorViewProvider } from './inspector-view-provider';

/**
 * Registry of inspector-view providers.
 * Requirement: OMCT-C15-L2-02.03 — applicable inspector views in
 * descending priority order with key, name, and glyph metadata.
 */
@Injectable({ providedIn: 'root' })
export class InspectorViewRegistry {
  private readonly providers = new Map<string, InspectorViewProvider>();

  register(provider: InspectorViewProvider): void {
    this.providers.set(provider.key, provider);
  }

  getByProviderKey(key: string): InspectorViewProvider | undefined {
    return this.providers.get(key);
  }

  applicableViews(selection: SelectedItem[]): InspectorViewProvider[] {
    return [...this.providers.values()]
      .filter((provider) => provider.canView(selection))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }
}
