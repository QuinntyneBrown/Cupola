import { EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DomainObject, ObjectApi } from '@cupola/core';
import { OverlayService } from '@cupola/components';

import { NotebookEmbedComponent } from './notebook-embed.component';

function object(keyString: string): DomainObject {
  return {
    identifier: { namespace: '', key: keyString },
    keyString,
    name: keyString,
    type: 'telemetry',
    location: null,
    composition: [],
  };
}

describe('OMCT-C13-L2-02.03 — Snapshot browsing', () => {
  it('expands a snapshot into a live-view overlay for the referenced object', async () => {
    const overlays = { show: jest.fn() };
    const objects = { getOriginalPath: jest.fn(async () => [object('pwr.bus_v')]) };

    TestBed.configureTestingModule({
      providers: [
        { provide: OverlayService, useValue: overlays },
        { provide: ObjectApi, useValue: objects },
      ],
    });

    const fixture = TestBed.createComponent(NotebookEmbedComponent);
    fixture.componentRef.setInput('embed', {
      objectKeyString: 'pwr.bus_v',
      objectName: 'Bus voltage',
      capturedAt: '2026-07-13T14:51:40Z',
    });
    fixture.detectChanges();

    // Trigger the expand and let the async object-path resolution settle.
    (fixture.componentInstance as unknown as { expand(): void }).expand();
    await Promise.resolve();
    await Promise.resolve();

    expect(objects.getOriginalPath).toHaveBeenCalledWith('pwr.bus_v');
    expect(overlays.show).toHaveBeenCalledTimes(1);
    expect(overlays.show).toHaveBeenCalledWith(
      expect.objectContaining({ size: 'large', dismissible: true }),
    );
  });
});
