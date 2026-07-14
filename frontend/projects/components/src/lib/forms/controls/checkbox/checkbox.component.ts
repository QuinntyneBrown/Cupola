import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { FormControlModel } from '../../form-control-model';

@Component({
  selector: 'cp-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxComponent {
  readonly control = input.required<FormControlModel>();
  readonly value = input<unknown>();
  readonly valueChange = output<unknown>();

  protected onChange(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).checked);
  }
}
