import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CUPOLA_CONFIG, SearchGateway, SearchResults } from '@cupola/core';

@Injectable()
export class HttpSearchGateway extends SearchGateway {
  private readonly http = inject(HttpClient);
  private readonly config = inject(CUPOLA_CONFIG);

  override search(query: string): Observable<SearchResults> {
    return this.http.get<SearchResults>(`${this.config.apiBaseUrl}/search`, {
      params: { q: query },
    });
  }
}
