import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DomainObject, ObjectApi, ObjectUpdatesService, TimeContext } from '@cupola/core';

import { CompositionMembers } from '../telemetry-view/composition-members';
import { LadTableViewComponent } from './lad-table-view.component';

/**
 * Latest-available-data table set (OMCT-C08-L2-02.03): renders one titled section
 * per composed LAD table, each an embedded {@link LadTableViewComponent}.
 */
@Component({
  selector: 'cp-lad-table-set-view',
  standalone: true,
  imports: [LadTableViewComponent],
  templateUrl: './lad-table-set-view.component.html',
  styleUrl: './lad-table-set-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LadTableSetViewComponent {
  private readonly objects = inject(ObjectApi);
  private readonly objectUpdates = inject(ObjectUpdatesService);
  protected readonly globalTime = inject(TimeContext);

  readonly object = input.required<DomainObject>();
  readonly objectPath = input<DomainObject[]>([]);
  readonly timeContext = input<TimeContext>();

  private readonly membersCtl = signal<CompositionMembers | null>(null);

  /** The composed LAD tables rendered as sections. */
  protected readonly tables = computed(() =>
    (this.membersCtl()?.members() ?? []).filter((member) => member.type === 'lad-table'),
  );

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      const members = new CompositionMembers(object, this.objects, this.objectUpdates);
      members.start();
      this.membersCtl.set(members);
      onCleanup(() => members.destroy());
    });
  }

  protected context(): TimeContext {
    return this.timeContext() ?? this.globalTime;
  }
}
