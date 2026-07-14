/**
 * A view instance created by a view provider. The registry stamps `key`
 * and `parentElement` onto the view before `show` runs.
 */
export interface CupolaView {
  key?: string;
  parentElement?: HTMLElement;
  show(element: HTMLElement): void;
  destroy(): void;
}
