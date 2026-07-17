import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { DomainObject, ObjectApi, ObjectUpdatesService } from '@cupola/core';

import { StyleRuleManager } from '../../conditions/presentation/style-rule-manager.service';
import { ViewConfigService } from '../../telemetry-view/view-config.service';
import { LayoutEditService } from '../layout-edit.service';
import { FlexibleLayoutConfiguration, flexibleId } from './flexible-model';
import { FlexibleLayoutViewComponent } from './flexible-layout-view.component';

function domainObject(key: string, over: Partial<DomainObject> = {}): DomainObject {
  return {
    identifier: { namespace: '', key },
    keyString: key,
    name: key,
    type: 'flexible-layout',
    location: null,
    composition: [],
    ...over,
  };
}

function twoPaneConfig(): FlexibleLayoutConfiguration {
  return {
    rowsLayout: true,
    containers: [
      {
        id: flexibleId(),
        size: 60,
        frames: [
          { id: 'f-a', keyString: 'pwr.bus_v', size: 70 },
          {
            id: 'f-b',
            keyString: 'pwr.array_out',
            size: 30,
            styles: { backgroundColor: 'rgb(20, 40, 60)' },
          },
        ],
      },
      { id: flexibleId(), size: 40, frames: [{ id: 'f-c', keyString: 'cam.cupola', size: 100 }] },
    ],
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

class ObjectApiStub {
  save = jest.fn(async (object: DomainObject) => ({
    keyString: object.keyString,
    outcome: 'updated',
    object,
  }));
  get(): Promise<DomainObject> {
    return Promise.reject(new Error('unused'));
  }
}

function setup(object: DomainObject) {
  const updates = new ObjectUpdatesStub();
  const viewConfig = new ViewConfigStub();
  const objectApi = new ObjectApiStub();
  TestBed.configureTestingModule({
    providers: [
      { provide: ObjectUpdatesService, useValue: updates },
      { provide: ViewConfigService, useValue: viewConfig },
      {
        provide: ObjectApi,
        useValue: objectApi,
      },
      {
        provide: StyleRuleManager,
        useValue: {
          attach: () => ({
            style: signal({ borderColor: 'rgb(255, 0, 0)' }).asReadonly(),
            destroy: () => {},
          }),
        },
      },
    ],
  });
  const fixture: ComponentFixture<FlexibleLayoutViewComponent> = TestBed.createComponent(
    FlexibleLayoutViewComponent,
  );
  fixture.componentRef.setInput('object', object);
  fixture.detectChanges();
  return { fixture, updates, viewConfig, objectApi, edits: TestBed.inject(LayoutEditService) };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await flush();
  await flush();
  fixture.detectChanges();
}

describe('OMCT-C09-L2-02.01 Flexible-layout rendering', () => {
  it('places each configured child in its assigned pane', async () => {
    const { fixture } = setup(
      domainObject('fl.station', {
        composition: ['pwr.bus_v', 'pwr.array_out', 'cam.cupola'],
        configuration: { flexible: twoPaneConfig() },
      }),
    );
    await settle(fixture);

    const element: HTMLElement = fixture.nativeElement;
    const containers = element.querySelectorAll('[data-testid="fl-container"]');
    expect(containers).toHaveLength(2);
    const firstContainerKeys = [...containers[0].querySelectorAll('[data-testid="fl-pane"]')].map(
      (pane) => pane.getAttribute('data-key'),
    );
    expect(firstContainerKeys).toEqual(['pwr.bus_v', 'pwr.array_out']);
    expect(containers[1].querySelector('[data-testid="fl-pane"]')?.getAttribute('data-key')).toBe(
      'cam.cupola',
    );
  });
});

describe('OMCT-C09-L2-02.02 Pane editing', () => {
  it('persists each pane control invocation immediately', async () => {
    const { fixture, viewConfig, edits } = setup(
      domainObject('fl.station', {
        composition: ['pwr.bus_v', 'pwr.array_out', 'cam.cupola'],
        configuration: { flexible: twoPaneConfig() },
      }),
    );
    await settle(fixture);
    edits.beginEdit('fl.station');
    await settle(fixture);
    const session = edits.session('fl.station')!;

    session.addContainer?.();
    await settle(fixture);
    expect(viewConfig.write).toHaveBeenCalledTimes(1);
    const afterAdd = viewConfig.write.mock.calls[0][2] as FlexibleLayoutConfiguration;
    expect(afterAdd.containers).toHaveLength(3);

    session.toggleOrientation?.();
    await settle(fixture);
    expect(viewConfig.write).toHaveBeenCalledTimes(2);
    expect((viewConfig.write.mock.calls[1][2] as FlexibleLayoutConfiguration).rowsLayout).toBe(
      false,
    );
  });

  it('removes the selected frame and its composition entry in one save', async () => {
    const object = domainObject('fl.station', {
      composition: ['pwr.bus_v', 'pwr.array_out', 'cam.cupola'],
      configuration: { flexible: twoPaneConfig() },
    });
    const { fixture, objectApi, edits } = setup(object);
    await settle(fixture);
    edits.beginEdit('fl.station');
    await settle(fixture);

    (fixture.nativeElement.querySelector('[data-frame-id="f-a"]') as HTMLElement).click();
    await settle(fixture);
    edits.session('fl.station')!.removeFrame?.();
    await settle(fixture);

    expect(objectApi.save).toHaveBeenCalledTimes(1);
    const saved = objectApi.save.mock.calls[0][0] as DomainObject;
    const config = saved.configuration?.['flexible'] as FlexibleLayoutConfiguration;
    expect(config.containers[0].frames.map((frame) => frame.keyString)).toEqual(['pwr.array_out']);
    expect(saved.composition).toEqual(['pwr.array_out', 'cam.cupola']);
  });
});

describe('OMCT-C09-L2-02.03 Flexible-layout style configuration', () => {
  it('applies saved frame styles and the object-level conditional style', async () => {
    const { fixture } = setup(
      domainObject('fl.station', {
        composition: ['pwr.bus_v', 'pwr.array_out', 'cam.cupola'],
        configuration: { flexible: twoPaneConfig(), objectStyles: { conditionSetKeyString: 'cs', enabled: true, styles: [] } },
      }),
    );
    await settle(fixture);

    const element: HTMLElement = fixture.nativeElement;
    const styledPane = element.querySelector('[data-frame-id="f-b"]') as HTMLElement;
    expect(styledPane.style.backgroundColor).toBe('rgb(20, 40, 60)');
    expect(styledPane.classList).toContain('fl-pane--styled');
    const canvas = element.querySelector('[data-testid="fl-canvas"]') as HTMLElement;
    expect(canvas.style.borderColor).toBe('rgb(255, 0, 0)');
  });
});
