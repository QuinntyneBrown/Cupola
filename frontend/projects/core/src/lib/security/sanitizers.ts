/**
 * B17 — Sanitization and safe navigation (owner C16).
 * Consumers: C09 (hyperlink, web page), C10 (widget URLs),
 * C11 (image open/save), C13 (rich text) · Stability: high.
 *
 * Consuming capabilities shall route every externally supplied URL, rich-text
 * fragment, CSV cell, and download filename through these functions; direct use
 * of `window.open` or unsanitized `innerHTML` is non-conforming.
 * See docs/capability-contracts/cross-capability-contracts.md (B17).
 */

/**
 * Removes control characters (below U+0020) and the U+007F delete character.
 * Browsers strip tab and newline characters from a URL before resolving its
 * scheme, so a value like "java\tscript:alert(1)" would otherwise execute.
 */
function stripControlCharacters(value: string): string {
  let result = '';
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code >= 0x20 && code !== 0x7f) {
      result += character;
    }
  }
  return result;
}

/** Returns the URL when it is http(s) or relative; otherwise null. OMCT-C16-L2-04.01 */
export function sanitizeUrl(url: string): string | null {
  const trimmed = stripControlCharacters(url).trim();
  if (trimmed.length === 0) {
    return null;
  }
  // Reject anything carrying an explicit scheme other than http/https
  // (javascript:, data:, vbscript:, file:, blob:, ...).
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return /^https?:/i.test(trimmed) ? trimmed : null;
  }
  // Reject protocol-relative URLs; every other scheme-less URL is relative.
  return trimmed.startsWith('//') ? null : trimmed;
}

/** Markup that can execute script or navigate is removed outright. */
const DISALLOWED_ELEMENTS =
  'script, style, iframe, object, embed, link, meta, base, form, svg, math, template';

/** Strips markup that can execute script from a rich-text fragment. OMCT-C16-L2-04.02 */
export function sanitizeRichText(html: string): string {
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelectorAll(DISALLOWED_ELEMENTS).forEach((element) => element.remove());
  template.content.querySelectorAll('*').forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      // Event handlers, srcdoc, and formaction can execute script or redirect.
      if (name.startsWith('on') || name === 'srcdoc' || name === 'formaction') {
        element.removeAttribute(attribute.name);
        continue;
      }
      if (
        (name === 'href' || name === 'src' || name === 'xlink:href' || name === 'action') &&
        sanitizeUrl(attribute.value) === null
      ) {
        element.removeAttribute(attribute.name);
      }
    }
  });
  return template.innerHTML;
}

/** Prefixes formula-leading cells so spreadsheets treat them as text. OMCT-C16-L2-04.03 */
export function neutralizeCsvCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/**
 * Removes path separators and reserved characters and trims leading and trailing
 * periods from a filename before download. OMCT-C16-L2-04.07
 */
export function sanitizeFilename(name: string): string {
  return stripControlCharacters(name)
    .replace(/[/\\:*?"<>|]/g, '_')
    .replace(/^\.+/, '')
    .replace(/\.+$/, '')
    .trim();
}

/** Opens a sanitized URL in a new context isolated from the opener. OMCT-C16-L2-04.05 */
export function openExternal(url: string): void {
  const safeUrl = sanitizeUrl(url);
  if (safeUrl === null) {
    return;
  }
  window.open(safeUrl, '_blank', 'noopener,noreferrer');
}
