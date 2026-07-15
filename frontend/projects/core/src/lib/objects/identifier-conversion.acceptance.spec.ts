import { Identifier } from '../models/identifier';
import { makeKeyString, parseKeyString } from '../models/key-string';

describe('OMCT-C02-L2-01.01 Identifier conversion', () => {
  it('preserves namespace and key across convert and reconvert', () => {
    const identifier: Identifier = { namespace: 'couch', key: 'abc-123' };

    expect(parseKeyString(makeKeyString(identifier))).toEqual(identifier);
  });

  it('round-trips a namespace-less key without inventing a namespace', () => {
    const identifier: Identifier = { namespace: '', key: 'root' };

    const keyString = makeKeyString(identifier);

    expect(keyString).toBe('root');
    expect(parseKeyString(keyString)).toEqual(identifier);
  });

  it('preserves a key that itself contains the separator character', () => {
    const identifier: Identifier = { namespace: 'ns', key: 'a:b:c' };

    expect(parseKeyString(makeKeyString(identifier))).toEqual(identifier);
  });
});
