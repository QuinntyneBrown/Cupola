import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/**
 * Application-wide clear-data event bus. Views subscribe to drop cached telemetry
 * when an operator triggers a data reset. Requirement: OMCT-C03-L2-04.04.
 */
@Injectable({ providedIn: 'root' })
export class ClearDataService {
  private readonly clear$ = new Subject<void>();
  readonly cleared: Observable<void> = this.clear$.asObservable();

  clear(): void {
    this.clear$.next();
  }
}
