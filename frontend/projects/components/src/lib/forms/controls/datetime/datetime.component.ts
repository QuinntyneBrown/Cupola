import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { FormControlModel } from '../../form-control-model';

@Component({
  selector: 'cp-datetime',
  templateUrl: './datetime.component.html',
  styleUrl: './datetime.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatetimeComponent {
  readonly control = input.required<FormControlModel>();
  readonly value = input<unknown>();
  readonly valueChange = output<unknown>();

  protected onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }
}
