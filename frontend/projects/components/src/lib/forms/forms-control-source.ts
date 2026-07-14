import { InjectionToken } from '@angular/core';

import { FormControlProvider } from './form-control-provider';

/** Lets FormComponent resolve control providers without importing FormsService. */
export interface FormsControlSource {
  getFormControl(name: string): FormControlProvider;
}

export const FORMS_CONTROL_SOURCE = new InjectionToken<FormsControlSource>('FORMS_CONTROL_SOURCE');
