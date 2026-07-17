import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  DomainObject,
  ObjectApi,
  ObjectStyleConfiguration,
  ObjectUpdatesService,
  SelectionService,
  StyleProperties,
} from '@cupola/core';

import { StyleRuleManager, StyleBinding } from '../../conditions/presentation/style-rule-manager.service';
import { ViewConfigService } from '../../telemetry-view/view-config.service';
import { EmbeddedObjectViewComponent } from '../embedded/embedded-object-view.component';
import { LayoutEditService, LayoutEditSession } from '../layout-edit.service';
import {
  FlexibleLayoutConfiguration,
  addContainer,
  emptyFlexibleConfiguration,
  reconcileFrames,
  removeContainer,
  removeFrame,
  resizePair,
  setOrientation,
} from './flexible-model';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

interface SplitterDrag {
  scope: 'containers' | 'frames';
  containerId?: string;
  index: number;
  start: number;
  extent: number;
  originSizes: number[];
}

/**
 * The flexible layout (OMCT-C09-L2-02.01–02.03): resizable pane containers
 * hosting composed object views. Pane edits persist immediately per control
 * invocation; saved background/border/text styles apply to their panes.
 */
@Component({
  selector: 'cp-flexible-layout-view',
  templateUrl: './flexible-layout-view.component.html',
  styleUrl: './flexible-layout-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmbeddedObjectViewComponent],
})
export class FlexibleLayoutViewComponent {
  private readonly updates = inject(ObjectUpdatesService);
  private readonly objectApi = inject(ObjectApi);
  private readonly viewConfig = inject(ViewConfigService);
  private readonly selection = inject(SelectionService);
  private readonly editService = inject(LayoutEditService);
  private readonly styleRules = inject(StyleRuleManager);

  readonly object = input.required<DomainObject>();
  readonly objectPath = input<DomainObject[]>([]);

  private readonly currentObject = signal<DomainObject | null>(null);
  /** Live copy during a splitter drag; null otherwise. */
  private readonly liveConfig = signal<FlexibleLayoutConfiguration | null>(null);
  protected readonly selectedFrameId = signal<string | null>(null);
  private readonly objectStyleBinding = signal<StyleBinding | null>(null);

  protected readonly editing = computed(
    () => this.editService.editingKey() === this.object().keyString,
  );

  protected readonly config = computed<FlexibleLayoutConfiguration>(() => {
    const live = this.liveConfig();
    if (live) {
      return live;
    }
    const object = this.currentObject() ?? this.object();
    return (
      (object.configuration?.['flexible'] as FlexibleLayoutConfiguration) ??
      emptyFlexibleConfiguration()
    );
  });

  /** Object-level conditional style (B09), applied to the canvas root. */
  protected readonly canvasStyle = computed<StyleProperties>(
    () => this.objectStyleBinding()?.style() ?? {},
  );

