import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import {
  CompositionApi,
  DomainObject,
  ObjectApi,
  ObjectUpdatesService,
} from '@cupola/core';

import { StyleRuleManager } from '../../conditions/presentation/style-rule-manager.service';
import { ViewConfigService } from '../../telemetry-view/view-config.service';
import { LayoutClipboardService } from '../layout-clipboard.service';
import { LayoutEditService } from '../layout-edit.service';
import { DisplayLayoutViewComponent } from './display-layout-view.component';
import { LayoutConfiguration, newLayoutItem } from './layout-model';

function domainObject(key: string, over: Partial<DomainObject> = {}): DomainObject {
  return {
    identifier: { namespace: '', key },
    keyString: key,
    name: key,
    type: 'layout',
    location: null,
    composition: [],
    ...over,
  };
}

class ObjectUpdatesStub {
  readonly subject = new Subject<DomainObject>();
  forKeyString() {
    return this.subject.asObservable();
  }
  emitLocal = jest.fn();
}

class ViewConfigStub {
  write = jest.fn(
    async (object: DomainObject, family: string, value: unknown): Promise<DomainObject> => ({
      ...object,
      configuration: { ...(object.configuration ?? {}), [family]: value },
    }),
  );
}

class CompositionApiStub {
  added: string[] = [];
  get() {
    return {
      add: (child: DomainObject) => {
        this.added.push(child.keyString);
        return Promise.resolve();
      },
    };
  }
}

class ObjectApiStub {
  known = new Map<string, DomainObject>();
  get(keyString: string): Promise<DomainObject> {
    const object = this.known.get(keyString);
    return object ? Promise.resolve(object) : Promise.reject(new Error('missing'));
  }
}

interface Harness {
  fixture: ComponentFixture<DisplayLayoutViewComponent>;
  updates: ObjectUpdatesStub;
  viewConfig: ViewConfigStub;
  compositionApi: CompositionApiStub;
  objectApi: ObjectApiStub;
  edits: LayoutEditService;
  clipboard: LayoutClipboardService;
}

function setup(object: DomainObject): Harness {
  const updates = new ObjectUpdatesStub();
  const viewConfig = new ViewConfigStub();
  const compositionApi = new CompositionApiStub();
  const objectApi = new ObjectApiStub();
  TestBed.configureTestingModule({
    providers: [
      { provide: ObjectUpdatesService, useValue: updates },
      { provide: ViewConfigService, useValue: viewConfig },
      { provide: CompositionApi, useValue: compositionApi },
      { provide: ObjectApi, useValue: objectApi },
      {
        provide: StyleRuleManager,
        useValue: { attach: () => ({ style: signal({}).asReadonly(), destroy: () => {} }) },
      },
    ],
  });
  const fixture = TestBed.createComponent(DisplayLayoutViewComponent);
  fixture.componentRef.setInput('object', object);
  fixture.detectChanges();
  return {
    fixture,
    updates,
    viewConfig,
    compositionApi,
    objectApi,
    edits: TestBed.inject(LayoutEditService),
    clipboard: TestBed.inject(LayoutClipboardService),
  };
}

function layoutConfig(items: LayoutConfiguration['items']): Record<string, unknown> {
  return { layout: { items } };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await flush();
  await flush();
  fixture.detectChanges();
}

describe('OMCT-C09-L2-01.01 Display-layout type and view', () => {
  it('renders the canvas with one frame per configured item', async () => {
    const items = [
      { ...newLayoutItem('text', 0), text: 'Station' },
      newLayoutItem('box', 1),
    ];
    const { fixture } = setup(domainObject('dl.station', { configuration: layoutConfig(items) }));
    await settle(fixture);

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('[data-testid="dl-canvas"]')).toBeTruthy();
    expect(element.querySelectorAll('[data-testid="dl-frame"]')).toHaveLength(2);
    expect(element.querySelector('[data-kind="text"]')?.textContent).toContain('Station');
  });
});

