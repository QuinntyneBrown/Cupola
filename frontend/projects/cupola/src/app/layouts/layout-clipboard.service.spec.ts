import { LayoutClipboardService } from './layout-clipboard.service';
import { newLayoutItem } from './display-layout/layout-model';

describe('OMCT-C09-L2-01.05 Clipboard transfer', () => {
  it('pastes deep copies with fresh ids and a one-unit offset', () => {
    const clipboard = new LayoutClipboardService();
    const original = { ...newLayoutItem('subobject', 0), keyString: 'pwr.bus_v', x: 4, y: 6 };

    clipboard.store([original]);
    const pasted = clipboard.read();

    expect(pasted).toHaveLength(1);
    expect(pasted[0].id).not.toBe(original.id);
    expect(pasted[0]).toMatchObject({ keyString: 'pwr.bus_v', x: 5, y: 7 });
  });

  it('pastes an independent copy every time', () => {
    const clipboard = new LayoutClipboardService();
    clipboard.store([newLayoutItem('box', 0)]);

    const first = clipboard.read();
    const second = clipboard.read();

    expect(first[0].id).not.toBe(second[0].id);
    first[0].x = 99;
    expect(second[0].x).not.toBe(99);
  });

  it('reports whether it has content', () => {
    const clipboard = new LayoutClipboardService();

    expect(clipboard.hasContent()).toBe(false);
    clipboard.store([newLayoutItem('text', 0)]);
    expect(clipboard.hasContent()).toBe(true);
  });
});
