import { toImageFrames } from './image-history';
import { WideDatum } from '../../telemetry-view/telemetry-stream';

function datum(timestamp: string, url: unknown, extra: Record<string, unknown> = {}): WideDatum {
  return { keyString: 'cam.aft', timestamp, value: 0, url, ...extra } as WideDatum;
}

describe('OMCT-C11-L2-01.02 Initial focused image — image history', () => {
  it('orders frames ascending by capture time with orientation fields', () => {
    const frames = toImageFrames([
      datum('1970-01-01T00:01:00.000Z', '/imagery/frame-2.svg', { heading: 45, cameraAngle: -5 }),
      datum('1970-01-01T00:00:30.000Z', '/imagery/frame-1.svg'),
    ]);

    expect(frames.map((frame) => frame.url)).toEqual([
      '/imagery/frame-1.svg',
      '/imagery/frame-2.svg',
    ]);
    expect(frames[1]).toMatchObject({ time: 60_000, heading: 45, cameraAngle: -5 });
    expect(frames[0].heading).toBeUndefined();
  });

  it('drops datums without an allow-listed image URL', () => {
    const frames = toImageFrames([
      datum('1970-01-01T00:00:30.000Z', '/imagery/frame-1.svg'),
      datum('1970-01-01T00:01:00.000Z', undefined),
      // eslint-disable-next-line no-script-url
      datum('1970-01-01T00:01:30.000Z', 'javascript:alert(1)'),
      datum('1970-01-01T00:02:00.000Z', '//evil.example/x.png'),
    ]);

    expect(frames).toHaveLength(1);
  });

  it('deduplicates frames on the same capture instant, keeping the latest datum', () => {
    const frames = toImageFrames([
      datum('1970-01-01T00:00:30.000Z', '/imagery/frame-1.svg'),
      datum('1970-01-01T00:00:30.000Z', '/imagery/frame-3.svg'),
    ]);

    expect(frames).toHaveLength(1);
    expect(frames[0].url).toBe('/imagery/frame-3.svg');
  });
});
