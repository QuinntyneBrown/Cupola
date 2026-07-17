import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomainObject, SelectionService } from '@cupola/core';

import { AnnotationsLayerComponent, FrameAnnotation } from './annotations-layer.component';

/** jsdom lacks PointerEvent; MouseEvent with the pointer event type suffices. */
function pointerEvent(type: string, init: MouseEventInit = {}): MouseEvent {
  return new MouseEvent(type, { bubbles: true, ...init });
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

const ANNOTATIONS: FrameAnnotation[] = [
  { keyString: 'ann-img-1', text: 'Debris', rectangle: { x: 0.1, y: 0.1, w: 0.2, h: 0.2 } },
  { keyString: 'ann-img-2', text: 'Glint', rectangle: { x: 0.6, y: 0.6, w: 0.2, h: 0.2 } },
];

function setup(annotations: FrameAnnotation[] = ANNOTATIONS) {
  TestBed.configureTestingModule({});
  const fixture: ComponentFixture<AnnotationsLayerComponent> = TestBed.createComponent(
    AnnotationsLayerComponent,
  );
  fixture.componentRef.setInput('annotations', annotations);
  fixture.componentRef.setInput('object', camera());
  fixture.detectChanges();
  return { fixture, selection: TestBed.inject(SelectionService) };
}

describe('OMCT-C11-L2-03.02 Pixel-spatial annotation display', () => {
  it('renders annotation rectangles at the stored normalized coordinates', () => {
    const { fixture } = setup();

    const rects = [...fixture.nativeElement.querySelectorAll('[data-testid="image-annotation"]')];
    expect(rects).toHaveLength(2);
    expect((rects[0] as HTMLElement).style.left).toBe('10%');
    expect((rects[0] as HTMLElement).style.width).toBe('20%');
    expect(rects[0].textContent).toContain('Debris');
  });
});

describe('OMCT-C11-L2-03.03 Pixel-spatial annotation selection', () => {
  it('publishes a clicked annotation through application selection', () => {
    const { fixture, selection } = setup();

    const first = fixture.nativeElement.querySelector(
      '[data-key="ann-img-1"]',
    ) as HTMLElement;
    first.dispatchEvent(pointerEvent('pointerdown'));
    fixture.detectChanges();

    expect(selection.selected()).toHaveLength(1);
    expect(selection.selected()[0].context).toMatchObject({
      key: 'ann-img-1',
      type: 'image-annotation',
    });
    expect(first.classList).toContain('is-selected');
  });

  it('selects every annotation intersecting a marquee region without toggling off', () => {
    const { fixture, selection } = setup();
    const layer: HTMLElement = fixture.nativeElement;
    jest.spyOn(layer, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    layer.setPointerCapture = jest.fn();

    layer.dispatchEvent(pointerEvent('pointerdown', { clientX: 5, clientY: 5, bubbles: false }));
    layer.dispatchEvent(pointerEvent('pointermove', { clientX: 90, clientY: 90, bubbles: false }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="image-marquee"]')).toBeTruthy();
    layer.dispatchEvent(pointerEvent('pointerup', { clientX: 90, clientY: 90, bubbles: false }));
    fixture.detectChanges();

    expect(selection.selected().map((item) => item.context.key)).toEqual([
      'ann-img-1',
      'ann-img-2',
    ]);
  });
});
