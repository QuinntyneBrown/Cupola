import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from '../../../support/cupola.fixture';

interface MemoryLeakData {
  routes: string[];
}

const data = JSON.parse(
  readFileSync(join(__dirname, '../../../test-data/memory-leak-detection.json'), 'utf8'),
) as MemoryLeakData;

/**
 * Navigation memory-leak test (OMCT-C16-L2-05.03). Each configured view is
 * opened and navigated away from repeatedly; after forcing garbage collection
 * the JS heap must not grow unboundedly, i.e. the departed views are collected.
 */
test.describe('C16 L1-05 — Memory', () => {
  test(
    'OMCT-C16-L2-05.03 — repeated view navigation does not retain memory',
    { annotation: [{ type: 'requirement', description: 'OMCT-C16-L2-05.03' }] },
    async ({ shell, page }) => {
      const client = await page.context().newCDPSession(page);
      await client.send('HeapProfiler.enable');

      const usedHeap = async (): Promise<number> => {
        await client.send('HeapProfiler.collectGarbage');
        const usage = (await client.send('Runtime.getHeapUsage')) as { usedSize: number };
        return usage.usedSize;
      };

      const pass = async (): Promise<void> => {
        for (const route of data.routes) {
          await shell.goto(route);
          await expect(shell.appBar).toBeVisible();
          await shell.goto('browse/mine');
          await expect(shell.appBar).toBeVisible();
        }
      };

      await shell.goto('browse/mine');
      await expect(shell.appBar).toBeVisible();

      // One warm-up pass, then a baseline; two more passes must not double the heap.
      await pass();
      const baseline = await usedHeap();
      await pass();
      await pass();
      const after = await usedHeap();

      expect(after).toBeLessThan(baseline * 2);
    },
  );
});
