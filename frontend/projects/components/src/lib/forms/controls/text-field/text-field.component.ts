import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { FormControlModel } from '../../form-control-model';

@Component({
  selector: 'cp-text-field',
  templateUrl: './text-field.component.html',
  styleUrl: './text-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextFieldComponent {
  readonly control = input.required<FormControlModel>();
  readonly value = input<unknown>();
  readonly valueChange = output<unknown>();

  protected onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }
}
