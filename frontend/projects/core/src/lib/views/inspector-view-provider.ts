import { SelectedItem } from '../selection/selected-item';
import { CupolaView } from './cupola-view';

export interface InspectorViewProvider {
  key: string;
  name: string;
  glyph: string;
  priority?: number;
  canView(selection: SelectedItem[]): boolean;
  view(selection: SelectedItem[]): CupolaView;
}
