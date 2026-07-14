import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SplitterComponent } from '@cupola/components';

import { AppBarComponent } from '../app-bar/app-bar.component';
import { ConductorComponent } from '../conductor/conductor.component';
import { InspectorPaneComponent } from '../inspector-pane/inspector-pane.component';
import { StatusBarComponent } from '../status-bar/status-bar.component';
import { TreePaneComponent } from '../tree-pane/tree-pane.component';

const TREE_MIN = 240;
const TREE_MAX = 320;
const INSPECTOR_MIN = 280;
const INSPECTOR_MAX = 360;

@Component({
  selector: 'cp-app-shell',
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    SplitterComponent,
    AppBarComponent,
    TreePaneComponent,
    InspectorPaneComponent,
    ConductorComponent,
    StatusBarComponent,
  ],
})
export class AppShellComponent {
  protected readonly treeWidth = signal(264);
  protected readonly inspectorWidth = signal(300);

  protected resizeTree(delta: number): void {
    this.treeWidth.set(clamp(this.treeWidth() + delta, TREE_MIN, TREE_MAX));
  }

  protected resizeInspector(delta: number): void {
    this.inspectorWidth.set(clamp(this.inspectorWidth() - delta, INSPECTOR_MIN, INSPECTOR_MAX));
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
