import { SelectedItem } from '../selection/selected-item';
import { ToolbarControl } from './toolbar-control';

export interface ToolbarProvider {
  key: string;
  forSelection(selection: SelectedItem[]): boolean;
  toolbar(selection: SelectedItem[]): ToolbarControl[];
}
