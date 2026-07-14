import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AbortRegistry } from './abort-registry';
import { RouteEventsService } from './route-events.service';

describe('OMCT-C15-L2-01.01 RouteEventsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', children: [] }])],
    });
  });

  it('updates the current location, aborts active requests, and emits the path change', async () => {
    const service = TestBed.inject(RouteEventsService);
    const registry = TestBed.inject(AbortRegistry);
    const router = TestBed.inject(Router);

    const aborted = jest.fn();
    registry.register(aborted);
    const paths: string[] = [];
    service.pathChanges.subscribe((path) => paths.push(path));

    await router.navigateByUrl('/browse/mine');

    expect(aborted).toHaveBeenCalledTimes(1);
    expect(service.path()).toBe('/browse/mine');
    expect(paths).toEqual(['/browse/mine']);
  });
});
