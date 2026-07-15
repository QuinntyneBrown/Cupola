import { Injectable, signal } from '@angular/core';
import { Observable, defer, tap } from 'rxjs';

import { ConnectionState } from '../models/connection-state';

@Injectable({ providedIn: 'root' })
export class PersistenceStatusService {
  private readonly state = signal<ConnectionState>('unknown');
  readonly connectionState = this.state.asReadonly();

  track<T>(request: Observable<T>): Observable<T> {
    return defer(() => {
      this.state.set('pending');
      return request.pipe(
        tap({
          next: () => this.state.set('connected'),
          error: (error: unknown) => this.state.set(this.stateForError(error)),
        }),
      );
    });
  }

  private stateForError(error: unknown): ConnectionState {
    if (typeof error === 'object' && error !== null && 'status' in error) {
      const status = (error as { status?: unknown }).status;
      if (status === 0 || status === 503) {
        return 'disconnected';
      }
      if (typeof status === 'number') {
        return 'connected';
      }
    }
    return 'unknown';
  }
}
