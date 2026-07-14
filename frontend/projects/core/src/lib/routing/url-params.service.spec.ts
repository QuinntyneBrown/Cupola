import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { UrlParamsService } from './url-params.service';

describe('OMCT-C15-L2-01.02 UrlParamsService', () => {
  let service: UrlParamsService;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', children: [] }])],
    });
    service = TestBed.inject(UrlParamsService);
    router = TestBed.inject(Router);
    await router.navigateByUrl('/browse/mine?tc.mode=local');
  });

  function queryParams(): Record<string, unknown> {
    return router.parseUrl(router.url).queryParams;
  }

  it('sets parameters while preserving unrelated parameters', async () => {
    await service.setParams({ view: 'table' });

    expect(queryParams()).toEqual({ 'tc.mode': 'local', view: 'table' });
    expect(service.params()).toEqual({ 'tc.mode': 'local', view: 'table' });
    expect(service.searchParams().get('view')).toBe('table');
  });

  it('deletes named parameters', async () => {
    await service.setParams({ view: 'table' });
    await service.deleteParams('view');

    expect(queryParams()).toEqual({ 'tc.mode': 'local' });
    expect(service.searchParams().has('view')).toBe(false);
  });

  it('replaces all parameters', async () => {
    await service.replaceParams({ view: 'plot' });

    expect(queryParams()).toEqual({ view: 'plot' });
    expect(service.params()).toEqual({ view: 'plot' });
  });

  it('publishes parameter changes as URLSearchParams', async () => {
    const published: string[] = [];
    service.changes.subscribe((params) => published.push(params.toString()));

    await service.setParams({ view: 'table' });

    expect(published.at(-1)).toContain('view=table');
    expect(published.at(-1)).toContain('tc.mode=local');
  });
});
