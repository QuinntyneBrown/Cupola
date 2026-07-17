import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import {
  DomainObject,
  FormatRegistry,
  IndependentTimeContext,
  ObjectApi,
  ObjectUpdatesService,
  TimeApiService,
  TimeBounds,
  TimeContext,
} from '@cupola/core';

import { CompositionMembers } from '../../telemetry-view/composition-members';
import { AxisTick, buildAxisTicks } from '../plan/axis';
import { createTimeScale } from '../plan/time-scale';
import { TimeAxisComponent } from './time-axis.component';
import { TimeStripRowComponent } from './time-strip-row.component';
import { ExtendedLinesBus } from './extended-lines-bus';
import { applyIndependentConfig, readIndependentTime } from './independent-time';

/**
 * Time strip view (OMCT-C12-L1-02). Composes compatible time-based children as
 * rows sharing one visible time axis (02.01/02.02), optionally under an
 * independent time context with fixed/realtime controls (02.03), and draws the
 * extended event line across every row (02.05).
 */
@Component({
  selector: 'cp-time-strip-view',
  standalone: true,
  imports: [TimeAxisComponent, TimeStripRowComponent],
  templateUrl: './time-strip-view.component.html',
  styleUrl: './time-strip-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-testid': 'time-strip', class: 'strip-host' },
})
export class TimeStripViewComponent {
  private readonly globalTime = inject(TimeContext);
  private readonly objects = inject(ObjectApi);
  private readonly objectUpdates = inject(ObjectUpdatesService);
  private readonly timeApi = inject(TimeApiService);
  private readonly formats = inject(FormatRegistry);
  private readonly bus = inject(ExtendedLinesBus);

  readonly object = input.required<DomainObject>();
  readonly objectPath = input<DomainObject[]>([]);

  private readonly membersCtl = signal<CompositionMembers | null>(null);
  private readonly stripContextSig = signal<TimeContext | null>(null);
  private readonly independentContext = signal<IndependentTimeContext | null>(null);
  private readonly viewBounds = signal<TimeBounds>({ start: 0, end: 0 });
  private readonly currentLine = signal<number | null>(null);

  protected readonly stripMode = signal<'fixed' | 'realtime'>('fixed');
  protected readonly independent = computed(() => this.independentContext() !== null);
  protected readonly members = computed(() => this.membersCtl()?.members() ?? []);
  protected readonly stripContext = computed(() => this.stripContextSig() ?? this.globalTime);

  protected readonly axisTicks = computed<AxisTick[]>(() =>
    buildAxisTicks(this.viewBounds(), this.timeFormatter()),
  );
  protected readonly evLinePct = this.currentLine.asReadonly();
  protected readonly modeLabel = computed(() =>
    this.stripMode() === 'realtime' ? 'Real-time' : 'Fixed',
  );
  protected readonly boundsText = computed(() => {
    const bounds = this.viewBounds();
    const format = this.timeFormatter();
    return `${format(bounds.start)} — ${format(bounds.end)}`;
  });

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      const subs: Subscription[] = [];

      // Resolve the strip's time context: an independent context when configured,
      // otherwise the global context.
      const config = readIndependentTime(object);
      let context: TimeContext = this.globalTime;
      if (config) {
        const independent = this.timeApi.addIndependentContext(object.keyString);
        independent.setTimeSystem('utc');
        applyIndependentConfig(independent, config);
        this.independentContext.set(independent);
        this.stripMode.set(config.mode);
        context = independent;
      } else {
        this.independentContext.set(null);
      }
      this.stripContextSig.set(context);
      this.viewBounds.set(context.bounds());
      subs.push(context.boundsChanged().subscribe((bounds) => this.viewBounds.set(bounds)));

      const members = new CompositionMembers(object, this.objects, this.objectUpdates);
      members.start();
      this.membersCtl.set(members);

      subs.push(this.bus.changes.subscribe((line) => this.updateExtendedLine(line?.timestamp ?? null)));

      onCleanup(() => {
        subs.forEach((sub) => sub.unsubscribe());
        members.destroy();
        if (config) {
          this.timeApi.removeIndependentContext(object.keyString);
        }
      });
    });
  }

  protected childPath(member: DomainObject): DomainObject[] {
    return [...this.objectPath(), member];
  }

  protected toggleMode(): void {
    const context = this.independentContext();
    if (!context) {
      return;
    }
    if (this.stripMode() === 'fixed') {
      context.setClockOffsets({ start: -900_000, end: 0 });
      context.setClock('local');
      this.stripMode.set('realtime');
    } else {
      context.setClock(null);
      context.setBounds(this.viewBounds());
      this.stripMode.set('fixed');
    }
  }

  private updateExtendedLine(timestamp: number | null): void {
    if (timestamp === null) {
      this.currentLine.set(null);
      return;
    }
    const scale = createTimeScale(this.viewBounds());
    this.currentLine.set(scale.contains(timestamp) ? scale.offset(timestamp) : null);
  }

  private timeFormatter(): (value: number) => string {
    const format = this.formats.get(this.stripContext().timeSystem().timeFormat);
    return format
      ? (value) => format.format(value)
      : (value) => new Date(value).toISOString().slice(11, 19);
  }
}
