/**
 * B17 — Sanitization and safe navigation (contract skeleton).
 * Owner: C16 · Consumers: C09 (hyperlink, web page), C10 (widget URLs),
 * C11 (image open/save), C13 (rich text) · Stability: high.
 *
 * Minimal conservative implementations committed with the skeleton; C16 owns
 * hardening. Consuming capabilities shall route every externally supplied URL,
 * rich-text fragment, CSV cell, and download filename through these functions;
 * direct use of `window.open` or unsanitized `innerHTML` is non-conforming.
 * See docs/capability-contracts/cross-capability-contracts.md.
 */

/** Returns the URL when it is http(s) or relative; otherwise null. OMCT-C16-L2-04.01 */
export function sanitizeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return null;
  }
  // Reject anything carrying an explicit scheme other than http/https
  // (javascript:, data:, vbscript:, file:, blob:, ...).
  if (/^[a-z][\w+.-]*:/i.test(trimmed)) {
    return /^https?:/i.test(trimmed) ? trimmed : null;
  }
  // Reject protocol-relative URLs; every other scheme-less URL is relative.
  return trimmed.startsWith('//') ? null : trimmed;
}

/** Strips markup that can execute script from a rich-text fragment. OMCT-C16-L2-04.02 */
export function sanitizeRichText(html: string): string {
  const template = document.createElement('template');
  template.innerHTML = html;
  const disallowed = template.content.querySelectorAll(
    'script, style, iframe, object, embed, link, meta, base, form',
  );
  disallowed.forEach((element) => element.remove());
  template.content.querySelectorAll('*').forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (name.startsWith('on') || name === 'srcdoc') {
        element.removeAttribute(attribute.name);
        continue;
      }
      if (
        (name === 'href' || name === 'src' || name === 'xlink:href') &&
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

/** Removes path separators and reserved characters from a filename. OMCT-C16-L2-04.07 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[/\\:*?"<>|]/g, '_')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/^\.+/, '')
    .trim();
}

/** Opens a sanitized URL in a new context isolated from the opener. */
export function openExternal(url: string): void {
  const safeUrl = sanitizeUrl(url);
  if (safeUrl === null) {
    return;
  }
  window.open(safeUrl, '_blank', 'noopener,noreferrer');
}
