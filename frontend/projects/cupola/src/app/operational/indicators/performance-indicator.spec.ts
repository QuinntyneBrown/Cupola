import { PerformanceIndicator } from './performance-indicator';

describe('OMCT-C14-L2-05.03 Performance indicator', () => {
  function setup() {
    let frameCallback: FrameRequestCallback | null = null;
    const raf = (callback: FrameRequestCallback): number => {
      frameCallback = callback;
      return 0;
    };
    const indicator = new PerformanceIndicator(raf);
    const frame = (timestamp: number) => {
      const callback = frameCallback!;
      frameCallback = null;
      callback(timestamp);
    };
    return { indicator, frame };
  }

  it('updates the calculated frames-per-second from sampled animation frames', () => {
    const { indicator, frame } = setup();
    indicator.start();

    frame(0);
    for (let timestamp = 100; timestamp <= 1000; timestamp += 100) {
      frame(timestamp);
    }

    expect(indicator.indicator.textSignal!()).toBe('10 fps');
  });

  it('recomputes per one-second window', () => {
    const { indicator, frame } = setup();
    indicator.start();

    frame(0);
    for (let timestamp = 50; timestamp <= 1000; timestamp += 50) {
      frame(timestamp);
    }
    expect(indicator.indicator.textSignal!()).toBe('20 fps');

    for (let timestamp = 1250; timestamp <= 2250; timestamp += 250) {
      frame(timestamp);
    }
    expect(indicator.indicator.textSignal!()).toBe('4 fps');
    indicator.stop();
  });
});
