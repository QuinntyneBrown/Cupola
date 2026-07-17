import { DomainObject } from '../models/domain-object';
import { DefaultMetadataProvider } from './default-metadata-provider';

function telemetryObject(hints: string[]): DomainObject {
  return {
    identifier: { namespace: '', key: 'tlm' },
    keyString: 'tlm',
    name: 'Telemetry',
    type: 'telemetry',
    location: null,
    composition: [],
    telemetry: { hints },
  };
}

describe('OMCT-C11-L2-01.01 Image value metadata', () => {
  it('emits an image value only for image-hinted telemetry', () => {
    const provider = new DefaultMetadataProvider();

    const imageValues = provider.getMetadata(telemetryObject(['image']));
    const image = imageValues.find((value) => value.hint === 'image');

    expect(image).toEqual(
      expect.objectContaining({ key: 'url', name: 'Image', format: 'image' }),
    );
  });

  it('never mints an image value for plain numeric telemetry', () => {
    const provider = new DefaultMetadataProvider();

    const values = provider.getMetadata(telemetryObject(['range']));

    expect(values.some((value) => value.hint === 'image')).toBe(false);
    // The unconditional numeric range stays (known wrinkle) — imagery eligibility
    // must gate on the image hint, never on range absence.
    expect(values.some((value) => value.hint === 'range')).toBe(true);
  });
});
