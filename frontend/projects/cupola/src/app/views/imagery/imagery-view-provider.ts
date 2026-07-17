import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, MetadataRegistry, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { ImageryViewComponent } from './imagery-view.component';

/**
 * Imagery view — offered only when the telemetry metadata identifies an image
 * value (OMCT-C11-L2-01.01). The metadata gate is load-bearing: the default
 * provider reports a numeric range for every telemetry object, and mints the
 * image value only for image-hinted sources. Priority 80.
 */
export class ImageryViewProvider implements ViewProvider {
  readonly key = 'imagery';
  readonly name = 'Imagery';
  readonly glyph = 'i-image';
  readonly priority = 80;

  constructor(
    private readonly environmentInjector: EnvironmentInjector,
    private readonly metadata: MetadataRegistry,
  ) {}

  canView(object: DomainObject): boolean {
    if (object.type !== 'telemetry') {
      return false;
    }
    const values = this.metadata.getMetadata(object)?.values ?? [];
    return values.some((value) => value.hint === 'image');
  }

  view(object: DomainObject, objectPath: DomainObject[]): CupolaView {
    return componentView(this.environmentInjector, ImageryViewComponent, { object, objectPath });
  }
}
