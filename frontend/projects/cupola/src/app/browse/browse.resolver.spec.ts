import { Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RedirectCommand,
  RouterStateSnapshot,
  UrlSegment,
  provideRouter,
} from '@angular/router';
import { EMPTY, Observable, firstValueFrom, of } from 'rxjs';
import {
  Annotation,
  ConnectionState,
  DomainObject,
  ObjectsGateway,
  RealtimeGateway,
  TelemetryValue,
} from '@cupola/core';

import { browseResolver } from './browse.resolver';

const OBJECTS: Record<string, DomainObject> = {
  ROOT: makeObject('ROOT', 'Root', ['station', 'mine']),
  station: makeObject('station', 'Station', []),
  mine: makeObject('mine', 'My Items', ['station-displays']),
  'station-displays': makeObject('station-displays', 'Station displays', []),
};

function makeObject(keyString: string, name: string, composition: string[]): DomainObject {
  return {
    identifier: { namespace: '', key: keyString },
    keyString,
    name,
    type: 'folder',
    location: null,
    composition,
  };
}

class ObjectsGatewayStub extends ObjectsGateway {
  override getObject(keyString: string): Observable<DomainObject> {
    return of(OBJECTS[keyString]);
  }
  override getComposition(keyString: string): Observable<DomainObject[]> {
    return of(OBJECTS[keyString].composition.map((child) => OBJECTS[child]));
  }
  override getAnnotations(): Observable<Annotation[]> {
    return of([]);
  }
  override updateObject(): Observable<DomainObject> {
    return EMPTY;
  }
}

class RealtimeGatewayStub extends RealtimeGateway {
  override readonly connectionState: Signal<ConnectionState> = signal('connected');
  override connect(): void {}
  override objectUpdates(): Observable<DomainObject> {
    return EMPTY;
  }
  override telemetry(): Observable<TelemetryValue> {
    return EMPTY;
  }
}

function snapshotWithSegments(segments: string[]): ActivatedRouteSnapshot {
  return {
    url: segments.map((segment) => new UrlSegment(segment, {})),
  } as ActivatedRouteSnapshot;
}

async function resolve(
  segments: string[],
): Promise<DomainObject[] | RedirectCommand> {
  const result = TestBed.runInInjectionContext(() =>
    browseResolver(snapshotWithSegments(segments), {} as RouterStateSnapshot),
  );
  return firstValueFrom(result as Observable<DomainObject[] | RedirectCommand>);
}

describe('browseResolver', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ObjectsGateway, useClass: ObjectsGatewayStub },
        { provide: RealtimeGateway, useClass: RealtimeGatewayStub },
      ],
    });
  });

  describe('OMCT-C15-L2-01.03 browse path resolution', () => {
    it('resolves each segment into a domain object and sets the document title', async () => {
      const resolved = (await resolve(['mine', 'station-displays'])) as DomainObject[];

      expect(resolved.map((object) => object.keyString)).toEqual(['mine', 'station-displays']);
      expect(document.title).toBe('Station displays');
    });
  });

  describe('OMCT-C15-L2-01.04 root browse redirect', () => {
    it('redirects the root browse route to the last child of root composition', async () => {
      const result = (await resolve([])) as RedirectCommand;

      expect(result).toBeInstanceOf(RedirectCommand);
      expect(result.redirectTo.toString()).toBe('/browse/mine');
    });
  });
});
