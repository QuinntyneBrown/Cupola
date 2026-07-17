import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EnvironmentInjector,
  computed,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { CupolaView, DomainObject, MetadataRegistry, TimeContext } from '@cupola/core';
import { componentView } from '@cupola/components';

import { StripRowKind, stripRowKind } from './strip-eligibility';
import { stripComponentFor } from './strip-component-map';

const ROW_CLASS: Record<StripRowKind, string> = {
  plot: 'ts-plotrow',
  plan: 'ts-planrow',
  gantt: 'ts-planrow',
  image: 'ts-imgrow',
  event: 'ts-evrow',
  unknown: '',
};

/**
 * One time-strip row (OMCT-C12-L2-02.02). Hosts the child's time-based view in a
 * gutter-plus-track layout, instantiating it restricted and bound to the strip's
 * shared {@link TimeContext} so its content aligns to the shared axis.
 */
@Component({
  selector: 'cp-time-strip-row',
  standalone: true,
  template: `
    <div
      class="tl-row"
      [class]="rowClass()"
      data-testid="strip-row"
      [attr.data-kind]="kind()"
      [attr.data-key]="object().keyString"
    >
      <div class="tl-gutter" data-testid="strip-row-gutter">{{ object().name }}</div>
      <div class="tl-track" #host>
        @if (kind() === 'image') {
          <div class="ts-shot" style="left: 50%">
            <span class="ts-shot-img"></span>
            <span>{{ object().name }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './time-strip-row.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeStripRowComponent {
  private readonly metadata = inject(MetadataRegistry);
  private readonly injector = inject(EnvironmentInjector);

  readonly object = input.required<DomainObject>();
  readonly objectPath = input<DomainObject[]>([]);
  readonly timeContext = input<TimeContext>();

  private readonly host = viewChild<ElementRef<HTMLElement>>('host');
  private view: CupolaView | null = null;

  protected readonly kind = computed(() => stripRowKind(this.object(), this.metadata));
  protected readonly rowClass = computed(() => ROW_CLASS[this.kind()]);

  constructor() {
    effect((onCleanup) => {
      const host = this.host()?.nativeElement;
      const object = this.object();
      const context = this.timeContext();
      const path = this.objectPath();
      this.view?.destroy();
      this.view = null;
      if (!host) {
        return;
      }
      const entry = stripComponentFor(object, this.metadata);
      if (entry) {
        const inputs: Record<string, unknown> = { object, objectPath: path };
        if (context) {
          inputs['timeContext'] = context;
        }
        if (entry.acceptsRestricted) {
          inputs['restricted'] = true;
        }
        this.view = componentView(this.injector, entry.component, inputs);
        this.view.show(host);
      }
      onCleanup(() => {
        this.view?.destroy();
        this.view = null;
      });
    });
  }
}
