import { Injectable } from '@angular/core';

import { DomainObject } from '../models/domain-object';
import { CupolaView } from './cupola-view';
import { ViewProvider } from './view-provider';

/**
 * Registry of object-view providers.
 * Requirements: OMCT-C15-L2-02.01 (applicability in descending priority
 * order), OMCT-C15-L2-02.02 (view lifecycle wrapping).
 */
@Injectable({ providedIn: 'root' })
export class ViewRegistry {
  private readonly providers = new Map<string, ViewProvider>();

  register(provider: ViewProvider): void {
    this.providers.set(provider.key, provider);
  }

  getByProviderKey(key: string): ViewProvider | undefined {
    return this.providers.get(key);
  }

  /** Providers whose canView is true, ordered by descending priority. */
  applicableViews(object: DomainObject, objectPath: DomainObject[]): ViewProvider[] {
    return [...this.providers.values()]
      .filter((provider) => provider.canView(object, objectPath))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  /**
   * Creates and shows a view, exposing the provider key on the view and
   * recording the view parent element before the provider show
   * implementation runs.
   */
  showView(
    provider: ViewProvider,
    object: DomainObject,
    objectPath: DomainObject[],
    element: HTMLElement,
  ): CupolaView {
    const view = provider.view(object, objectPath);
    view.key = provider.key;
    view.parentElement = element;
    view.show(element);
    return view;
  }
}
