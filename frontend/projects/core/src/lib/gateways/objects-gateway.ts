import { Observable } from 'rxjs';

import { Annotation } from '../models/annotation';
import { DomainObject } from '../models/domain-object';

export abstract class ObjectsGateway {
  abstract getObject(keyString: string): Observable<DomainObject>;
  abstract getComposition(keyString: string): Observable<DomainObject[]>;
  abstract getAnnotations(keyString: string): Observable<Annotation[]>;
  abstract updateObject(keyString: string, changes: { name: string }): Observable<DomainObject>;
}
