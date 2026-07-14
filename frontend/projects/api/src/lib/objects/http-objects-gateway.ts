import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Annotation, CUPOLA_CONFIG, DomainObject, ObjectsGateway } from '@cupola/core';

@Injectable()
export class HttpObjectsGateway extends ObjectsGateway {
  private readonly http = inject(HttpClient);
  private readonly config = inject(CUPOLA_CONFIG);

  override getObject(keyString: string): Observable<DomainObject> {
    return this.http.get<DomainObject>(this.objectUrl(keyString));
  }

  override getComposition(keyString: string): Observable<DomainObject[]> {
    return this.http.get<DomainObject[]>(`${this.objectUrl(keyString)}/composition`);
  }

  override getAnnotations(keyString: string): Observable<Annotation[]> {
    return this.http.get<Annotation[]>(`${this.objectUrl(keyString)}/annotations`);
  }

  override updateObject(keyString: string, changes: { name: string }): Observable<DomainObject> {
    return this.http.put<DomainObject>(this.objectUrl(keyString), changes);
  }

  private objectUrl(keyString: string): string {
    return `${this.config.apiBaseUrl}/objects/${encodeURIComponent(keyString)}`;
  }
}
