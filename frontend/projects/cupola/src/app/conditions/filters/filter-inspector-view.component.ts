import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import {
  DomainObject,
  MetadataRegistry,
  ObjectApi,
  SelectedItem,
  TelemetryFilter,
  TelemetryFilterDefinition,
} from '@cupola/core';

import { FilterStore } from './filter-store.service';

/** A filterable object with its metadata-declared filter definitions. */
interface FilterTarget {
  keyString: string;
  name: string;
  definitions: TelemetryFilterDefinition[];
}

type FilterScope = 'object' | 'global';

/**
 * Renders telemetry filter controls from metadata (OMCT-C10-L2-04.01): radios
 * for single-selection enumerations, checkboxes for multi-selection, and text
 * inputs otherwise. Saved filters persist to object or global scope through the
 * filter store (OMCT-C10-L2-04.02), driving filtered requests (OMCT-C10-L2-04.03).
 */
@Component({
  selector: 'cp-filter-inspector-view',
  templateUrl: './filter-inspector-view.component.html',
  styleUrl: './filter-inspector-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterInspectorViewComponent {
  private readonly objects = inject(ObjectApi);
  private readonly metadata = inject(MetadataRegistry);
  private readonly filterStore = inject(FilterStore);

  readonly selection = input.required<SelectedItem[]>();

  protected readonly targets = signal<FilterTarget[]>([]);
  protected readonly scope = signal<FilterScope>('object');

  /** Selected values keyed by `${targetKey}::${definitionKey}`. */
  private readonly values = new Map<string, (string | number)[]>();

  constructor() {
    effect(() => {
      const object = this.selection()[0]?.context.object;
      this.values.clear();
      if (object) {
        void this.resolveTargets(object);
      } else {
        this.targets.set([]);
      }
    });
  }

  protected view(): DomainObject | undefined {
    return this.selection()[0]?.context.object;
  }

  protected setScope(scope: string): void {
    this.scope.set(scope as FilterScope);
  }

  protected controlKind(definition: TelemetryFilterDefinition): 'radio' | 'checkbox' | 'text' {
    if (!definition.possibleValues?.length) {
      return 'text';
    }
    return definition.singleSelection ? 'radio' : 'checkbox';
  }

  protected isChecked(target: FilterTarget, definition: TelemetryFilterDefinition, value: string | number): boolean {
    return this.valuesFor(target.keyString, definition.key).some((selected) => String(selected) === String(value));
  }

  protected selectRadio(target: FilterTarget, definition: TelemetryFilterDefinition, value: string | number): void {
    this.values.set(this.key(target.keyString, definition.key), [value]);
    void this.save(target);
  }

  protected toggleCheckbox(target: FilterTarget, definition: TelemetryFilterDefinition, value: string | number): void {
    const current = this.valuesFor(target.keyString, definition.key);
    const next = current.some((selected) => String(selected) === String(value))
      ? current.filter((selected) => String(selected) !== String(value))
      : [...current, value];
    this.values.set(this.key(target.keyString, definition.key), next);
    void this.save(target);
  }

  protected setText(target: FilterTarget, definition: TelemetryFilterDefinition, text: string): void {
    this.values.set(this.key(target.keyString, definition.key), text ? [text] : []);
    void this.save(target);
  }

  private valuesFor(targetKey: string, definitionKey: string): (string | number)[] {
    return this.values.get(this.key(targetKey, definitionKey)) ?? [];
  }

  private key(targetKey: string, definitionKey: string): string {
    return `${targetKey}::${definitionKey}`;
  }

  private filtersFor(target: FilterTarget): TelemetryFilter[] {
    return target.definitions
      .map((definition) => ({
        key: definition.key,
        comparator: definition.comparator,
        values: this.valuesFor(target.keyString, definition.key),
      }))
      .filter((filter) => filter.values.length > 0);
  }

  private async save(target: FilterTarget): Promise<void> {
    const view = this.view();
    if (!view) {
      return;
    }
    if (this.scope() === 'global') {
      const all = this.targets().flatMap((candidate) => this.filtersFor(candidate));
      await this.filterStore.saveGlobalFilter(view, dedupeByKey(all));
    } else {
      await this.filterStore.saveObjectFilter(view, target.keyString, this.filtersFor(target));
    }
  }

  private async resolveTargets(object: DomainObject): Promise<void> {
    if (object.composition.length === 0) {
      this.targets.set(this.targetsFor([object]));
      return;
    }
    const children = await Promise.all(object.composition.map((keyString) => this.objects.get(keyString)));
    this.targets.set(this.targetsFor(children));
  }

  private targetsFor(objects: DomainObject[]): FilterTarget[] {
    return objects
      .map((object) => ({ keyString: object.keyString, name: object.name, definitions: this.definitionsFor(object) }))
      .filter((target) => target.definitions.length > 0);
  }

  private definitionsFor(object: DomainObject): TelemetryFilterDefinition[] {
    const metadata = this.metadata.getMetadata(object);
    if (!metadata) {
      return [];
    }
    return metadata.values.flatMap((value) => value.filters ?? []);
  }
}

function dedupeByKey(filters: TelemetryFilter[]): TelemetryFilter[] {
  const byKey = new Map<string, TelemetryFilter>();
  for (const filter of filters) {
    byKey.set(filter.key, filter);
  }
  return [...byKey.values()];
}
