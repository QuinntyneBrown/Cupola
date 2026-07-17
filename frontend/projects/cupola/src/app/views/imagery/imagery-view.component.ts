import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  ActionRegistry,
  Annotation,
  DomainObject,
  ImageryMetadata,
  ObjectApi,
  ObjectsGateway,
  TelemetryApiService,
  TimeContext,
  isAllowedImageUrl,
} from '@cupola/core';

import { TelemetryStream } from '../../telemetry-view/telemetry-stream';
import { ViewConfigService } from '../../telemetry-view/view-config.service';
import { FrameAnnotation, AnnotationsLayerComponent } from './annotations/annotations-layer.component';
import { NormalizedRect } from './annotations/annotation-hit-testing';
import { CompassComponent } from './compass/compass.component';
import { orientationFor } from './compass/compass-orientation';
import { FocusController } from './focus-controller';
import { toImageFrames } from './image-history';
import { ImageryFocusService } from './imagery-focus.service';
import { LayerStore } from './layer-store';
import {
  IDENTITY,
  PanZoom,
  panBy,
  transformCss,
  visibleRegion,
  zoomAround,
} from './pan-zoom';
import { RelatedSample, RelatedTelemetryService } from './related-telemetry.service';

const IMAGE_PIXEL_TYPE = 'image-pixel';

interface PixelDetail {
  time?: number;
  rectangle?: NormalizedRect;
}

/**
 * The imagery view (OMCT-C11-L2-01.02–01.04, 02.01–02.05, 03.01–03.03, 04.01,
 * 04.02): focused image with navigable thumbnail history, zoom/pan with a
 * viewable-area indicator, brightness/contrast filters, metadata-declared
 * layers, compass overlays, related telemetry at the focused time, pixel-
 * spatial annotations, and the open/save extraction actions.
 */
@Component({
  selector: 'cp-imagery-view',
  templateUrl: './imagery-view.component.html',
  styleUrl: './imagery-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AnnotationsLayerComponent, CompassComponent],
})
export class ImageryViewComponent {
  private readonly telemetry = inject(TelemetryApiService);
  private readonly globalTime = inject(TimeContext);
  private readonly objectApi = inject(ObjectApi);
  private readonly viewConfig = inject(ViewConfigService);
  private readonly gateway = inject(ObjectsGateway);
  private readonly relatedTelemetry = inject(RelatedTelemetryService);
  private readonly actions = inject(ActionRegistry);
  private readonly focusRegistry = inject(ImageryFocusService);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly object = input.required<DomainObject>();
  readonly objectPath = input<DomainObject[]>([]);
  /** Container-supplied context (B11); defaults to the resolved conductor context. */
  readonly timeContext = input<TimeContext | undefined>(undefined);
  readonly restricted = input(false);

  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');

  private readonly stream = signal<TelemetryStream | null>(null);
  protected readonly frames = computed(() => toImageFrames(this.stream()?.points() ?? []));
  protected readonly focus = new FocusController();
  protected readonly focused = computed(() => this.focus.focusedFrame(this.frames()));
  protected readonly live = computed(() => this.focus.trackingLatest());

  protected readonly panZoom = signal<PanZoom>(IDENTITY);
  protected readonly zoomed = computed(() => this.panZoom().scale > 1);
  protected readonly transform = computed(() => transformCss(this.panZoom()));
  protected readonly overviewRegion = computed(() =>
    visibleRegion(this.panZoom(), this.stageSize()),
  );

  protected readonly brightness = signal(100);
  protected readonly contrast = signal(100);
  protected readonly cssFilter = computed(
    () => `brightness(${this.brightness()}%) contrast(${this.contrast()}%)`,
  );
  protected readonly filtersOpen = signal(false);
  protected readonly layersOpen = signal(false);

  protected readonly layerStore = signal<LayerStore | null>(null);
  protected readonly visibleLayers = computed(
    () => this.layerStore()?.layers().filter((layer) => layer.visible) ?? [],
  );

  protected readonly orientation = computed(() => {
    const frame = this.focused();
    return frame ? orientationFor(frame.heading, frame.cameraAngle) : null;
  });

  protected readonly relatedRows = signal<RelatedSample[]>([]);
  private relatedToken = 0;

  private readonly allAnnotations = signal<Annotation[]>([]);
  protected readonly frameAnnotations = computed<FrameAnnotation[]>(() => {
    const frame = this.focused();
    if (!frame) {
      return [];
    }
    const keyString = this.object().keyString;
    const result: FrameAnnotation[] = [];
    for (const annotation of this.allAnnotations()) {
      if (annotation.annotationType !== IMAGE_PIXEL_TYPE) {
        continue;
      }
      for (const target of annotation.targetDetails ?? []) {
        const detail = target.detail as PixelDetail | undefined;
        if (
          target.keyString === keyString &&
          detail?.rectangle &&
          detail.time === frame.time
        ) {
          result.push({
            keyString: annotation.keyString,
            text: annotation.text,
            rectangle: detail.rectangle,
          });
        }
      }
    }
    return result;
  });

