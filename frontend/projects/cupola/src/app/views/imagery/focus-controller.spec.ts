import { FocusController } from './focus-controller';
import { ImageFrame } from './image-history';

function frame(time: number): ImageFrame {
  return { url: `/imagery/frame-${time}.svg`, time, timestampIso: new Date(time).toISOString() };
}

const FRAMES = [frame(30_000), frame(60_000), frame(90_000)];

describe('OMCT-C11-L2-01.02 Initial focused image', () => {
  it('focuses the most recent frame while tracking the live edge', () => {
    const focus = new FocusController();

    expect(focus.trackingLatest()).toBe(true);
    expect(focus.focusedFrame(FRAMES)?.time).toBe(90_000);

    const appended = [...FRAMES, frame(120_000)];
    expect(focus.focusedFrame(appended)?.time).toBe(120_000);
  });
});

describe('OMCT-C11-L2-01.03 Thumbnail selection', () => {
  it('focuses the selected frame and stops tracking the live edge', () => {
    const focus = new FocusController();

    focus.select(60_000);

    expect(focus.trackingLatest()).toBe(false);
    expect(focus.focusedFrame(FRAMES)?.time).toBe(60_000);
    expect(focus.focusedFrame([...FRAMES, frame(120_000)])?.time).toBe(60_000);
  });
});

describe('OMCT-C11-L2-01.04 Keyboard navigation', () => {
  it('steps focus to the adjacent frame in either direction', () => {
    const focus = new FocusController();
    focus.select(60_000);

    focus.step(FRAMES, -1);
    expect(focus.focusedFrame(FRAMES)?.time).toBe(30_000);

    focus.step(FRAMES, 1);
    focus.step(FRAMES, 1);
    expect(focus.focusedFrame(FRAMES)?.time).toBe(90_000);
  });

  it('no-ops at the history edges', () => {
    const focus = new FocusController();
    focus.select(30_000);

    focus.step(FRAMES, -1);
    expect(focus.focusedFrame(FRAMES)?.time).toBe(30_000);
  });

  it('re-joins the live edge through followLatest', () => {
    const focus = new FocusController();
    focus.select(30_000);

    focus.followLatest();

    expect(focus.trackingLatest()).toBe(true);
    expect(focus.focusedFrame(FRAMES)?.time).toBe(90_000);
  });
});
