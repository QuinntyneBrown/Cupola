import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DomainObject, ObjectsGateway, RealtimeGateway } from '@cupola/core';

interface Row {
  keyString: string;
  name: string;
  unit: string;
  value: number | null;
  timestamp: string;
}

@Component({
  selector: 'cp-table-view',
  templateUrl: './table-view.component.html',
  styleUrl: './table-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableViewComponent {
  private readonly objects = inject(ObjectsGateway);
  private readonly realtime = inject(RealtimeGateway);

  readonly object = input.required<DomainObject>();

  protected readonly rows = signal<Row[]>([]);
  protected readonly hasRows = computed(() => this.rows().length > 0);

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      const subscriptions: { unsubscribe(): void }[] = [];

      const membersSub = this.objects.getComposition(object.keyString).subscribe((members) => {
        const source = members.length > 0 ? members : [object];
        this.rows.set(
          source.map((member) => ({
            keyString: member.keyString,
            name: member.name,
            unit: member.telemetry?.unit ?? '',
            value: null,
            timestamp: '',
          })),
        );
        for (const member of source) {
          const sub = this.realtime.telemetry(member.keyString).subscribe((value) => {
            this.rows.update((rows) =>
              rows.map((row) =>
                row.keyString === member.keyString
                  ? { ...row, value: value.value, timestamp: value.timestamp }
                  : row,
              ),
            );
          });
          subscriptions.push(sub);
        }
      });
      subscriptions.push(membersSub);

      onCleanup(() => subscriptions.forEach((s) => s.unsubscribe()));
    });
  }

  protected formatValue(row: Row): string {
    return row.value === null ? '—' : row.value.toFixed(2);
  }
}
