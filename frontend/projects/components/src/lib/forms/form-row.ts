import { FormControlOption } from './form-control-model';

export interface FormRow {
  key: string;
  name: string;
  /** The registered control name (e.g. 'textfield', 'select'). */
  control: string;
  value: unknown;
  required?: boolean;
  placeholder?: string;
  options?: FormControlOption[];
}
