import { InputSignal, OutputEmitterRef } from '@angular/core';

import { FormControlModel } from './form-control-model';

/** The signal-based contract every form-control component implements. */
export interface FormControlComponent {
  control: InputSignal<FormControlModel>;
  value: InputSignal<unknown>;
  valueChange: OutputEmitterRef<unknown>;
}
