import { EnvironmentInjector, Injectable, inject } from '@angular/core';
import { DomainObject, MetadataRegistry, ValueFormatRegistry } from '@cupola/core';
import { OverlayService, componentView } from '@cupola/components';

import { WideDatum } from '../telemetry-view/telemetry-stream';
import { formatField } from '../tabular/telemetry-cell';
import { DatumDetailViewComponent, DatumField } from './datum-detail-view.component';

/**
 * Opens a datum-detail overlay listing every metadata field of a selected datum
 * with its formatted value (OMCT-C08-L2-04.04). Wired to row double-click in the
 * telemetry table, LAD tables, and autoflow view.
 */
@Injectable({ providedIn: 'root' })
export class ViewDatumService {
  private readonly overlays = inject(OverlayService);
  private readonly metadata = inject(MetadataRegistry);
  private readonly formats = inject(ValueFormatRegistry);
  private readonly injector = inject(EnvironmentInjector);

  /** The formatted metadata fields for a datum, in domain-then-range order. */
  fields(object: DomainObject, datum: WideDatum): DatumField[] {
    const view = this.metadata.getMetadata(object);
    const values = view ? [...view.domains(), ...view.ranges()] : [];
    return values.map((value) => ({
      name: value.name ?? value.key,
      value: formatField(datum, value, this.formats),
    }));
  }

  /** Opens the overlay for the datum. */
  open(object: DomainObject, datum: WideDatum): void {
    const view = componentView(this.injector, DatumDetailViewComponent, {
      title: object.name,
      fields: this.fields(object, datum),
    });
    this.overlays.show({ view, size: 'small', dismissible: true });
  }
}
