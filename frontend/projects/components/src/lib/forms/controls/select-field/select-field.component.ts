import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { FormControlModel } from '../../form-control-model';

@Component({
  selector: 'cp-select-field',
  templateUrl: './select-field.component.html',
  styleUrl: './select-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectFieldComponent {
  readonly control = input.required<FormControlModel>();
  readonly value = input<unknown>();
  readonly valueChange = output<unknown>();

  protected onChange(event: Event): void {
    const index = (event.target as HTMLSelectElement).selectedIndex;
    const option = this.control().options?.[index];
    this.valueChange.emit(option ? option.value : null);
  }

  protected isSelected(optionValue: unknown): boolean {
    return optionValue === this.value();
  }
}
