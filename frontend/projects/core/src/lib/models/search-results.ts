import { Annotation } from './annotation';
import { DomainObject } from './domain-object';

export interface SearchResults {
  objects: DomainObject[];
  annotations: Annotation[];
}
