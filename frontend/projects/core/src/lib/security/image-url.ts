/**
 * B17 — Image-URL allow list and isolated image navigation (owner C16).
 *
 * The image new-tab action (C11 imagery, a later wave) shall open an image only
 * when its URL uses one of the implemented allowed forms; every other URL is
 * blocked. Consuming capabilities shall route image new-tab navigation through
 * these functions rather than calling `window.open` directly.
 * See docs/capability-contracts/cross-capability-contracts.md (B17).
 */

/** Non-SVG `data:image/...` URLs are allowed; `image/svg+xml` can carry script. */
const ALLOWED_IMAGE_DATA_URL = /^data:image\/(?!svg\b|svg\+xml)[a-z0-9.+-]+[;,]/i;

/**
 * Browsers strip whitespace and control characters from URLs before resolving
 * them, so a value like "ht\ttp://" must be normalized before it is inspected.
 * Removes every character at or below U+0020 and the U+007F delete character.
 */
function stripControlCharacters(url: string): string {
  let result = '';
  for (const character of url) {
    const code = character.charCodeAt(0);
    if (code >= 0x20 && code !== 0x7f) {
      result += character;
    }
  }
  return result;
}

/**
 * Whether an image URL is safe to open in a new tab. Allows safe absolute HTTP
 * or HTTPS URLs, safe root-relative URLs, allowed non-SVG data-image URLs, and
 * same-origin blob URLs; blocks everything else. OMCT-C16-L2-04.06
 */
export function isAllowedImageUrl(url: string): boolean {
  const normalized = stripControlCharacters(url);
  if (normalized.length === 0) {
    return false;
  }

  // Root-relative URLs, but not protocol-relative (`//host`) URLs.
  if (normalized.startsWith('/')) {
    return !normalized.startsWith('//');
  }

  // Non-SVG data-image URLs.
  if (/^data:/i.test(normalized)) {
    return ALLOWED_IMAGE_DATA_URL.test(normalized);
  }

  // Same-origin blob URLs (blob:<origin>/<uuid>).
  if (/^blob:/i.test(normalized)) {
    try {
      const inner = new URL(normalized.slice('blob:'.length));
      return inner.origin === globalThis.location?.origin;
    } catch {
      return false;
    }
  }

  // Absolute HTTP or HTTPS URLs. Relative non-root paths are not on the allow
  // list for image new-tab navigation.
  try {
    const parsed = new URL(normalized);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Returns the normalized image URL when allowed, otherwise null. OMCT-C16-L2-04.06 */
export function sanitizeImageUrl(url: string): string | null {
  return isAllowedImageUrl(url) ? stripControlCharacters(url) : null;
}

/**
 * Opens an allowed image URL in a new context isolated from the opener; no-ops
 * on a blocked URL. Combines the allow list (04.06) with opener isolation (04.05).
 */
export function openImageInNewTab(url: string): void {
  const safeUrl = sanitizeImageUrl(url);
  if (safeUrl === null) {
    return;
  }
  window.open(safeUrl, '_blank', 'noopener,noreferrer');
}
