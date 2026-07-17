import { TestBed } from '@angular/core/testing';
import { EMPTY, of } from 'rxjs';
import {
  ActionRegistry,
  AnnotationService,
  DefaultMetadataProvider,
  DomainObject,
  MetadataRegistry,
  ObjectsGateway,
  ViewRegistry,
} from '@cupola/core';

import { IMAGE_PIXEL_ANNOTATION_TYPE, registerImagery } from './register-imagery';

const gatewayStub = {
  getObject: () => EMPTY,
  getComposition: () => of([]),
  getAnnotations: () => of([]),
  updateObject: () => EMPTY,
  saveObject: () => EMPTY,
  getObjects: () => EMPTY,
  saveObjects: () => of([]),
};

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

describe('OMCT-C11-L2-01.01 Imagery applicability — registration', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ObjectsGateway, useValue: gatewayStub }],
    });
    TestBed.inject(MetadataRegistry).addProvider(new DefaultMetadataProvider());
    TestBed.runInInjectionContext(() => registerImagery());
  });

  it('offers the imagery view for image-hinted telemetry', () => {
    const keys = TestBed.inject(ViewRegistry)
      .applicableViews(camera(), [])
      .map((provider) => provider.key);

    expect(keys).toContain('imagery');
  });

  it('registers the extraction actions', () => {
    const actions = TestBed.inject(ActionRegistry);

    expect(actions.getAction('imagery.open-image')).toBeTruthy();
    expect(actions.getAction('imagery.save-image')).toBeTruthy();
  });

  it('registers the pixel-spatial annotation type with its target comparator', () => {
    const annotations = TestBed.inject(AnnotationService);

    expect(annotations.isKnownType(IMAGE_PIXEL_ANNOTATION_TYPE)).toBe(true);
    const a = { keyString: 'cam.aft', detail: { time: 60_000, rectangle: { x: 0 } } };
    const b = { keyString: 'cam.aft', detail: { time: 60_000, rectangle: { x: 0.5 } } };
    const c = { keyString: 'cam.aft', detail: { time: 90_000 } };

    expect(annotations.targetsMatch(IMAGE_PIXEL_ANNOTATION_TYPE, a, b)).toBe(true);
    expect(annotations.targetsMatch(IMAGE_PIXEL_ANNOTATION_TYPE, a, c)).toBe(false);
  });
});
