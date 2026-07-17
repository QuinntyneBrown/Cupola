import { DOCUMENT, Injectable, inject } from '@angular/core';
import { sanitizeFilename } from '@cupola/core';

import { ImageFrame } from '../image-history';

/** Extracts a file extension from the image URL path; defaults to png. */
function extensionOf(url: string): string {
  const match = /\.([a-z0-9]{2,5})(?:[?#]|$)/i.exec(url);
  return match ? match[1].toLowerCase() : 'png';
}

/** Derives `<object name>-<compact capture time>.<ext>` (OMCT-C11-L2-04.02). */
export function derivedImageFilename(objectName: string, frame: ImageFrame): string {
  const compactTime = frame.timestampIso.replace(/[:.]/g, '').replace('T', '-').replace('Z', 'Z');
  return `${sanitizeFilename(objectName) || 'image'}-${compactTime}.${extensionOf(frame.url)}`;
}

/**
 * Saves the displayed image through the browser download workflow
 * (OMCT-C11-L2-04.02): fetches the (same-origin or allow-listed) image content
 * and downloads it under a derived, sanitized filename.
 */
@Injectable({ providedIn: 'root' })
export class ImageExporter {
  private readonly document = inject(DOCUMENT);

  async exportImage(objectName: string, frame: ImageFrame): Promise<void> {
    const response = await fetch(frame.url);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = this.document.createElement('a');
    anchor.href = url;
    anchor.download = derivedImageFilename(objectName, frame);
    anchor.setAttribute('data-testid', 'imagery-download');
    this.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}
