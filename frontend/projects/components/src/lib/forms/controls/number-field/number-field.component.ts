import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { FormControlModel } from '../../form-control-model';

@Component({
  selector: 'cp-number-field',
  templateUrl: './number-field.component.html',
  styleUrl: './number-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberFieldComponent {
  readonly control = input.required<FormControlModel>();
  readonly value = input<unknown>();
  readonly valueChange = output<unknown>();

  protected onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.valueChange.emit(raw === '' ? null : Number(raw));
  }
}
