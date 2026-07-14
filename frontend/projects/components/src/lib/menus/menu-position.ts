import { MenuPlacement } from './menu-placement';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Computes the top-left position of a menu of `menu` size anchored to
 * `anchor` with the requested `placement`, clamped to `viewport`.
 * Requirement: OMCT-C15-L2-03.04.
 */
export function calculateMenuPosition(
  anchor: Rect,
  menu: Size,
  placement: MenuPlacement,
  viewport: Size,
): Point {
  let x: number;
  let y: number;

  switch (placement) {
    case 'bottom-start':
      x = anchor.x;
      y = anchor.y + anchor.height;
      break;
    case 'bottom-end':
      x = anchor.x + anchor.width - menu.width;
      y = anchor.y + anchor.height;
      break;
    case 'top-start':
      x = anchor.x;
      y = anchor.y - menu.height;
      break;
    case 'top-end':
      x = anchor.x + anchor.width - menu.width;
      y = anchor.y - menu.height;
      break;
    case 'right-start':
      x = anchor.x + anchor.width;
      y = anchor.y;
      break;
    case 'left-start':
      x = anchor.x - menu.width;
      y = anchor.y;
      break;
  }

  return {
    x: clamp(x, 0, Math.max(0, viewport.width - menu.width)),
    y: clamp(y, 0, Math.max(0, viewport.height - menu.height)),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
