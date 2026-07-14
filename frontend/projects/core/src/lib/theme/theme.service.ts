import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

import { ThemeKey } from './theme-key';

/**
 * Installs one active theme stylesheet in the document head.
 * Requirement: OMCT-C15-L2-05.02.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly activeTheme = signal<ThemeKey | null>(null);

  readonly theme = this.activeTheme.asReadonly();

  installTheme(key: ThemeKey): void {
    const head = this.document.head;
    head.querySelectorAll('link[data-cp-theme]').forEach((link) => link.remove());

    const link = this.document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `themes/theme-${key}.css`;
    link.setAttribute('data-cp-theme', key);
    head.appendChild(link);

    this.activeTheme.set(key);
  }
}
