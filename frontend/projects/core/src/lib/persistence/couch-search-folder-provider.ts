import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { SearchGateway } from '../gateways/search-gateway';
import { DomainObject } from '../models/domain-object';

export interface CouchSearchFolder extends DomainObject {
  type: 'couch-search-folder';
  query: string;
}

@Injectable({ providedIn: 'root' })
export class CouchSearchFolderProvider {
  private readonly search = inject(SearchGateway);

  appliesTo(object: DomainObject): object is CouchSearchFolder {
    return object.type === 'couch-search-folder' && typeof object.query === 'string';
  }

  load(folder: CouchSearchFolder): Observable<DomainObject[]> {
    return this.search.search(folder.query).pipe(map((results) => results.objects));
  }
}
