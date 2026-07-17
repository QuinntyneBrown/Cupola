import { DomainObject, ImageLayerDefinition } from '@cupola/core';

import { ViewConfigService } from '../../telemetry-view/view-config.service';
import { LayerStore } from './layer-store';

const DEFINITIONS: ImageLayerDefinition[] = [
  { key: 'reticle', name: 'Reticle grid', source: '/imagery/layers/reticle.svg', visible: true },
  { key: 'horizon', name: 'Horizon limb', source: '/imagery/layers/horizon.svg' },
];

function camera(over: Partial<DomainObject> = {}): DomainObject {
  return {
    identifier: { namespace: '', key: 'cam.aft' },
    keyString: 'cam.aft',
    name: 'Aft camera',
    type: 'telemetry',
    location: null,
    composition: [],
    telemetry: { hints: ['image'] },
    ...over,
  };
}

class ViewConfigStub {
  update = jest.fn(
    async (
      object: DomainObject,
      family: string,
      mutate: (current: Record<string, unknown>) => Record<string, unknown>,
    ): Promise<DomainObject> => ({
      ...object,
      configuration: {
        ...(object.configuration ?? {}),
        [family]: mutate((object.configuration?.[family] as Record<string, unknown>) ?? {}),
      },
    }),
  );
}

describe('OMCT-C11-L2-02.04 Image layers', () => {
  it('renders declared layers with their default and persisted visibility', () => {
    const store = new LayerStore(
      camera({ configuration: { imagery: { layerVisibility: { horizon: true } } } }),
      DEFINITIONS,
      new ViewConfigStub() as unknown as ViewConfigService,
      { supportsMutation: () => true },
    );

    expect(store.layers().map((layer) => [layer.key, layer.visible])).toEqual([
      ['reticle', true],
      ['horizon', true],
    ]);
  });

  it('persists a toggle when the object supports mutation', async () => {
    const viewConfig = new ViewConfigStub();
    const store = new LayerStore(
      camera(),
      DEFINITIONS,
      viewConfig as unknown as ViewConfigService,
      { supportsMutation: () => true },
    );

    await store.toggle('reticle');

    expect(store.visibleLayers().map((layer) => layer.key)).toEqual([]);
    expect(viewConfig.update).toHaveBeenCalledTimes(1);
    const mutate = viewConfig.update.mock.calls[0][2];
    expect(mutate({})).toEqual({ layerVisibility: { reticle: false } });
  });

  it('keeps toggles in-memory only when the object is immutable', async () => {
    const viewConfig = new ViewConfigStub();
    const store = new LayerStore(
      camera(),
      DEFINITIONS,
      viewConfig as unknown as ViewConfigService,
      { supportsMutation: () => false },
    );

    await store.toggle('horizon');

    expect(store.visibleLayers().map((layer) => layer.key)).toEqual(['reticle', 'horizon']);
    expect(viewConfig.update).not.toHaveBeenCalled();
  });
});
