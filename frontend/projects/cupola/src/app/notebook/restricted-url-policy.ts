import { sanitizeRichText, sanitizeUrl } from '@cupola/core';

/**
 * Default hostnames whose URLs may render as links in a restricted notebook.
 * A notebook overrides this through `configuration.urlWhitelist`.
 */
export const RESTRICTED_NOTEBOOK_URL_WHITELIST: readonly string[] = ['example.com'];

/**
 * Whether a URL may render as a link in a restricted notebook: it must pass
 * URL sanitization (B17) and resolve to an http(s) host on the whitelist (an
 * exact host or a subdomain of a whitelisted host). Relative and scheme-less
 * URLs have no host and are never permitted (OMCT-C13-L2-02.06).
 */
export function isRestrictedUrlAllowed(url: string, whitelist: readonly string[]): boolean {
  const safe = sanitizeUrl(url);
  if (safe === null || !/^https?:/i.test(safe)) {
    return false;
  }
  let host: string;
  try {
    host = new URL(safe).hostname.toLowerCase();
  } catch {
    return false;
  }
  return whitelist.some((allowed) => {
    const domain = allowed.toLowerCase();
    return host === domain || host.endsWith(`.${domain}`);
  });
}

/**
 * Renders a restricted-notebook entry body: sanitizes the rich text, then keeps
 * only anchors whose href is whitelisted (marking them as links) and replaces
 * every other anchor with inert, struck-through text carrying a "Blocked URL"
 * badge (OMCT-C13-L2-02.06).
 */
export function renderRestrictedEntryHtml(text: string, whitelist: readonly string[]): string {
  const template = document.createElement('template');
  template.innerHTML = sanitizeRichText(text);
  template.content.querySelectorAll('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href') ?? '';
    if (isRestrictedUrlAllowed(href, whitelist)) {
      anchor.classList.add('cp-link');
      return;
    }
    anchor.replaceWith(inertUrl(anchor.textContent ?? href));
  });
  return template.innerHTML;
}

/** An inert representation of a blocked URL: struck-through text plus a badge. */
function inertUrl(label: string): HTMLElement {
  const blocked = document.createElement('span');
  blocked.className = 'nb-blocked';
  blocked.setAttribute('data-testid', 'nb-blocked-url');
  blocked.textContent = label;
  const badge = document.createElement('span');
  badge.className = 'nb-blocked-badge';
  badge.textContent = 'Blocked URL';
  blocked.appendChild(badge);
  return blocked;
}
