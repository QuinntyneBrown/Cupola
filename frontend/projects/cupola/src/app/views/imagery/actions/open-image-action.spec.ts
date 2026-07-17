import { signal } from '@angular/core';
import { DomainObject } from '@cupola/core';

import { ImageFrame } from '../image-history';
import { ImageryFocusService } from '../imagery-focus.service';
import { OpenImageAction } from './open-image-action';

function frame(url: string): ImageFrame {
  return { url, time: 60_000, timestampIso: new Date(60_000).toISOString() };
}

function camera(): DomainObject {
  return {
    identifier: { namespace: '', key: 'cam.aft' },
    keyString: 'cam.aft',
    name: 'Aft camera',
    type: 'telemetry',
    location: null,
    composition: [],
    telemetry: { hints: ['image'] },
  };
}

function setup(focused: ImageFrame | null) {
  const focus = new ImageryFocusService();
  const host = document.createElement('div');
  focus.register(host, signal(focused).asReadonly());
  const action = new OpenImageAction(focus);
  const context = { objectPath: [camera()], viewKey: 'imagery', viewParentElement: host };
  return { action, context };
}

describe('OMCT-C11-L2-04.01 Open image in new tab', () => {
  afterEach(() => jest.restoreAllMocks());

  it('opens the focused URL isolated from the opener', () => {
    const open = jest.spyOn(window, 'open').mockReturnValue(null);
    const { action, context } = setup(frame('/imagery/frame-1.svg'));

    expect(action.appliesTo(context)).toBe(true);
    action.invoke(context);

    expect(open).toHaveBeenCalledWith('/imagery/frame-1.svg', '_blank', 'noopener,noreferrer');
  });

  it('does not apply to blocked URLs or other views', () => {
    // eslint-disable-next-line no-script-url
    const { action, context } = setup(frame('javascript:alert(1)'));

    expect(action.appliesTo(context)).toBe(false);
    expect(action.appliesTo({ ...context, viewKey: 'plot' })).toBe(false);
  });

  it('never opens anything for a blocked URL', () => {
    const open = jest.spyOn(window, 'open').mockReturnValue(null);
    const { action, context } = setup(frame('//evil.example/x.png'));

    action.invoke(context);

    expect(open).not.toHaveBeenCalled();
  });
});
