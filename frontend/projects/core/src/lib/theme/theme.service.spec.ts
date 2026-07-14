import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

describe('OMCT-C15-L2-05.02 ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    service = TestBed.inject(ThemeService);
    document.head.querySelectorAll('link[data-cp-theme]').forEach((link) => link.remove());
  });

  function themeLinks(): HTMLLinkElement[] {
    return Array.from(document.head.querySelectorAll('link[data-cp-theme]'));
  }

  it('appends the selected theme stylesheet to the document head', () => {
    service.installTheme('darkmatter');

    const links = themeLinks();
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('themes/theme-darkmatter.css');
    expect(service.theme()).toBe('darkmatter');
  });

  it('removes an existing theme link before appending the new one', () => {
    service.installTheme('darkmatter');
    service.installTheme('snow');

    const links = themeLinks();
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('themes/theme-snow.css');
  });
});
