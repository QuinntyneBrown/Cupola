import { ObjectStyleConfiguration, StyleProperties } from '@cupola/core';

/** Grid unit size in pixels; mirrors the design token `--cp-layout-grid`. */
export const LAYOUT_GRID_PX = 10;

export type LayoutItemKind = 'subobject' | 'text' | 'image' | 'box' | 'line';

/**
 * One display-layout canvas item. Geometry is expressed in 10 px grid units
 * (OMCT-C09-L2-01.03) and persisted at `configuration.layout`.
 */
export interface LayoutItem {
  id: string;
  kind: LayoutItemKind;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Line endpoint (line items only; lines ignore rotation). */
  x2?: number;
  y2?: number;
  rotation: number;
  z: number;
  /** Static presentation styles applied inline. */
  styles?: StyleProperties;
  /** Conditional styles resolved through the B09 style-rule manager. */
  objectStyles?: ObjectStyleConfiguration;
  /** Sub-object items: the embedded object and its preferred view. */
  keyString?: string;
  viewKey?: string;
  hideFrame?: boolean;
  /** Text items. */
  text?: string;
  /** Image items (sanitized before rendering). */
  url?: string;
}

export interface LayoutConfiguration {
  items: LayoutItem[];
}

export function layoutItemId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `item-${Math.floor(Math.random() * 1e9).toString(16)}`;
}

const DEFAULT_SIZE: Record<LayoutItemKind, { w: number; h: number }> = {
  subobject: { w: 24, h: 16 },
  text: { w: 12, h: 3 },
  image: { w: 16, h: 12 },
  box: { w: 12, h: 8 },
  line: { w: 12, h: 1 },
};

/** Creates an item of `kind` with cascading default geometry per slot index. */
export function newLayoutItem(
  kind: LayoutItemKind,
  slot: number,
  over: Partial<LayoutItem> = {},
): LayoutItem {
  const size = DEFAULT_SIZE[kind];
  return {
    id: layoutItemId(),
    kind,
    x: 1 + slot * 2,
    y: 1 + slot * 2,
    w: size.w,
    h: size.h,
    rotation: 0,
    z: slot,
    ...over,
  };
}

export function emptyLayoutConfiguration(): LayoutConfiguration {
  return { items: [] };
}
