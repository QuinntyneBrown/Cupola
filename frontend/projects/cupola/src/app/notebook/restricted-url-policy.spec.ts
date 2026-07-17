import {
  RESTRICTED_NOTEBOOK_URL_WHITELIST,
  isRestrictedUrlAllowed,
  renderRestrictedEntryHtml,
} from './restricted-url-policy';

describe('OMCT-C13-L2-02.06 — Restricted entry URLs', () => {
  const whitelist = ['example.com'];

  it('permits only whitelisted http(s) hosts and their subdomains', () => {
    expect(isRestrictedUrlAllowed('https://example.com/log', whitelist)).toBe(true);
    expect(isRestrictedUrlAllowed('https://ops.example.com/log', whitelist)).toBe(true);
    expect(isRestrictedUrlAllowed('https://mission-wiki.example.org/eva', whitelist)).toBe(false);
    expect(isRestrictedUrlAllowed('/relative/path', whitelist)).toBe(false);
    expect(isRestrictedUrlAllowed('javascript:alert(1)', whitelist)).toBe(false);
  });

  it('renders whitelisted URLs as links and non-whitelisted URLs inert', () => {
    const text =
      'See <a href="https://ops.example.com/log">the log</a> and ' +
      '<a href="https://mission-wiki.example.org/eva">the wiki</a>.';
    const html = renderRestrictedEntryHtml(text, whitelist);

    expect(html).toContain('href="https://ops.example.com/log"');
    expect(html).toContain('cp-link');
    expect(html).not.toContain('mission-wiki.example.org');
    expect(html).toContain('nb-blocked');
    expect(html).toContain('Blocked URL');
  });

  it('strips script content before applying the URL policy', () => {
    const html = renderRestrictedEntryHtml(
      '<script>steal()</script><a href="https://example.com">ok</a>',
      whitelist,
    );
    expect(html).not.toContain('steal');
    expect(html).toContain('href="https://example.com"');
  });

  it('exposes a non-empty default whitelist constant', () => {
    expect(RESTRICTED_NOTEBOOK_URL_WHITELIST.length).toBeGreaterThan(0);
  });
});
