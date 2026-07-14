import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { Observable, forkJoin, map, tap } from 'rxjs';
import { DomainObject, ObjectsGateway } from '@cupola/core';

import { BrowseStateService } from './browse-state.service';

/**
 * Resolves `/browse` object-path segments into domain objects and updates
 * the browse state. A root `/browse` route redirects to the last child
 * returned by root composition.
 * Requirements: OMCT-C15-L2-01.03, OMCT-C15-L2-01.04.
 */
export const browseResolver: ResolveFn<DomainObject[] | RedirectCommand> = (route) => {
  const objects = inject(ObjectsGateway);
  const router = inject(Router);
  const browseState = inject(BrowseStateService);

  const segments = route.url.map((segment) => decodeURIComponent(segment.path));

  if (segments.length === 0) {
    return objects.getComposition('ROOT').pipe(
      map((children): DomainObject[] | RedirectCommand => {
        const last = children.at(-1);
        if (!last) {
          return [];
        }
        return new RedirectCommand(router.parseUrl(`/browse/${last.keyString}`));
      }),
    );
  }

  const resolved: Observable<DomainObject[]> = forkJoin(
    segments.map((keyString) => objects.getObject(keyString)),
  );

  return resolved.pipe(tap((path) => browseState.setPath(path)));
};
