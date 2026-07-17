import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DomainObject, ObjectApi, StyleProperties, sanitizeImageUrl } from '@cupola/core';

import { StyleRuleManager, StyleBinding } from '../../conditions/presentation/style-rule-manager.service';
import { EmbeddedObjectViewComponent } from '../embedded/embedded-object-view.component';
import { LayoutItem } from './layout-model';

/**
 * The content of one display-layout item: an embedded object view with frame
 * chrome, or a text / image / box drawing element. Applies the item's static
 * styles and its conditional B09 styles (OMCT-C09-L2-01.04, B09).
 */
@Component({
  selector: 'cp-layout-frame',
  imports: [EmbeddedObjectViewComponent],
  template: `
    @switch (item().kind) {
      @case ('subobject') {
        @if (!item().hideFrame) {
          <div class="dl-frame-head" data-testid="dl-frame-head">{{ childName() }}</div>
        }
        <div class="dl-frame-body">
          <cp-embedded-object-view
            [keyString]="item().keyString!"
            [objectPath]="objectPath()"
            [viewKey]="item().viewKey"
          />
        </div>
      }
      @case ('text') {
        <div class="dl-text" data-testid="dl-text">{{ item().text }}</div>
      }
      @case ('image') {
        @if (imageUrl(); as url) {
          <img class="dl-img" [src]="url" [alt]="item().text ?? 'Layout image'" />
        } @else {
          <div class="cp-empty">Image unavailable.</div>
        }
      }
      @case ('box') {
        <div class="dl-box"></div>
      }
    }
  `,
  styleUrl: './layout-frame.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.background-color]': 'mergedStyle().backgroundColor ?? null',
    '[style.border-color]': 'mergedStyle().borderColor ?? null',
    '[style.color]': 'mergedStyle().color ?? null',
    '[style.visibility]': 'mergedStyle().visibility ?? null',
  },
})
export class LayoutFrameComponent {
  private readonly objects = inject(ObjectApi);
  private readonly styleRules = inject(StyleRuleManager);

  readonly item = input.required<LayoutItem>();
  readonly objectPath = input<DomainObject[]>([]);

  protected readonly childName = signal('');
  private readonly binding = signal<StyleBinding | null>(null);

  /** Static item styles overlaid by the live conditional style (B09). */
  protected readonly mergedStyle = computed<StyleProperties>(() => ({
    ...(this.item().styles ?? {}),
    ...(this.binding()?.style() ?? {}),
  }));

  protected readonly imageUrl = computed(() => {
    const url = this.item().url;
    return url ? sanitizeImageUrl(url) : null;
  });

  constructor() {
    effect(() => {
      const item = this.item();
      if (item.kind === 'subobject' && item.keyString) {
        void this.objects
          .get(item.keyString)
          .then((child) => this.childName.set(child.name))
          .catch(() => this.childName.set(item.keyString ?? ''));
      }
    });

    // The binding is written but never read here — reading it would retrigger
    // this effect on its own write. The cleanup owns each binding's teardown.
    effect((onCleanup) => {
      const objectStyles = this.item().objectStyles;
      const binding = objectStyles ? this.styleRules.attach(objectStyles) : null;
      this.binding.set(binding);
      onCleanup(() => binding?.destroy());
    });
  }
}
