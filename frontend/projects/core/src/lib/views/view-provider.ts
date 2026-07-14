import { DomainObject } from '../models/domain-object';
import { CupolaView } from './cupola-view';

export interface ViewProvider {
  key: string;
  name: string;
  glyph?: string;
  priority?: number;
  canView(object: DomainObject, objectPath: DomainObject[]): boolean;
  view(object: DomainObject, objectPath: DomainObject[]): CupolaView;
}
