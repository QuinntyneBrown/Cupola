import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';
import { SearchGateway, SearchResults } from '@cupola/core';

import { GrandSearchComponent } from './grand-search.component';

const RESULTS: SearchResults = {
  objects: [
    {
      identifier: { namespace: '', key: 'solar-array-output' },
      keyString: 'solar-array-output',
      name: 'Solar array output',
      type: 'overlay-plot',
      location: 'station-displays',
      composition: [],
    },
    {
      identifier: { namespace: '', key: 'pwr.array_out' },
      keyString: 'pwr.array_out',
      name: 'Solar array power',
      type: 'telemetry',
      location: 'power',
      composition: [],
    },
  ],
  annotations: [
    {
      keyString: 'ann-1',
      text: 'Observed solar pointing offset during eclipse exit',
      targets: ['ops-notebook'],
      tags: ['power'],
    },
  ],
};

class SearchGatewayStub extends SearchGateway {
  override search(): Observable<SearchResults> {
    return of(RESULTS);
  }
}

describe('OMCT-C15-L2-05.05 GrandSearchComponent', () => {
  let fixture: ComponentFixture<GrandSearchComponent>;

  beforeEach(() => {
    jest.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SearchGateway, useClass: SearchGatewayStub }],
    });
    fixture = TestBed.createComponent(GrandSearchComponent);
    fixture.detectChanges();
  });

  afterEach(() => jest.useRealTimers());

  function input(): HTMLInputElement {
    return fixture.nativeElement.querySelector('[data-testid="search-input"]');
  }

  it('shows matching object and annotation results with highlighting', () => {
    input().focus();
    input().value = 'solar';
    input().dispatchEvent(new Event('input'));
    jest.advanceTimersByTime(300);
    fixture.detectChanges();

    const objectResults = fixture.nativeElement.querySelectorAll('[data-testid="object-result"]');
    const annotationResults = fixture.nativeElement.querySelectorAll(
      '[data-testid="annotation-result"]',
    );
    expect(objectResults).toHaveLength(2);
    expect(annotationResults).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('mark').textContent).toBe('Solar');
  });
});
