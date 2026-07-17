import { LayoutConfiguration, LayoutItem, newLayoutItem } from './layout-model';

export interface ReconcileResult {
  items: LayoutItem[];
  changed: boolean;
}

/**
 * Synchronizes layout-item configuration with the layout's composition
 * (OMCT-C09-L2-01.02): a composed child without a sub-object item gets a
 * default-geometry item; a sub-object item whose child left composition is
 * dropped. Drawing items (text/image/box/line) are layout-only and untouched.
 */
export function reconcileLayoutItems(
  configuration: LayoutConfiguration,
  composition: string[],
): ReconcileResult {
  const items = configuration.items ?? [];
  const composed = new Set(composition);
  const referenced = new Set(
    items
      .filter((item) => item.kind === 'subobject' && item.keyString)
      .map((item) => item.keyString!),
  );

  const kept = items.filter(
    (item) => item.kind !== 'subobject' || (item.keyString !== undefined && composed.has(item.keyString)),
  );

  const additions = composition
    .filter((keyString) => !referenced.has(keyString))
    .map((keyString, index) => newLayoutItem('subobject', kept.length + index, { keyString }));

  const next = [...kept, ...additions];
  const changed = additions.length > 0 || kept.length !== items.length;

  return { items: changed ? next : items, changed };
}

/**
 * Sub-object references not yet present in composition — the paste path's
 * composition repairs, applied before the configuration save so the browse-mode
 * reconciler never drops a just-pasted item (OMCT-C09-L2-01.05).
 */
export function unresolvedReferences(items: LayoutItem[], composition: string[]): string[] {
  const composed = new Set(composition);
  return [
    ...new Set(
      items
        .filter(
          (item) => item.kind === 'subobject' && item.keyString && !composed.has(item.keyString),
        )
        .map((item) => item.keyString!),
    ),
  ];
}
