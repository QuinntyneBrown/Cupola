import { DomainObject } from './domain-object';

/** Icon sprite id for a domain object, by type and telemetry hints. */
export function objectGlyph(object: DomainObject): string {
  switch (object.type) {
    case 'root':
    case 'folder':
      return 'i-folder';
    case 'overlay-plot':
      return 'i-plot';
    case 'layout':
      return 'i-layout';
    case 'notebook':
      return 'i-notebook';
    case 'telemetry':
      return object.telemetry?.hints.includes('image') ? 'i-camera' : 'i-telemetry';
    default:
      return 'i-folder';
  }
}
