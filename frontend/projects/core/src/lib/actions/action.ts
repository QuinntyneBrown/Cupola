import { DomainObject } from '../models/domain-object';

export interface ActionContext {
  objectPath: DomainObject[];
  viewKey?: string;
  viewParentElement?: HTMLElement;
}

export interface Action {
  key: string;
  name: string;
  description?: string;
  glyph?: string;
  group?: string;
  priority?: number;
  showInStatusBar?: boolean;
  appliesTo?(context: ActionContext): boolean;
  invoke(context: ActionContext): void;
}
