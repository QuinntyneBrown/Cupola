import { Signal, computed, signal } from '@angular/core';
import { DomainObject, ImageLayerDefinition, ObjectApi } from '@cupola/core';

import { ViewConfigService } from '../../telemetry-view/view-config.service';

/** A renderable overlay layer with its current visibility. */
export interface LayerState extends ImageLayerDefinition {
  visible: boolean;
}

interface ImageryConfiguration {
  layerVisibility?: Record<string, boolean>;
  [key: string]: unknown;
}

/**
 * Merges metadata-declared image layers with the per-object persisted
 * visibility, persisting toggles at `configuration.imagery.layerVisibility`
 * only when the object supports mutation (OMCT-C11-L2-02.04); otherwise
 * toggles stay in-memory for the session.
 */
export class LayerStore {
  private readonly overrides = signal<Record<string, boolean>>({});

  readonly layers: Signal<LayerState[]>;

  constructor(
    private object: DomainObject,
    private readonly definitions: ImageLayerDefinition[],
    private readonly viewConfig: ViewConfigService,
    private readonly objects: Pick<ObjectApi, 'supportsMutation'>,
  ) {
    const persisted =
      (object.configuration?.['imagery'] as ImageryConfiguration | undefined)?.layerVisibility ??
      {};
    this.overrides.set({ ...persisted });
    this.layers = computed(() =>
      this.definitions.map((definition) => ({
        ...definition,
        visible: this.overrides()[definition.key] ?? definition.visible ?? false,
      })),
    );
  }

  visibleLayers(): LayerState[] {
    return this.layers().filter((layer) => layer.visible);
  }

  /** Toggles a layer, persisting the visibility map when the object is mutable. */
  async toggle(key: string): Promise<void> {
    const current = this.layers().find((layer) => layer.key === key);
    if (!current) {
      return;
    }
    const next = { ...this.overrides(), [key]: !current.visible };
    this.overrides.set(next);
    if (this.objects.supportsMutation(this.object)) {
      this.object = await this.viewConfig.update<ImageryConfiguration>(
        this.object,
        'imagery',
        (imagery) => ({ ...imagery, layerVisibility: next }),
      );
    }
  }
}
