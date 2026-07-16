import { ValueResolver } from './summary-widget-evaluator';

function overrideKey(keyString: string, metadataKey: string): string {
  return `${keyString}::${metadataKey}`;
}

/**
 * In-memory test telemetry for previewing summary-widget rules in edit mode
 * (OMCT-C10-L2-02.05). Overrides are never persisted as source telemetry — they
 * live only in this manager and wrap the live resolver while enabled.
 */
export class TestDataManager {
  private enabled = false;
  private readonly overrides = new Map<string, number | string>();

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setValue(keyString: string, metadataKey: string, value: number | string): void {
    this.overrides.set(overrideKey(keyString, metadataKey), value);
  }

  clear(): void {
    this.overrides.clear();
  }

  /** Wraps a live resolver, substituting test values while enabled. */
  resolver(live: ValueResolver): ValueResolver {
    return (keyString, metadataKey) => {
      if (this.enabled) {
        const override = this.overrides.get(overrideKey(keyString, metadataKey));
        if (override !== undefined) {
          return override;
        }
      }
      return live(keyString, metadataKey);
    };
  }
}
