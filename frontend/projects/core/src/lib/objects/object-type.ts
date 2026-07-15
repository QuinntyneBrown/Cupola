import { DomainObject } from '../models/domain-object';

/**
 * Definition contributed to the {@link TypeRegistry} for a domain-object type
 * (OMCT-C02-L2-01.02).
 */
export interface ObjectTypeDefinition {
  key: string;
  name: string;
  description?: string;
  glyph?: string;
  /** Whether operators may create objects of this type. */
  creatable?: boolean;
  /** Applies default model values to a newly created object of this type. */
  initialize?: (object: DomainObject) => void;
}

/** A registered type in its standardized form: {@link creatable} always resolved. */
export interface ObjectType extends ObjectTypeDefinition {
  creatable: boolean;
}