describe('OMCT-C09-L2-01.02 Composition and item synchronization', () => {
  it('adds an item and persists when a composed child has none', async () => {
    const { fixture, viewConfig } = setup(
      domainObject('dl.station', {
        composition: ['pwr.bus_v'],
        configuration: layoutConfig([]),
      }),
    );
    await settle(fixture);

    expect(viewConfig.write).toHaveBeenCalledTimes(1);
    const [, family, value] = viewConfig.write.mock.calls[0];
    expect(family).toBe('layout');
    expect((value as LayoutConfiguration).items[0]).toMatchObject({
      kind: 'subobject',
      keyString: 'pwr.bus_v',
    });
  });

  it('drops the item and persists when its child leaves composition', async () => {
    const item = { ...newLayoutItem('subobject', 0), keyString: 'pwr.bus_v' };
    const object = domainObject('dl.station', {
      composition: ['pwr.bus_v'],
      configuration: layoutConfig([item]),
    });
    const { fixture, updates, viewConfig } = setup(object);
    await settle(fixture);
    expect(viewConfig.write).not.toHaveBeenCalled();

    updates.subject.next({ ...object, composition: [] });
    await settle(fixture);

    expect(viewConfig.write).toHaveBeenCalledTimes(1);
    expect((viewConfig.write.mock.calls[0][2] as LayoutConfiguration).items).toHaveLength(0);
  });
});

describe('OMCT-C09-L2-01.03 Item geometry', () => {
  it('saves the edited draft geometry once on commit', async () => {
    const item = { ...newLayoutItem('box', 0), x: 2, y: 2 };
    const object = domainObject('dl.station', { configuration: layoutConfig([item]) });
    const { fixture, edits, viewConfig } = setup(object);
    await settle(fixture);

    edits.beginEdit('dl.station');
    await settle(fixture);
    const session = edits.session('dl.station')!;
    fixture.componentInstance.selectedItemIds.set([item.id]);
    session.reorderStack?.('forward');
    await session.save();
    await settle(fixture);

    expect(viewConfig.write).toHaveBeenCalledTimes(1);
    expect(edits.editingKey()).toBeNull();
  });

  it('discards the draft on cancel without persisting', async () => {
    const item = newLayoutItem('box', 0);
    const object = domainObject('dl.station', { configuration: layoutConfig([item]) });
    const { fixture, edits, viewConfig } = setup(object);
    await settle(fixture);

    edits.beginEdit('dl.station');
    await settle(fixture);
    edits.session('dl.station')!.cancel();
    await settle(fixture);

    expect(viewConfig.write).not.toHaveBeenCalled();
    expect(edits.editingKey()).toBeNull();
  });
});

describe('OMCT-C09-L2-01.05 Clipboard transfer', () => {
  it('pastes copied items with fresh ids and repairs composition on save', async () => {
    const source = { ...newLayoutItem('subobject', 0), keyString: 'cam.cupola' };
    const object = domainObject('dl.station', {
      composition: [],
      configuration: layoutConfig([]),
    });
    const { fixture, edits, clipboard, compositionApi, objectApi, viewConfig } = setup(object);
    objectApi.known.set('cam.cupola', domainObject('cam.cupola', { type: 'telemetry' }));
    objectApi.known.set('dl.station', object);
    await settle(fixture);

    clipboard.store([source]);
    edits.beginEdit('dl.station');
    await settle(fixture);
    const session = edits.session('dl.station')!;
    session.paste?.();
    await settle(fixture);

    const frames = fixture.nativeElement.querySelectorAll('[data-testid="dl-frame"]');
    expect(frames).toHaveLength(1);
    expect(frames[0].getAttribute('data-item-id')).not.toBe(source.id);

    await session.save();
    expect(compositionApi.added).toEqual(['cam.cupola']);
    const savedItems = (viewConfig.write.mock.calls[0][2] as LayoutConfiguration).items;
    expect(savedItems).toHaveLength(1);
    expect(savedItems[0].keyString).toBe('cam.cupola');
  });
});
