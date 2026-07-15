import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Annotation,
  CUPOLA_CONFIG,
  DomainObject,
  ObjectSaveResult,
  ObjectsGateway,
} from '@cupola/core';

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

  override saveObject(object: DomainObject): Observable<ObjectSaveResult> {
    return this.http
      .post<ObjectSaveResult>(`${this.config.apiBaseUrl}/objects`, object)
      .pipe(catchError((error: HttpErrorResponse) => this.conflictAsResult(error)));
  }

  override getObjects(keyStrings: string[]): Observable<DomainObject[]> {
    return this.http.post<DomainObject[]>(`${this.config.apiBaseUrl}/objects/batch-get`, {
      keyStrings,
    });
  }

  override saveObjects(objects: DomainObject[]): Observable<ObjectSaveResult[]> {
    return this.http.post<ObjectSaveResult[]>(`${this.config.apiBaseUrl}/objects/batch`, objects);
  }

  /** A 409 carries an ObjectSaveResult body; report it as a result, not an error (B04). */
  private conflictAsResult(error: HttpErrorResponse): Observable<ObjectSaveResult> {
    if (error.status === 409 && error.error) {
      return of(error.error as ObjectSaveResult);
    }
    return throwError(() => error);
  }

  private objectUrl(keyString: string): string {
    return `${this.config.apiBaseUrl}/objects/${encodeURIComponent(keyString)}`;
  }
}
