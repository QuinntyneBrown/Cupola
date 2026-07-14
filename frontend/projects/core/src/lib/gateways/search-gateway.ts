import { Observable } from 'rxjs';

import { SearchResults } from '../models/search-results';

export abstract class SearchGateway {
  abstract search(query: string): Observable<SearchResults>;
}
