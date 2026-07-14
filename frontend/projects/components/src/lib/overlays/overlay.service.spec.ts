import { TestBed } from '@angular/core/testing';
import { CupolaView } from '@cupola/core';

import { OverlayService } from './overlay.service';

function fakeView(): CupolaView & { shown: boolean; destroyed: boolean } {
  return {
    shown: false,
    destroyed: false,
    show() {
      this.shown = true;
    },
    destroy() {
      this.destroyed = true;
    },
  };
}

describe('OMCT-C15-L2-04.04 OverlayService', () => {
  let service: OverlayService;

  beforeEach(() => {
    service = TestBed.inject(OverlayService);
  });

  afterEach(() => {
    for (const overlay of [...service.activeOverlays()]) {
      overlay.dismiss();
    }
  });

  it('hides an auto-hide previous overlay and restores it when the new overlay is destroyed', () => {
    const first = service.show({ view: fakeView(), autoHide: true });
    const second = service.show({ view: fakeView() });

    expect(first.element.style.display).toBe('none');

    second.dismiss();
    expect(first.element.style.display).toBe('');
  });

  it('dismisses the last dismissible overlay on Escape', () => {
    const first = service.show({ view: fakeView() });
    const second = service.show({ view: fakeView() });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(service.activeOverlays()).toEqual([first]);
    void second;
  });

  it('does not dismiss a non-dismissible overlay on Escape', () => {
    service.show({ view: fakeView(), dismissible: false });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(service.activeOverlays()).toHaveLength(1);
  });
});
