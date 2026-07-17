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
  viewChild,
} from '@angular/core';
import {
  CupolaView,
  DomainObject,
  ObjectApi,
  ObjectUpdatesService,
  ViewRegistry,
  objectGlyph,
} from '@cupola/core';

import { CompositionMembers } from '../../telemetry-view/composition-members';
import { TabsConfiguration, emptyTabsMessage, loadsEagerly, retainsInactiveViews } from './tab-retention';

interface TabPanel {
  element: HTMLElement;
  view: CupolaView;
}

/**
 * The tabs view (OMCT-C09-L2-03.01–03.03): one selectable tab per composed
 * child, the active child's view in the panel area, inactive views retained or
 * destroyed per the saved loading policy, and an empty-state message when the
 * tabs object has no children.
 */
@Component({
  selector: 'cp-tabs-view',
  template: `
    @if (members().length > 0) {
      <div class="cp-tabs" role="tablist">
        @for (member of members(); track member.keyString) {
          <button
            class="cp-tab"
            role="tab"
            data-testid="tab"
            [attr.data-key]="member.keyString"
            [attr.aria-selected]="member.keyString === activeKey()"
            [class.is-active]="member.keyString === activeKey()"
            (click)="activate(member.keyString)"
          >
            <svg class="cp-icon cp-icon--s"><use [attr.href]="'#' + glyph(member)" /></svg>
            {{ member.name }}
          </button>
        }
      </div>
    } @else {
      <p class="cp-empty" data-testid="tabs-empty">{{ emptyMessage() }}</p>
    }
    <div class="tabs-body" #panels [hidden]="members().length === 0"></div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }
    .tabs-body {
      flex: 1;
      min-height: 0;
      position: relative;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsViewComponent {
  private readonly objects = inject(ObjectApi);
  private readonly updates = inject(ObjectUpdatesService);
  private readonly views = inject(ViewRegistry);
  private readonly destroyRef = inject(DestroyRef);

  readonly object = input.required<DomainObject>();
  readonly objectPath = input<DomainObject[]>([]);

  private readonly panelsHost = viewChild.required<ElementRef<HTMLElement>>('panels');

  private readonly membership = signal<CompositionMembers | null>(null);
  protected readonly members = computed<DomainObject[]>(
    () => this.membership()?.members() ?? [],
  );
  protected readonly activeKey = signal<string | null>(null);

  private readonly panels = new Map<string, TabPanel>();

  private readonly config = computed<TabsConfiguration | undefined>(
    () => this.object().configuration?.['tabs'] as TabsConfiguration | undefined,
  );
  protected readonly emptyMessage = computed(() => emptyTabsMessage(this.config()));

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      const membership = new CompositionMembers(object, this.objects, this.updates);
      membership.start();
      this.membership.set(membership);
      onCleanup(() => membership.destroy());
    });

    // Keep the active tab valid as membership changes (03.01).
    effect(() => {
      const members = this.members();
      const active = this.activeKey();
      if (members.length === 0) {
        this.activeKey.set(null);
      } else if (!members.some((member) => member.keyString === active)) {
        this.activeKey.set(members[0].keyString);
      }
      this.pruneRemoved(members);
    });

    // Panel lifecycle per the loading policy (03.01/03.02).
    effect(() => {
      const host = this.panelsHost().nativeElement;
      const members = this.members();
      const active = this.activeKey();
      if (members.length === 0 || !active) {
        return;
      }
      const config = this.config();
      const wanted = loadsEagerly(config) ? members.map((member) => member.keyString) : [active];
      for (const keyString of wanted) {
        if (!this.panels.has(keyString)) {
          const member = members.find((candidate) => candidate.keyString === keyString);
          if (member) {
            this.mountPanel(host, member);
          }
        }
      }
      for (const [keyString, panel] of [...this.panels]) {
        const isActive = keyString === active;
        if (!isActive && !retainsInactiveViews(config)) {
          this.destroyPanel(keyString, panel);
        } else {
          panel.element.hidden = !isActive;
        }
      }
    });

    this.destroyRef.onDestroy(() => {
      for (const [keyString, panel] of [...this.panels]) {
        this.destroyPanel(keyString, panel);
      }
    });
  }

  protected glyph(member: DomainObject): string {
    return objectGlyph(member);
  }

  protected activate(keyString: string): void {
    this.activeKey.set(keyString);
  }

  private mountPanel(host: HTMLElement, member: DomainObject): void {
    const path = [...this.objectPath(), member];
    const applicable = this.views.applicableViews(member, path);
    if (applicable.length === 0) {
      return;
    }
    const element = document.createElement('div');
    element.setAttribute('data-testid', 'tab-panel');
    element.setAttribute('data-key', member.keyString);
    element.style.height = '100%';
    host.appendChild(element);
    const view = this.views.showView(applicable[0], member, path, element);
    this.panels.set(member.keyString, { element, view });
  }

  private destroyPanel(keyString: string, panel: TabPanel): void {
    panel.view.destroy();
    panel.element.remove();
    this.panels.delete(keyString);
  }

  private pruneRemoved(members: DomainObject[]): void {
    const memberKeys = new Set(members.map((member) => member.keyString));
    for (const [keyString, panel] of [...this.panels]) {
      if (!memberKeys.has(keyString)) {
        this.destroyPanel(keyString, panel);
      }
    }
  }
}
