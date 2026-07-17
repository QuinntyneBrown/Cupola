import { TestBed } from '@angular/core/testing';
import {
  DefaultMetadataProvider,
  DomainObject,
  MetadataRegistry,
  NumberFormat,
  UtcFormat,
  ValueFormatRegistry,
} from '@cupola/core';
import { OverlayService } from '@cupola/components';

import { WideDatum } from '../telemetry-view/telemetry-stream';
import { ViewDatumService } from './view-datum.service';

class OverlayServiceStub {
  shown = 0;
  show(): void {
    this.shown += 1;
  }
}

function telemetry(): DomainObject {
  return {
    identifier: { namespace: '', key: 'pwr.bus_v' },
    keyString: 'pwr.bus_v',
    name: 'Bus voltage',
    type: 'telemetry',
    location: null,
    composition: [],
    telemetry: { hints: ['range'], unit: 'V' },
  };
}

function setup() {
  const overlays = new OverlayServiceStub();
  TestBed.configureTestingModule({
    providers: [{ provide: OverlayService, useValue: overlays }],
  });
  const metadata = TestBed.inject(MetadataRegistry);
  metadata.addProvider(new DefaultMetadataProvider());
  const formats = TestBed.inject(ValueFormatRegistry);
  formats.register(new NumberFormat());
  formats.register(new UtcFormat());
  return { overlays, service: TestBed.inject(ViewDatumService) };
}

describe('OMCT-C08-L2-04.04 Datum detail overlay', () => {
  it('formats one field per metadata value of the datum', () => {
    const { service } = setup();
    const datum: WideDatum = {
      keyString: 'pwr.bus_v',
      timestamp: '2026-07-13T18:22:04.000Z',
      value: 28.4,
    } as WideDatum;
    const fields = service.fields(telemetry(), datum);
    expect(fields).toEqual([
      { name: 'Timestamp', value: '2026-07-13T18:22:04.000Z' },
      { name: 'Value', value: '28.4' },
    ]);
  });

  it('opens an overlay for the selected datum', () => {
    const { overlays, service } = setup();
    service.open(telemetry(), { keyString: 'pwr.bus_v', timestamp: 't', value: 1 } as WideDatum);
    expect(overlays.shown).toBe(1);
  });
});
