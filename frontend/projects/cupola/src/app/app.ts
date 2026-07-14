import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AppShellComponent } from './shell/app-shell/app-shell.component';

@Component({
  selector: 'cp-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppShellComponent],
})
export class App {}
