import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { FormControlModel } from '../../form-control-model';

@Component({
  selector: 'cp-toggle-switch',
  templateUrl: './toggle-switch.component.html',
  styleUrl: './toggle-switch.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleSwitchComponent {
  readonly control = input.required<FormControlModel>();
  readonly value = input<unknown>();
  readonly valueChange = output<unknown>();

  protected toggle(): void {
    this.valueChange.emit(!this.value());
  }
}
