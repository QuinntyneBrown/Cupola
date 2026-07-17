import { expect, test } from '../support/cupola.fixture';

const WINDOW = { start: 1783948800000, end: 1783949400000 };
const LAST_FRAME = WINDOW.end;
const PREVIOUS_FRAME = WINDOW.end - 30_000;

test.describe('C11 L1-03 — Image context and annotations', () => {
  test(
    'OMCT-C11-L2-03.01 — related telemetry exposes the latest values at or before the image time',
    { annotation: [{ type: 'requirement', description: 'OMCT-C11-L2-03.01' }] },
    async ({ shell, imagery, realtime }) => {
      await shell.goto('browse/mine/imagery-lab/cam.aft');
      await realtime.setBounds(WINDOW);

      await expect(imagery.relatedRows).toHaveCount(2);
      const timestamps = await imagery.page
        .getByTestId('imagery-related-time')
        .evaluateAll((cells) => cells.map((cell) => Date.parse(cell.textContent ?? '')));
      for (const timestamp of timestamps) {
        expect(timestamp).toBeLessThanOrEqual(LAST_FRAME);
      }
      await expect(imagery.page.getByTestId('imagery-related-value').first()).not.toHaveText(/—/);
    },
  );

  test(
    'OMCT-C11-L2-03.02 — pixel-spatial annotations render at their stored coordinates on their frame only',
    { annotation: [{ type: 'requirement', description: 'OMCT-C11-L2-03.02' }] },
    async ({ shell, imagery, realtime }) => {
      await shell.goto('browse/mine/imagery-lab/cam.aft');
      await realtime.setBounds(WINDOW);
      await expect(imagery.thumbs).toHaveCount(21);

      // The latest frame carries ann-img-1 at the stored normalized rectangle.
      await expect(imagery.annotation('ann-img-1')).toBeVisible();
      await expect(imagery.annotation('ann-img-2')).toHaveCount(0);
      const style = await imagery.annotation('ann-img-1').getAttribute('style');
      expect(style).toContain('left: 12%');
      expect(style).toContain('width: 20%');

      // The previous frame carries ann-img-2 instead.
      await imagery.thumb(PREVIOUS_FRAME).click();
      await expect(imagery.annotation('ann-img-2')).toBeVisible();
      await expect(imagery.annotation('ann-img-1')).toHaveCount(0);
    },
  );

  test(
    'OMCT-C11-L2-03.03 — click and marquee selection publish intersecting annotations',
    { annotation: [{ type: 'requirement', description: 'OMCT-C11-L2-03.03' }] },
    async ({ shell, imagery, realtime, page }) => {
      await shell.goto('browse/mine/imagery-lab/cam.aft');
      await realtime.setBounds(WINDOW);
      await expect(imagery.annotation('ann-img-1')).toBeVisible();

      await imagery.annotation('ann-img-1').click();
      await expect(imagery.annotation('ann-img-1')).toHaveClass(/is-selected/);
      await expect(imagery.annotation('ann-img-1')).toHaveAttribute('s-selected', '');

      // Marquee across the annotation's region re-selects it.
      const stage = (await imagery.stage.boundingBox())!;
      await page.mouse.move(stage.x + stage.width * 0.05, stage.y + stage.height * 0.45);
      await page.mouse.down();
      await page.mouse.move(stage.x + stage.width * 0.6, stage.y + stage.height * 0.1, {
        steps: 4,
      });
      await page.mouse.up();
      await expect(imagery.annotation('ann-img-1')).toHaveClass(/is-selected/);
    },
  );
});
