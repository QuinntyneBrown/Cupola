import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';

/**
 * Sets, deletes, and replaces URL search parameters in the hash-relative
 * location, maintaining a URLSearchParams representation and publishing
 * parameter changes. Requirement: OMCT-C15-L2-01.02.
 */
@Injectable({ providedIn: 'root' })
export class UrlParamsService {
  private readonly router = inject(Router);
  private readonly paramsState = signal<Record<string, string>>({});
  private readonly changes$ = new Subject<URLSearchParams>();

  /** Current search parameters as a plain record. */
  readonly params = this.paramsState.asReadonly();
  /** Emits the stored URLSearchParams representation after every change. */
  readonly changes = this.changes$.asObservable();

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.syncFromUrl();
      }
    });
  }

  /** The stored URLSearchParams representation. */
  searchParams(): URLSearchParams {
    return new URLSearchParams(this.paramsState());
  }

  /** Sets (merges) search parameters, preserving unrelated parameters. */
  setParams(params: Record<string, string>): Promise<boolean> {
    const tree = this.router.parseUrl(this.router.url);
    tree.queryParams = { ...tree.queryParams, ...params };
    return this.router.navigateByUrl(tree);
  }

  /** Deletes the named search parameters. */
  deleteParams(...keys: string[]): Promise<boolean> {
    const tree = this.router.parseUrl(this.router.url);
    for (const key of keys) {
      delete tree.queryParams[key];
    }
    return this.router.navigateByUrl(tree);
  }

  /** Replaces all search parameters with the supplied set. */
  replaceParams(params: Record<string, string>): Promise<boolean> {
    const tree = this.router.parseUrl(this.router.url);
    tree.queryParams = { ...params };
    return this.router.navigateByUrl(tree);
  }

  private syncFromUrl(): void {
    const tree = this.router.parseUrl(this.router.url);
    const record: Record<string, string> = {};
    for (const [key, value] of Object.entries(tree.queryParams)) {
      record[key] = String(value);
    }
    this.paramsState.set(record);
    this.changes$.next(new URLSearchParams(record));
  }
}
