import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { FormControlModel } from '../../form-control-model';

@Component({
  selector: 'cp-file-input',
  templateUrl: './file-input.component.html',
  styleUrl: './file-input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileInputComponent {
  readonly control = input.required<FormControlModel>();
  readonly value = input<unknown>();
  readonly valueChange = output<unknown>();

  protected onChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.valueChange.emit(file ? file.name : null);
  }
}
