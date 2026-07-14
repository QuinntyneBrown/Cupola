import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'cp-conductor',
  templateUrl: './conductor.component.html',
  styleUrl: './conductor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConductorComponent {}
