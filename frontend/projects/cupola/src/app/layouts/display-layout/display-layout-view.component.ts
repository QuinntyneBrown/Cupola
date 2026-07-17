import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  CompositionApi,
  DomainObject,
  ObjectApi,
  ObjectUpdatesService,
  SelectionService,
} from '@cupola/core';

import { ViewConfigService } from '../../telemetry-view/view-config.service';
import { LayoutClipboardService } from '../layout-clipboard.service';
import { LayoutEditService, LayoutEditSession } from '../layout-edit.service';
import {
  AlignEdge,
  DistributeAxis,
  ResizeHandle,
  StackDirection,
  alignItems,
  distributeItems,
  moveItems,
  reorderStack,
  resizeItem,
  rotateItems,
} from './layout-geometry';
import {
  LAYOUT_GRID_PX,
  LayoutConfiguration,
  LayoutItem,
  emptyLayoutConfiguration,
} from './layout-model';
import { reconcileLayoutItems, unresolvedReferences } from './layout-reconciler';
import { LayoutFrameComponent } from './layout-frame.component';

interface DragState {
  kind: 'move' | 'resize' | 'rotate';
  pointerId: number;
  startX: number;
  startY: number;
  originItems: LayoutItem[];
  itemId: string;
  handle?: ResizeHandle;
  startRotation?: number;
  center?: { x: number; y: number };
}

const RESIZE_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * The display-layout canvas (OMCT-C09-L2-01.01–01.05): renders configured
 * items with their embedded object views, synchronizes items with composition,
 * and hosts the per-layout edit session (draft geometry, clipboard, single
 * save on commit).
 */
@Component({
  selector: 'cp-display-layout-view',
  templateUrl: './display-layout-view.component.html',
  styleUrl: './display-layout-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LayoutFrameComponent],
})
export class DisplayLayoutViewComponent {
  private readonly objects = inject(ObjectApi);
  private readonly composition = inject(CompositionApi);
  private readonly updates = inject(ObjectUpdatesService);
  private readonly viewConfig = inject(ViewConfigService);
  private readonly selection = inject(SelectionService);
  private readonly clipboard = inject(LayoutClipboardService);
  private readonly editService = inject(LayoutEditService);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly object = input.required<DomainObject>();
  readonly objectPath = input<DomainObject[]>([]);

  protected readonly gridPx = LAYOUT_GRID_PX;
  protected readonly handles = RESIZE_HANDLES;

  /** The latest persisted object (input plus provider/local updates). */
  private readonly currentObject = signal<DomainObject | null>(null);
  /** Open edit session's working copy; null outside an edit. */
  private readonly draft = signal<LayoutConfiguration | null>(null);
  readonly selectedItemIds = signal<string[]>([]);

  protected readonly editing = computed(
    () => this.editService.editingKey() === this.object().keyString,
  );

  private readonly persistedConfiguration = computed<LayoutConfiguration>(() => {
    const object = this.currentObject() ?? this.object();
    return (object.configuration?.['layout'] as LayoutConfiguration) ?? emptyLayoutConfiguration();
  });

  protected readonly renderedItems = computed<LayoutItem[]>(() => {
    const configuration = this.draft() ?? this.persistedConfiguration();
    return [...(configuration.items ?? [])].sort((a, b) => a.z - b.z);
  });

