import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { FormControlModel } from '../../form-control-model';

@Component({
  selector: 'cp-text-area',
  templateUrl: './text-area.component.html',
  styleUrl: './text-area.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextAreaComponent {
  readonly control = input.required<FormControlModel>();
  readonly value = input<unknown>();
  readonly valueChange = output<unknown>();

  protected onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLTextAreaElement).value);
  }
}