  private drag: SplitterDrag | null = null;
  private saving = false;

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      this.currentObject.set(object);
      const subscription = this.updates.forKeyString(object.keyString).subscribe((updated) => {
        this.currentObject.set(updated);
      });
      onCleanup(() => subscription.unsubscribe());
    });

    // Frame/composition synchronization mirrors the display layout's.
    effect(() => {
      const object = this.currentObject();
      if (!object || this.saving || this.liveConfig()) {
        return;
      }
      const { config, changed } = reconcileFrames(this.config(), object.composition ?? []);
      if (changed) {
        void this.persist(config);
      }
    });

    // The binding is written but never read here — reading it would retrigger
    // this effect on its own write. The cleanup owns each binding's teardown.
    effect((onCleanup) => {
      const objectStyles = (this.currentObject() ?? this.object()).configuration?.[
        'objectStyles'
      ] as ObjectStyleConfiguration | undefined;
      const binding = objectStyles ? this.styleRules.attach(objectStyles) : null;
      this.objectStyleBinding.set(binding);
      onCleanup(() => binding?.destroy());
    });

    const session: LayoutEditSession = {
      selectedItemIds: computed(() => {
        const selected = this.selectedFrameId();
        return selected ? [selected] : [];
      }),
      addContainer: () => void this.persist(addContainer(this.config())),
      removeContainer: () => void this.removeLastContainer(),
      removeFrame: () => void this.removeSelectedFrame(),
      toggleOrientation: () =>
        void this.persist(setOrientation(this.config(), !this.config().rowsLayout)),
      save: async () => this.editService.endEdit(this.object().keyString),
      cancel: () => this.editService.endEdit(this.object().keyString),
    };
    effect((onCleanup) => {
      const keyString = this.object().keyString;
      this.editService.register(keyString, session);
      onCleanup(() => this.editService.unregister(keyString));
    });
  }

  removeSelectedFrame(): Promise<void> {
    const frameId = this.selectedFrameId();
    if (!frameId) {
      return Promise.resolve();
    }
    // Removing a frame also removes its child from composition in the same
    // save; otherwise the frame/composition reconciler would resurrect it.
    const removedKey = this.config()
      .containers.flatMap((container) => container.frames)
      .find((frame) => frame.id === frameId)?.keyString;
    const object = this.currentObject() ?? this.object();
    const composition = removedKey
      ? (object.composition ?? []).filter((keyString) => keyString !== removedKey)
      : undefined;
    this.selectedFrameId.set(null);
    return this.persist(removeFrame(this.config(), frameId), composition);
  }

  removeLastContainer(): Promise<void> {
    const containers = this.config().containers;
    if (containers.length <= 1) {
      return Promise.resolve();
    }
    const removed = containers[containers.length - 1];
    const removedKeys = new Set(removed.frames.map((frame) => frame.keyString));
    const object = this.currentObject() ?? this.object();
    const composition =
      removedKeys.size > 0
        ? (object.composition ?? []).filter((keyString) => !removedKeys.has(keyString))
        : undefined;
    return this.persist(removeContainer(this.config(), removed.id), composition);
  }

  protected frameStyle(styles: StyleProperties | undefined): Record<string, string | null> {
    return {
      'background-color': styles?.backgroundColor ?? null,
      'border-color': styles?.borderColor ?? null,
      color: styles?.color ?? null,
      visibility: styles?.visibility ?? null,
    };
  }

  protected selectFrame(event: Event, frameId: string, keyString: string): void {
    event.stopPropagation();
    this.selectedFrameId.set(frameId);
    const object = this.currentObject() ?? this.object();
    this.selection.select({
      element: event.currentTarget as HTMLElement,
      context: { key: `${object.keyString}:${frameId}`, label: keyString, object, type: 'flexible-frame' },
    });
  }

  protected onSplitterPointerDown(
    event: PointerEvent,
    scope: 'containers' | 'frames',
    index: number,
    containerId?: string,
  ): void {
    if (!this.editing()) {
      return;
    }
    event.preventDefault();
    const config = this.config();
    const horizontalMain = scope === 'frames' ? config.rowsLayout : !config.rowsLayout;
    const parent = (event.currentTarget as HTMLElement).parentElement!;
    const rect = parent.getBoundingClientRect();
    this.drag = {
      scope,
      containerId,
      index,
      start: horizontalMain ? event.clientX : event.clientY,
      extent: horizontalMain ? rect.width : rect.height,
      originSizes:
        scope === 'containers'
          ? config.containers.map((container) => container.size)
          : config.containers
              .find((container) => container.id === containerId)!
              .frames.map((frame) => frame.size),
    };
    const element = event.currentTarget as HTMLElement;
    element.setPointerCapture(event.pointerId);
    const onMove = (move: PointerEvent) => this.onSplitterMove(move, horizontalMain);
    const onUp = () => {
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerup', onUp);
      this.finishSplitterDrag();
    };
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerup', onUp);
  }

  private onSplitterMove(event: PointerEvent, horizontalMain: boolean): void {
    const drag = this.drag;
    if (!drag) {
      return;
    }
    const position = horizontalMain ? event.clientX : event.clientY;
    const delta = ((position - drag.start) / Math.max(1, drag.extent)) * 100;
    const sizes = resizePair(drag.originSizes, drag.index, Math.round(delta * 10) / 10);
    const config = clone(this.config());
    if (drag.scope === 'containers') {
      config.containers = config.containers.map((container, index) => ({
        ...container,
        size: sizes[index],
      }));
    } else {
      const container = config.containers.find((candidate) => candidate.id === drag.containerId)!;
      container.frames = container.frames.map((frame, index) => ({
        ...frame,
        size: sizes[index],
      }));
    }
    this.liveConfig.set(config);
  }

  private finishSplitterDrag(): void {
    const live = this.liveConfig();
    this.drag = null;
    if (live) {
      void this.persist(live).then(() => this.liveConfig.set(null));
    }
  }

  private async persist(
    config: FlexibleLayoutConfiguration,
    composition?: string[],
  ): Promise<void> {
    this.saving = true;
    try {
      const object = this.currentObject() ?? this.object();
      let saved: DomainObject;
      if (composition) {
        // Frame/container removals change composition and configuration in one save.
        const updated: DomainObject = {
          ...object,
          composition,
          configuration: { ...(object.configuration ?? {}), flexible: clone(config) },
        };
        const result = await this.objectApi.save(updated);
        saved = result.object ?? updated;
      } else {
        saved = await this.viewConfig.write(object, 'flexible', config);
      }
      this.currentObject.set(saved);
      this.updates.emitLocal(saved);
    } finally {
      this.saving = false;
    }
  }
}
