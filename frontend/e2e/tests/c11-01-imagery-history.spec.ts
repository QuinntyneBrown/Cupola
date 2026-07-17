import { expect, test } from '../support/cupola.fixture';

// A 10-minute fixed window on the 30 s capture grid (21 frames). The imagery
// annotations fixtures sit on the last two grid instants of this window.
const WINDOW = { start: 1783948800000, end: 1783949400000 };
const LAST_FRAME = WINDOW.end;
const PREVIOUS_FRAME = WINDOW.end - 30_000;

test.describe('C11 L1-01 — Time-based imagery presentation', () => {
  test(
    'OMCT-C11-L2-01.01 — imagery views are offered only for image-hinted telemetry',
    { annotation: [{ type: 'requirement', description: 'OMCT-C11-L2-01.01' }] },
    async ({ shell, imagery }) => {
      await shell.goto('browse/mine/imagery-lab/cam.aft');
      await expect(imagery.view).toBeVisible();

      await shell.goto('browse/station/power/pwr.bus_v');
      await expect(imagery.view).toHaveCount(0);
    },
  );

  test(
    'OMCT-C11-L2-01.02 — the most recent image within the active bounds is focused on load',
    { annotation: [{ type: 'requirement', description: 'OMCT-C11-L2-01.02' }] },
    async ({ shell, imagery, realtime }) => {
      await shell.goto('browse/mine/imagery-lab/cam.aft');
      await expect(imagery.view).toBeVisible();
      await realtime.setBounds(WINDOW);

      await expect(imagery.frameTime).toHaveText(new Date(LAST_FRAME).toISOString());
      await expect(imagery.liveBadge).toBeVisible();
      await expect(imagery.thumbs).toHaveCount(21);
      await expect(imagery.focusedImage).toHaveAttribute('src', '/imagery/frame-0.svg');
    },
  );

  test(
    'OMCT-C11-L2-01.03 — selecting a thumbnail focuses its image and timestamp',
    { annotation: [{ type: 'requirement', description: 'OMCT-C11-L2-01.03' }] },
    async ({ shell, imagery, realtime }) => {
      await shell.goto('browse/mine/imagery-lab/cam.aft');
      await realtime.setBounds(WINDOW);
      await expect(imagery.thumbs).toHaveCount(21);

      await imagery.thumb(PREVIOUS_FRAME).click();

      await expect(imagery.frameTime).toHaveText(new Date(PREVIOUS_FRAME).toISOString());
      await expect(imagery.thumb(PREVIOUS_FRAME)).toHaveClass(/is-selected/);
      await expect(imagery.focusedImage).toHaveAttribute('src', '/imagery/frame-3.svg');
      await expect(imagery.liveBadge).toHaveCount(0);
    },
  );

  test(
    'OMCT-C11-L2-01.04 — arrow keys move focus to the adjacent image',
    { annotation: [{ type: 'requirement', description: 'OMCT-C11-L2-01.04' }] },
    async ({ shell, imagery, realtime }) => {
      await shell.goto('browse/mine/imagery-lab/cam.aft');
      await realtime.setBounds(WINDOW);
      await expect(imagery.thumbs).toHaveCount(21);

      await imagery.view.press('ArrowLeft');
      await expect(imagery.frameTime).toHaveText(new Date(PREVIOUS_FRAME).toISOString());

      await imagery.view.press('ArrowLeft');
      await expect(imagery.frameTime).toHaveText(new Date(PREVIOUS_FRAME - 30_000).toISOString());

      await imagery.view.press('ArrowRight');
      await expect(imagery.frameTime).toHaveText(new Date(PREVIOUS_FRAME).toISOString());
    },
  );

  test(
    'OMCT-C11-L2-01.05 — a time strip renders image thumbnails within its bounds',
    { annotation: [{ type: 'requirement', description: 'OMCT-C11-L2-01.05' }] },
    async ({ shell, imagery, plan }) => {
      await shell.goto('browse/mine/imagery-lab/aft-strip');
      await expect(plan.strip).toBeVisible();

      await expect(imagery.trackThumbs).toHaveCount(21);
      const times = await imagery.trackThumbs.evaluateAll((thumbs) =>
        thumbs.map((thumb) => Number(thumb.getAttribute('data-time'))),
      );
      for (const time of times) {
        expect(time).toBeGreaterThanOrEqual(WINDOW.start);
        expect(time).toBeLessThanOrEqual(WINDOW.end);
      }
    },
  );
});
