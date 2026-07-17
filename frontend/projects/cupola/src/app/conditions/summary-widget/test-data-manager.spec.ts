import { ValueResolver } from './summary-widget-evaluator';
import { TestDataManager } from './test-data-manager';

const live: ValueResolver = (keyString) => (keyString === 'a' ? 5 : undefined);

describe('OMCT-C10-L2-02.05 Summary-widget test data', () => {
  it('substitutes test values only while enabled', () => {
    const manager = new TestDataManager();
    manager.setValue('a', 'value', 99);
    const resolve = manager.resolver(live);

    expect(resolve('a', 'value')).toBe(5); // disabled: live value

    manager.setEnabled(true);
    expect(resolve('a', 'value')).toBe(99); // enabled: test override
  });

  it('falls through to live telemetry for fields without an override', () => {
    const manager = new TestDataManager();
    manager.setEnabled(true);
    manager.setValue('a', 'value', 99);
    const resolve = manager.resolver(live);

    expect(resolve('a', 'value')).toBe(99);
    expect(resolve('a', 'status')).toBe(5); // no override for this field
  });

  it('does not retain overrides after clear, leaving source telemetry untouched', () => {
    const manager = new TestDataManager();
    manager.setEnabled(true);
    manager.setValue('a', 'value', 99);
    manager.clear();
    const resolve = manager.resolver(live);

    expect(resolve('a', 'value')).toBe(5);
  });
});
