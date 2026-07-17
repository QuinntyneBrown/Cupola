import { EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DefaultMetadataProvider, DomainObject, MetadataRegistry } from '@cupola/core';

import { ImageryViewProvider } from './imagery-view-provider';

function telemetryObject(key: string, hints: string[]): DomainObject {
  return {
    identifier: { namespace: '', key },
    keyString: key,
    name: key,
    type: 'telemetry',
    location: null,
    composition: [],
    telemetry: { hints },
  };
}

describe('OMCT-C11-L2-01.01 Imagery applicability', () => {
  function setup(): ImageryViewProvider {
    TestBed.configureTestingModule({});
    const metadata = TestBed.inject(MetadataRegistry);
    metadata.addProvider(new DefaultMetadataProvider());
    return new ImageryViewProvider(TestBed.inject(EnvironmentInjector), metadata);
  }

  it('offers the view only when metadata identifies an image value', () => {
    const provider = setup();

    expect(provider.canView(telemetryObject('cam.aft', ['image']), [])).toBe(true);
  });

  it('never offers the view for plain numeric telemetry or non-telemetry objects', () => {
    const provider = setup();

    // The default provider claims a numeric range for every telemetry object —
    // the image gate must not be fooled by that.
    expect(provider.canView(telemetryObject('pwr.bus_v', ['range']), [])).toBe(false);
    expect(
      provider.canView(
        { ...telemetryObject('f', []), type: 'folder', telemetry: undefined },
        [],
      ),
    ).toBe(false);
  });
});
