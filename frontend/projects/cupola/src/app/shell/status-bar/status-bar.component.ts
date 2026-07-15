import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { PersistenceStatusService } from '@cupola/core';

@Component({
  selector: 'cp-status-bar',
  templateUrl: './status-bar.component.html',
  styleUrl: './status-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBarComponent {
  private readonly persistence = inject(PersistenceStatusService);

  protected readonly clock = signal(formatUtc(new Date()));
  protected readonly connectionState = this.persistence.connectionState;
  protected readonly connectionLabel = computed(() => {
    switch (this.connectionState()) {
      case 'connected':
        return 'Connected';
      case 'pending':
        return 'Pending';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  });

  constructor() {
    const timer = setInterval(() => this.clock.set(formatUtc(new Date())), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}

function formatUtc(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}
