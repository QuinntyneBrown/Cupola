import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomainObject } from '@cupola/core';

import { WebPageViewComponent } from './web-page-view.component';

function webPage(url: string | undefined): DomainObject {
  return {
    identifier: { namespace: '', key: 'web.tdrs' },
    keyString: 'web.tdrs',
    name: 'TDRS status',
    type: 'web-page',
    location: null,
    composition: [],
    configuration: { webPage: { url } },
  };
}

function setup(url: string | undefined): ComponentFixture<WebPageViewComponent> {
  TestBed.configureTestingModule({});
  const fixture = TestBed.createComponent(WebPageViewComponent);
  fixture.componentRef.setInput('object', webPage(url));
  fixture.detectChanges();
  return fixture;
}

describe('OMCT-C09-L2-04.03 Web-page embedding', () => {
  it('creates a sandboxed embedded frame for a valid URL', () => {
    const fixture = setup('https://status.example.gov/tdrs');

    const frame = fixture.nativeElement.querySelector(
      '[data-testid="web-embed"]',
    ) as HTMLIFrameElement;
    expect(frame).toBeTruthy();
    expect(frame.getAttribute('src')).toBe('https://status.example.gov/tdrs');
    expect(frame.getAttribute('sandbox')).toBe('allow-scripts');
    expect(frame.getAttribute('referrerpolicy')).toBe('no-referrer');
  });

  it('renders the failure state instead of a frame when the URL is rejected', () => {
    // eslint-disable-next-line no-script-url
    const fixture = setup('javascript:alert(1)');

    expect(fixture.nativeElement.querySelector('[data-testid="web-embed"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="web-embed-error"]')).toBeTruthy();
  });

  it('renders the failure state when no URL is configured', () => {
    const fixture = setup(undefined);

    expect(fixture.nativeElement.querySelector('[data-testid="web-embed-error"]')).toBeTruthy();
  });
});
