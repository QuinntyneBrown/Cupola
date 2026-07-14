import { Injectable } from '@angular/core';

import { SelectedItem } from '../selection/selected-item';
import { ToolbarControl } from './toolbar-control';
import { ToolbarProvider } from './toolbar-provider';

/**
 * Aggregates toolbar controls from providers that apply to the current
 * selection. Requirement: OMCT-C15-L2-03.05.
 */
@Injectable({ providedIn: 'root' })
export class ToolbarRegistry {
  private readonly providers: ToolbarProvider[] = [];

  register(provider: ToolbarProvider): void {
    this.providers.push(provider);
  }

  getStructure(selection: SelectedItem[]): ToolbarControl[] {
    return this.providers
      .filter((provider) => provider.forSelection(selection))
      .flatMap((provider) => provider.toolbar(selection));
  }
}
