import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { FormControlModel } from '../../form-control-model';

@Component({
  selector: 'cp-composite',
  templateUrl: './composite.component.html',
  styleUrl: './composite.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompositeComponent {
  readonly control = input.required<FormControlModel>();
  readonly value = input<unknown>();
  readonly valueChange = output<unknown>();

  protected onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }
}
