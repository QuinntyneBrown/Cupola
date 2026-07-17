import { Injectable, inject } from '@angular/core';
import { DomainObject, NotebookEmbed, TimeContext } from '@cupola/core';

/**
 * Captures an object-view context as a notebook snapshot: a structured
 * view-reference to the source object and view plus the time bounds in effect,
 * rather than a rasterized image, so the embed can be expanded back to the live
 * view (OMCT-C13-L2-02.02, 02.03).
 */
@Injectable({ providedIn: 'root' })
export class SnapshotCaptureService {
  private readonly time = inject(TimeContext, { optional: true });

  /** Builds a snapshot embed for the object at the end of the given path. */
  capture(objectPath: DomainObject[], viewKey?: string): NotebookEmbed {
    const object = objectPath[objectPath.length - 1];
    const embed: NotebookEmbed = {
      objectKeyString: object.keyString,
      objectName: object.name,
      capturedAt: new Date().toISOString(),
    };
    if (viewKey) {
      embed.viewKey = viewKey;
    }
    if (this.time) {
      embed.bounds = this.time.bounds();
    }
    return embed;
  }
}