  protected readonly openAllowed = computed(() => {
    const frame = this.focused();
    return frame !== null && isAllowedImageUrl(frame.url);
  });

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      const context = this.timeContext() ?? this.globalTime;
      const stream = new TelemetryStream(object, this.telemetry, context);
      stream.start();
      this.stream.set(stream);

      const imagery = object.telemetry?.imagery as ImageryMetadata | undefined;
      this.layerStore.set(
        new LayerStore(object, imagery?.layers ?? [], this.viewConfig, this.objectApi),
      );

      const subscription = this.gateway
        .getAnnotations(object.keyString)
        .subscribe((annotations) => this.allAnnotations.set(annotations));

      const unregister = this.focusRegistry.register(
        this.elementRef.nativeElement,
        this.focused,
      );

      onCleanup(() => {
        stream.destroy();
        subscription.unsubscribe();
        unregister();
      });
    });

    // Related telemetry at the focused image's time (03.01), race-guarded.
    effect(() => {
      const frame = this.focused();
      const imagery = this.object().telemetry?.imagery as ImageryMetadata | undefined;
      const sources = imagery?.relatedTelemetry ?? [];
      if (!frame || sources.length === 0) {
        this.relatedRows.set([]);
        return;
      }
      const token = ++this.relatedToken;
      void this.relatedTelemetry.sample(sources, frame.time).then((samples) => {
        if (token === this.relatedToken) {
          this.relatedRows.set(samples);
        }
      });
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      this.focus.step(this.frames(), -1);
      event.preventDefault();
    } else if (event.key === 'ArrowRight') {
      this.focus.step(this.frames(), 1);
      event.preventDefault();
    } else if (event.key === 'End') {
      this.focus.followLatest();
      event.preventDefault();
    }
  }

  protected selectThumbnail(time: number): void {
    this.focus.select(time);
  }

  protected onWheel(event: WheelEvent): void {
    event.preventDefault();
    const bounds = this.stage().nativeElement.getBoundingClientRect();
    const point = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    const factor = event.deltaY < 0 ? 1.25 : 0.8;
    this.panZoom.update((state) => zoomAround(state, factor, point, this.stageSize()));
  }

  protected zoomStep(factor: number): void {
    const stage = this.stageSize();
    this.panZoom.update((state) =>
      zoomAround(state, factor, { x: stage.width / 2, y: stage.height / 2 }, stage),
    );
  }

  protected resetView(): void {
    this.panZoom.set(IDENTITY);
  }

  protected onStagePointerDown(event: PointerEvent): void {
    // Overlay controls handle their own clicks; capturing here would steal them.
    const overlay = (event.target as HTMLElement).closest('button, .im-controls, .cp-menu');
    if (!this.zoomed() || overlay) {
      return;
    }
    const element = this.stage().nativeElement;
    element.setPointerCapture(event.pointerId);
    let lastX = event.clientX;
    let lastY = event.clientY;
    const onMove = (move: PointerEvent) => {
      this.panZoom.update((state) =>
        panBy(state, move.clientX - lastX, move.clientY - lastY, this.stageSize()),
      );
      lastX = move.clientX;
      lastY = move.clientY;
    };
    const onUp = () => {
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerup', onUp);
    };
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerup', onUp);
  }

  protected setBrightness(event: Event): void {
    this.brightness.set(Number((event.target as HTMLInputElement).value));
  }

  protected setContrast(event: Event): void {
    this.contrast.set(Number((event.target as HTMLInputElement).value));
  }

  protected resetFilters(): void {
    this.brightness.set(100);
    this.contrast.set(100);
  }

  protected toggleLayer(key: string): void {
    void this.layerStore()?.toggle(key);
  }

  protected invokeAction(key: string): void {
    const context = {
      objectPath: [...this.objectPath(), this.object()],
      viewKey: 'imagery',
      viewParentElement: this.elementRef.nativeElement,
    };
    const action = this.actions.getAction(key);
    if (action && (action.appliesTo?.(context) ?? true)) {
      action.invoke(context);
    }
  }

  private stageSize(): { width: number; height: number } {
    const bounds = this.stage().nativeElement.getBoundingClientRect();
    return { width: Math.max(1, bounds.width), height: Math.max(1, bounds.height) };
  }
}
