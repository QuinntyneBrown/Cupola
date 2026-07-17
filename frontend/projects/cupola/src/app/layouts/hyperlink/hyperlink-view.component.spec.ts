import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomainObject } from '@cupola/core';

import { HyperlinkConfiguration, HyperlinkViewComponent } from './hyperlink-view.component';

function hyperlink(config: HyperlinkConfiguration): DomainObject {
  return {
    identifier: { namespace: '', key: 'link.rules' },
    keyString: 'link.rules',
    name: 'Flight rules',
    type: 'hyperlink',
    location: null,
    composition: [],
    configuration: { hyperlink: config },
  };
}

function setup(config: HyperlinkConfiguration): ComponentFixture<HyperlinkViewComponent> {
  TestBed.configureTestingModule({});
  const fixture = TestBed.createComponent(HyperlinkViewComponent);
  fixture.componentRef.setInput('object', hyperlink(config));
  fixture.detectChanges();
  return fixture;
}

function anchor(fixture: ComponentFixture<HyperlinkViewComponent>): HTMLAnchorElement | null {
  return fixture.nativeElement.querySelector('[data-testid="hyperlink"]');
}

describe('OMCT-C09-L2-04.01 Hyperlink presentation', () => {
  it('renders the configured label as a text link', () => {
    const fixture = setup({ url: 'https://ops.example.gov/rules', displayFormat: 'link' });

    const element = anchor(fixture)!;
    expect(element.textContent).toContain('Flight rules');
    expect(element.classList).toContain('cp-link');
    expect(element.classList).not.toContain('cp-btn');
  });

  it('renders the button presentation with the external glyph for new-tab links', () => {
    const fixture = setup({
      url: 'https://ops.example.gov/console',
      displayFormat: 'button',
      target: 'new',
    });

    const element = anchor(fixture)!;
    expect(element.classList).toContain('cp-btn');
    expect(element.classList).toContain('cp-btn--outlined');
    expect(element.querySelector('use')?.getAttribute('href')).toBe('#i-external');
  });

  it('renders inert when the configured URL is rejected by the sanitizer', () => {
    // eslint-disable-next-line no-script-url
    const fixture = setup({ url: 'javascript:alert(1)' });

    expect(anchor(fixture)).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="hyperlink-blocked"]'),
    ).toBeTruthy();
  });
});

describe('OMCT-C09-L2-04.02 Hyperlink target', () => {
  it('navigates the current tab through a plain href by default', () => {
    const fixture = setup({ url: 'https://ops.example.gov/rules' });

    const element = anchor(fixture)!;
    expect(element.getAttribute('href')).toBe('https://ops.example.gov/rules');
    expect(element.getAttribute('target')).toBeNull();
    expect(element.getAttribute('rel')).toBeNull();
  });

  it('opens new-tab links with opener isolation', () => {
    const fixture = setup({ url: 'https://ops.example.gov/console', target: 'new' });

    const element = anchor(fixture)!;
    expect(element.getAttribute('target')).toBe('_blank');
    expect(element.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
