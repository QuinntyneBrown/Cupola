import { signal } from '@angular/core';
import { DomainObject } from '@cupola/core';

import { ImageFrame } from '../image-history';
import { ImageryFocusService } from '../imagery-focus.service';
import { ImageExporter, derivedImageFilename } from './image-exporter';
import { SaveImageAction } from './save-image-action';

function frame(): ImageFrame {
  return { url: '/imagery/frame-1.svg', time: 60_000, timestampIso: '1970-01-01T00:01:00.000Z' };
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

describe('OMCT-C11-L2-04.02 Save image', () => {
  it('derives a sanitized filename from the object name and capture time', () => {
    expect(derivedImageFilename('Aft camera', frame())).toBe(
      'Aft camera-1970-01-01-000100000Z.svg',
    );
    expect(derivedImageFilename('a<b>:c', frame())).toMatch(/^a_b__c-/);
    expect(
      derivedImageFilename('Cam', { ...frame(), url: '/imagery/shot' }).endsWith('.png'),
    ).toBe(true);
  });

  it('exports the focused image through the exporter', () => {
    const focus = new ImageryFocusService();
    const host = document.createElement('div');
    focus.register(host, signal<ImageFrame | null>(frame()).asReadonly());
    const exporter = { exportImage: jest.fn().mockResolvedValue(undefined) };
    const action = new SaveImageAction(focus, exporter as unknown as ImageExporter);
    const context = { objectPath: [camera()], viewKey: 'imagery', viewParentElement: host };

    expect(action.appliesTo(context)).toBe(true);
    action.invoke(context);

    expect(exporter.exportImage).toHaveBeenCalledWith('Aft camera', frame());
  });

  it('does not apply without a focused frame', () => {
    const focus = new ImageryFocusService();
    const host = document.createElement('div');
    focus.register(host, signal<ImageFrame | null>(null).asReadonly());
    const action = new SaveImageAction(focus, { exportImage: jest.fn() } as unknown as ImageExporter);

    expect(
      action.appliesTo({ objectPath: [camera()], viewKey: 'imagery', viewParentElement: host }),
    ).toBe(false);
  });
});
