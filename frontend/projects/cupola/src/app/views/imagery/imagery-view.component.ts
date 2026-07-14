import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DomainObject, RealtimeGateway } from '@cupola/core';

@Component({
  selector: 'cp-imagery-view',
  templateUrl: './imagery-view.component.html',
  styleUrl: './imagery-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageryViewComponent {
  private readonly realtime = inject(RealtimeGateway);

  readonly object = input.required<DomainObject>();

  protected readonly latest = signal<number | null>(null);
  protected readonly timestamp = signal<string>('');

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      const subscription = this.realtime.telemetry(object.keyString).subscribe((value) => {
        this.latest.set(value.value);
        this.timestamp.set(value.timestamp);
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }
}
