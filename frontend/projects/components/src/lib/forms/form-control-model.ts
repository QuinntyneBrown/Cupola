export interface FormControlOption {
  name: string;
  value: unknown;
}

export interface FormControlModel {
  key: string;
  name?: string;
  value: unknown;
  required?: boolean;
  placeholder?: string;
  options?: FormControlOption[];
}
