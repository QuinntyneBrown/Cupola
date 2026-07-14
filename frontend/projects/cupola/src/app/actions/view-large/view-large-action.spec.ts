import { EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActionContext, DomainObject } from '@cupola/core';
import { Overlay, OverlayConfig, OverlayService } from '@cupola/components';

import { PreviewService } from './preview.service';
import { ViewLargeAction } from './view-large-action';

function context(overrides: Partial<ActionContext> = {}): ActionContext {
  const object: DomainObject = {
    identifier: { namespace: '', key: 'plot' },
    keyString: 'plot',
    name: 'Plot',
    type: 'overlay-plot',
    location: null,
    composition: [],
  };
  return { objectPath: [object], viewParentElement: document.createElement('div'), ...overrides };
}

describe('OMCT-C15-L2-02.06 ViewLargeAction', () => {
  let action: ViewLargeAction;
  let preview: PreviewService;
  let shown: OverlayConfig | null;

  beforeEach(() => {
    preview = new PreviewService();
    shown = null;
    const overlays = {
      show(config: OverlayConfig): Overlay {
        shown = config;
        return {} as Overlay;
      },
    } as OverlayService;
    action = new ViewLargeAction(overlays, preview, TestBed.inject(EnvironmentInjector));
  });

  it('applies only when an embedded view parent element and object path exist', () => {
    expect(action.appliesTo(context())).toBe(true);
    expect(action.appliesTo(context({ viewParentElement: undefined }))).toBe(false);
    expect(action.appliesTo(context({ objectPath: [] }))).toBe(false);
  });

  it('mounts a preview in a large overlay and marks the preview active', () => {
    action.invoke(context());

    expect(preview.activePreview()).toBe(true);
    expect(shown?.size).toBe('large');
    expect(shown?.view).toBeDefined();
  });

  it('restores preview state when the overlay is destroyed', () => {
    action.invoke(context());
    expect(preview.activePreview()).toBe(true);

    shown?.onDestroy?.();

    expect(preview.activePreview()).toBe(false);
  });
});
