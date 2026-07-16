import { NumberFormat } from './value-format';
import { ValueFormatRegistry } from './value-format-registry.service';
import { TelemetryValueFormatter } from './telemetry-value-formatter';

describe('OMCT-C06-L2-03.04 Value formatting', () => {
  function formatter(): TelemetryValueFormatter {
    const registry = new ValueFormatRegistry();
    registry.register(new NumberFormat());
    return new TelemetryValueFormatter({ key: 'value', hint: 'range', format: 'number' }, registry);
  }

  it('formats a datum field value with the named format', () => {
    expect(formatter().formatValue({ value: 3.5 })).toBe('3.5');
  });

  it('parses and validates using the named format', () => {
    expect(formatter().parse('42')).toBe(42);
    expect(formatter().validate('42')).toBe(true);
    expect(formatter().validate('not-a-number')).toBe(false);
  });

  it('throws when the named format is not registered', () => {
    const registry = new ValueFormatRegistry();
    const missing = new TelemetryValueFormatter({ key: 'value', hint: 'range', format: 'ghost' }, registry);
    expect(() => missing.formatValue({ value: 1 })).toThrow(/ghost/);
  });
});
