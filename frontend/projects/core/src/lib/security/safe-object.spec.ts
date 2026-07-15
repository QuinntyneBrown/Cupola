import { dropUnsafeKeys, sanitizeImportedJson } from './safe-object';

describe('OMCT-C16-L2-04.04 Prototype-pollution protection', () => {
  afterEach(() => {
    delete (Object.prototype as Record<string, unknown>)['polluted'];
  });

  it('drops __proto__ from imported JSON without polluting the prototype', () => {
    const result = sanitizeImportedJson<Record<string, unknown>>(
      '{"__proto__":{"polluted":true},"name":"gauge"}',
    );
    expect(result['name']).toBe('gauge');
    expect(Object.getOwnPropertyNames(result)).not.toContain('__proto__');
    expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
  });

  it('drops constructor and prototype keys at every depth', () => {
    const result = dropUnsafeKeys({
      a: { constructor: 'x', keep: 1 },
      list: [{ prototype: 'y', ok: 2 }],
    } as Record<string, unknown>);
    expect(result).toEqual({ a: { keep: 1 }, list: [{ ok: 2 }] });
  });

  it('preserves primitives and arrays', () => {
    expect(dropUnsafeKeys(42)).toBe(42);
    expect(dropUnsafeKeys('x')).toBe('x');
    expect(dropUnsafeKeys([1, 2, 3])).toEqual([1, 2, 3]);
  });
});