  private drag: DragState | null = null;
  private saving = false;

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      this.currentObject.set(object);
      this.draft.set(null);
      this.selectedItemIds.set([]);
      const subscription = this.updates.forKeyString(object.keyString).subscribe((updated) => {
        this.currentObject.set(updated);
      });
      onCleanup(() => subscription.unsubscribe());
    });

    // Browse-mode composition/item synchronization (01.02). Suspended during an
    // edit; the unchanged-guard in the reconciler (plus ObjectApi's unchanged-save
    // suppression) stops write loops when our own save echoes back.
    effect(() => {
      const object = this.currentObject();
      const editing = this.editing();
      if (!object || editing || this.saving) {
        return;
      }
      const result = reconcileLayoutItems(this.persistedConfiguration(), object.composition ?? []);
      if (result.changed) {
        void this.persist(object, { items: result.items });
      }
    });

    const session: LayoutEditSession = {
      selectedItemIds: this.selectedItemIds.asReadonly(),
      align: (edge) => this.applyToDraft((items) => alignItems(items, this.selectedItemIds(), edge)),
      distribute: (axis) =>
        this.applyToDraft((items) => distributeItems(items, this.selectedItemIds(), axis)),
      reorderStack: (direction) =>
        this.applyToDraft((items) => reorderStack(items, this.selectedItemIds(), direction)),
      copy: () => this.copySelection(),
      paste: () => this.pasteClipboard(),
      save: () => this.saveDraft(),
      cancel: () => this.cancelDraft(),
    };

    effect((onCleanup) => {
      const keyString = this.object().keyString;
      this.editService.register(keyString, session);
      onCleanup(() => this.editService.unregister(keyString));
    });

    // Entering edit snapshots the persisted configuration into the draft.
    effect(() => {
      if (this.editing() && this.draft() === null) {
        this.draft.set(clone(this.persistedConfiguration()));
      }
    });

    this.destroyRef.onDestroy(() => this.endDrag());
  }

  protected isSelected(itemId: string): boolean {
    return this.selectedItemIds().includes(itemId);
  }

  protected frameTransform(item: LayoutItem): string | null {
    if (item.kind === 'line') {
      const dx = (item.x2 ?? item.x) - item.x;
      const dy = (item.y2 ?? item.y) - item.y;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      return `rotate(${angle}deg)`;
    }
    return item.rotation ? `rotate(${item.rotation}deg)` : null;
  }

  protected frameWidth(item: LayoutItem): number {
    if (item.kind === 'line') {
      const dx = (item.x2 ?? item.x) - item.x;
      const dy = (item.y2 ?? item.y) - item.y;
      return Math.max(1, Math.round(Math.hypot(dx, dy))) * this.gridPx;
    }
    return item.w * this.gridPx;
  }

  protected frameHeight(item: LayoutItem): number {
    return item.kind === 'line' ? 2 : item.h * this.gridPx;
  }

  protected onCanvasPointerDown(event: PointerEvent): void {
    if (event.target !== event.currentTarget) {
      return;
    }
    this.selectedItemIds.set([]);
    const object = this.currentObject() ?? this.object();
    this.selection.select({
      element: this.elementRef.nativeElement,
      context: { key: object.keyString, label: object.name, object, type: 'object' },
    });
  }

  protected onItemPointerDown(event: PointerEvent, item: LayoutItem): void {
    event.stopPropagation();
    const multi = event.ctrlKey || event.metaKey;
    const selected = this.selectedItemIds();
    if (multi) {
      this.selectedItemIds.set(
        selected.includes(item.id)
          ? selected.filter((id) => id !== item.id)
          : [...selected, item.id],
      );
    } else if (!selected.includes(item.id)) {
      this.selectedItemIds.set([item.id]);
    }
    this.publishItemSelection(event.currentTarget as HTMLElement, item, multi);

    if (this.editing() && this.selectedItemIds().includes(item.id)) {
      this.beginDrag(event, {
        kind: 'move',
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originItems: clone(this.draftItems()),
        itemId: item.id,
      });
    }
  }

  protected onHandlePointerDown(event: PointerEvent, item: LayoutItem, handle: ResizeHandle): void {
    event.stopPropagation();
    this.beginDrag(event, {
      kind: 'resize',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originItems: clone(this.draftItems()),
      itemId: item.id,
      handle,
    });
  }

  protected onRotatePointerDown(event: PointerEvent, item: LayoutItem): void {
    event.stopPropagation();
    const frame = (event.currentTarget as HTMLElement).parentElement!.getBoundingClientRect();
    this.beginDrag(event, {
      kind: 'rotate',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originItems: clone(this.draftItems()),
      itemId: item.id,
      startRotation: item.rotation,
      center: { x: frame.left + frame.width / 2, y: frame.top + frame.height / 2 },
    });
  }

  private publishItemSelection(element: HTMLElement, item: LayoutItem, multi: boolean): void {
    const object = this.currentObject() ?? this.object();
    this.selection.select(
      {
        element,
        context: {
          key: `${object.keyString}:${item.id}`,
          label: item.kind === 'text' ? (item.text ?? 'Text') : (item.keyString ?? item.kind),
          object,
          type: 'layout-item',
        },
      },
      multi,
    );
  }

  private draftItems(): LayoutItem[] {
    return this.draft()?.items ?? [];
  }

  private applyToDraft(operation: (items: LayoutItem[]) => LayoutItem[]): void {
    const draft = this.draft();
    if (!draft) {
      return;
    }
    this.draft.set({ ...draft, items: operation(draft.items) });
  }

  private beginDrag(event: PointerEvent, state: DragState): void {
    if (!this.editing()) {
      return;
    }
    this.drag = state;
    const element = event.currentTarget as HTMLElement;
    element.setPointerCapture(event.pointerId);
    const onMove = (move: PointerEvent) => this.onDragMove(move);
    const onUp = () => {
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerup', onUp);
      this.endDrag();
    };
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerup', onUp);
  }

  private onDragMove(event: PointerEvent): void {
    const drag = this.drag;
    const draft = this.draft();
    if (!drag || !draft) {
      return;
    }
    if (drag.kind === 'rotate') {
      const angle =
        (Math.atan2(event.clientY - drag.center!.y, event.clientX - drag.center!.x) * 180) /
        Math.PI;
      const startAngle =
        (Math.atan2(drag.startY - drag.center!.y, drag.startX - drag.center!.x) * 180) / Math.PI;
      const rotation = Math.round((drag.startRotation ?? 0) + angle - startAngle);
      this.draft.set({
        ...draft,
        items: rotateItems(drag.originItems, [drag.itemId], rotation),
      });
      return;
    }
    const dx = Math.round((event.clientX - drag.startX) / this.gridPx);
    const dy = Math.round((event.clientY - drag.startY) / this.gridPx);
    const items =
      drag.kind === 'move'
        ? moveItems(drag.originItems, this.selectedItemIds(), dx, dy)
        : resizeItem(drag.originItems, drag.itemId, drag.handle!, dx, dy);
    this.draft.set({ ...draft, items });
  }

  private endDrag(): void {
    this.drag = null;
  }

  private copySelection(): void {
    const selected = new Set(this.selectedItemIds());
    const items = this.draftItems().filter((item) => selected.has(item.id));
    if (items.length > 0) {
      this.clipboard.store(items);
    }
  }

  private pasteClipboard(): void {
    const pasted = this.clipboard.read();
    if (pasted.length === 0) {
      return;
    }
    this.applyToDraft((items) => [...items, ...pasted]);
    this.selectedItemIds.set(pasted.map((item) => item.id));
  }

  private async saveDraft(): Promise<void> {
    const draft = this.draft();
    const object = this.currentObject() ?? this.object();
    if (!draft) {
      return;
    }
    // Paste repairs first (01.05): add missing sub-object references to
    // composition so the browse-mode reconciler never drops the pasted items.
    const missing = unresolvedReferences(draft.items, object.composition ?? []);
    for (const keyString of missing) {
      try {
        const child = await this.objects.get(keyString);
        await this.composition.get(object)?.add(child);
      } catch {
        // Unresolvable references paste as empty frames; nothing to repair.
      }
    }
    const base = missing.length > 0 ? await this.objects.get(object.keyString) : object;
    await this.persist(base, draft);
    this.draft.set(null);
    this.editService.endEdit(object.keyString);
  }

  private cancelDraft(): void {
    this.draft.set(null);
    this.selectedItemIds.set([]);
    this.editService.endEdit(this.object().keyString);
  }

  private async persist(object: DomainObject, configuration: LayoutConfiguration): Promise<void> {
    this.saving = true;
    try {
      const saved = await this.viewConfig.write(object, 'layout', configuration);
      this.currentObject.set(saved);
      this.updates.emitLocal(saved);
    } finally {
      this.saving = false;
    }
  }
}
