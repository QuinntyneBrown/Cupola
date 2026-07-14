import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { AbortRegistry } from './abort-registry';

/**
 * Publishes hash-path changes and aborts active telemetry requests when a
 * navigation starts. Requirement: OMCT-C15-L2-01.01.
 */
@Injectable({ providedIn: 'root' })
export class RouteEventsService {
  private readonly router = inject(Router);
  private readonly abortRegistry = inject(AbortRegistry);
  private readonly currentPath = signal('');
  private readonly pathChanges$ = new Subject<string>();

  /** The current location (URL after redirects). */
  readonly path = this.currentPath.asReadonly();
  /** Emits the new path after every completed navigation. */
  readonly pathChanges = this.pathChanges$.asObservable();

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.abortRegistry.abortAll();
      } else if (event instanceof NavigationEnd) {
        this.currentPath.set(event.urlAfterRedirects);
        this.pathChanges$.next(event.urlAfterRedirects);
      }
    });
  }
}
