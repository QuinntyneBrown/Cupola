import { FormatRegistry } from './format-registry';
import { ISOTimeFormat } from './formats/iso-time-format';
import { UTCTimeFormat } from './formats/utc-time-format';

describe('OMCT-C05-L2-05.01 FormatRegistry', () => {
  let registry: FormatRegistry;

  beforeEach(() => {
    registry = new FormatRegistry();
  });

  it('resolves a registered format by key', () => {
    const utc = new UTCTimeFormat();
    registry.register(utc);
    registry.register(new ISOTimeFormat());

    expect(registry.get('utc')).toBe(utc);
    expect(registry.has('iso')).toBe(true);
  });

  it('returns undefined for an unregistered key', () => {
    expect(registry.get('missing')).toBeUndefined();
    expect(registry.has('missing')).toBe(false);
  });
});
