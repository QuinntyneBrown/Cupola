import { EnvironmentInjector, inject } from '@angular/core';
import {
  ActionRegistry,
  AnnotationService,
  MetadataRegistry,
  ViewRegistry,
} from '@cupola/core';

import { ImageExporter } from './actions/image-exporter';
import { OpenImageAction } from './actions/open-image-action';
import { SaveImageAction } from './actions/save-image-action';
import { ImageryFocusService } from './imagery-focus.service';
import { ImageryViewProvider } from './imagery-view-provider';

/** The pixel-spatial annotation type C11 registers (OMCT-C11-L2-03.02). */
export const IMAGE_PIXEL_ANNOTATION_TYPE = 'image-pixel';

interface PixelDetail {
  time?: number;
}

/**
 * Registers C11 imagery contributions: the imagery view provider (metadata
 * image-value gate), the open/save extraction actions, and the pixel-spatial
 * annotation type with its target comparator (same target, same capture
 * instant). Must run inside an injection context (the app initializer).
 *
 * Requirements: OMCT-C11-L2-01.01, 03.02, 03.03, 04.01, 04.02.
 */
export function registerImagery(): void {
  const injector = inject(EnvironmentInjector);
  inject(ViewRegistry).register(
    new ImageryViewProvider(injector, inject(MetadataRegistry)),
  );

  const focus = inject(ImageryFocusService);
  const actions = inject(ActionRegistry);
  actions.register(new OpenImageAction(focus));
  actions.register(new SaveImageAction(focus, inject(ImageExporter)));

  const annotations = inject(AnnotationService);
  annotations.registerType(IMAGE_PIXEL_ANNOTATION_TYPE);
  annotations.registerComparator(IMAGE_PIXEL_ANNOTATION_TYPE, (a, b) => {
    const aDetail = a.detail as PixelDetail | undefined;
    const bDetail = b.detail as PixelDetail | undefined;
    return a.keyString === b.keyString && aDetail?.time === bDetail?.time;
  });
}
