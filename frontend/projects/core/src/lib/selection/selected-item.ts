import { DomainObject } from '../models/domain-object';

export interface SelectionContext {
  /** Stable identity of the selected thing (keyString, series id, ...). */
  key: string;
  /** Human-readable label for inspectors. */
  label?: string;
  /** The domain object this selection belongs to, when applicable. */
  object?: DomainObject;
  /** Discriminates what kind of thing is selected (object, series, element...). */
  type?: string;
}

export interface SelectedItem {
  element: HTMLElement;
  context: SelectionContext;
}
