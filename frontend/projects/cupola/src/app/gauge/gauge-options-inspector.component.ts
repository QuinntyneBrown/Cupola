import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DomainObject, ObjectUpdatesService, SelectedItem } from '@cupola/core';

import { ViewConfigService } from '../telemetry-view/view-config.service';
import {
  GAUGE_CONFIG_FAMILY,
  GAUGE_FORMS,
  GaugeBoundsMode,
  GaugeConfiguration,
  GaugeForm,
  readGaugeConfig,
} from './gauge-config';

/**
 * Gauge options inspector (OMCT-C08-L2-03.01/03.03): edits the gauge form, the
 * bounds mode, and the manual min/max/limit values, persisting each change to the
 * object configuration and reflecting it in the open gauge.
 */
@Component({
  selector: 'cp-gauge-options-inspector',
  standalone: true,
  templateUrl: './gauge-options-inspector.component.html',
  styleUrl: './gauge-options-inspector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GaugeOptionsInspectorComponent {
  private readonly viewConfig = inject(ViewConfigService);
  private readonly objectUpdates = inject(ObjectUpdatesService);

  readonly selection = input.required<SelectedItem[]>();

  protected readonly forms = GAUGE_FORMS;
  private readonly liveObject = signal<DomainObject | null>(null);

  private readonly selected = computed<DomainObject | null>(
    () => this.selection()[0]?.context.object ?? null,
  );
  protected readonly object = computed(() => this.liveObject() ?? this.selected());
  protected readonly config = computed<GaugeConfiguration>(() => {
    const object = this.object();
    return object ? readGaugeConfig(object) : readGaugeConfig(emptyObject());
  });

  protected setForm(event: Event): void {
    const form = (event.target as HTMLSelectElement).value as GaugeForm;
    void this.persist((config) => ({ ...config, form }));
  }

  protected setBoundsMode(event: Event): void {
    const boundsMode = (event.target as HTMLSelectElement).value as GaugeBoundsMode;
    void this.persist((config) => ({ ...config, boundsMode }));
  }

  protected setNumber(field: 'min' | 'max' | 'limitLow' | 'limitHigh', event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (!Number.isFinite(value)) {
      return;
    }
    void this.persist((config) => ({ ...config, [field]: value }));
  }

  private async persist(mutate: (config: GaugeConfiguration) => GaugeConfiguration): Promise<void> {
    const object = this.object();
    if (!object) {
      return;
    }
    const value = mutate(this.config());
    const optimistic: DomainObject = {
      ...object,
      configuration: { ...object.configuration, [GAUGE_CONFIG_FAMILY]: JSON.parse(JSON.stringify(value)) },
    };
    this.liveObject.set(optimistic);
    const saved = await this.viewConfig.write(object, GAUGE_CONFIG_FAMILY, value);
    this.liveObject.set(saved);
    this.objectUpdates.emitLocal(saved);
  }
}

function emptyObject(): DomainObject {
  return { identifier: { namespace: '', key: '' }, keyString: '', name: '', type: '', location: null, composition: [] };
}
