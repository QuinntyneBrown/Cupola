import { computed, signal } from '@angular/core';
import { StatusIndicator } from '@cupola/core';

export interface UrlHealthConfig {
  url: string;
  intervalMs: number;
  label: string;
}

type HealthState = 'unknown' | 'nominal' | 'error';

/**
 * Polls a configured URL and indicates reachable or unreachable state.
 * Requirement: OMCT-C14-L2-05.02.
 */
export class UrlHealthIndicator {
  private readonly state = signal<HealthState>('unknown');
  private timer: ReturnType<typeof setInterval> | null = null;

  readonly indicator: StatusIndicator;

  constructor(
    private readonly config: UrlHealthConfig,
    private readonly fetchFn: (url: string) => Promise<{ ok: boolean }> = (url) => fetch(url),
  ) {
    this.indicator = {
      key: 'url-health',
      priority: 40,
      testId: 'url-health-indicator',
      textSignal: computed(() => `${this.config.label}: ${labelFor(this.state())}`),
      cssClass: computed(() => dotFor(this.state())),
    };
  }

  start(): void {
    if (this.timer) {
      return;
    }
    void this.poll();
    this.timer = setInterval(() => void this.poll(), this.config.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async poll(): Promise<void> {
    try {
      const response = await this.fetchFn(this.config.url);
      this.state.set(response.ok ? 'nominal' : 'error');
    } catch {
      this.state.set('error');
    }
  }
}

function labelFor(state: HealthState): string {
  switch (state) {
    case 'nominal':
      return 'Reachable';
    case 'error':
      return 'Unreachable';
    default:
      return 'Checking';
  }
}

function dotFor(state: HealthState): string {
  switch (state) {
    case 'nominal':
      return 'cp-dot--ok';
    case 'error':
      return 'cp-dot--critical';
    default:
      return 'cp-dot--caution';
  }
}
