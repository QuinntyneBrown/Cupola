import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { FormControlModel } from '../../form-control-model';

@Component({
  selector: 'cp-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrl: './autocomplete.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteComponent {
  readonly control = input.required<FormControlModel>();
  readonly value = input<unknown>();
  readonly valueChange = output<unknown>();

  protected readonly listId = `cp-autocomplete-${Math.round(performance.now())}`;

  protected onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }
}
