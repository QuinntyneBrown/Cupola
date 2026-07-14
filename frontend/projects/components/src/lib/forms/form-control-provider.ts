import { FormControlModel } from './form-control-model';

/**
 * A form-control provider knows how to mount and tear down a single form
 * control in a supplied element.
 * Requirement: OMCT-C15-L2-04.01.
 */
export abstract class FormControlProvider {
  abstract show(
    element: HTMLElement,
    control: FormControlModel,
    onChange: (value: unknown) => void,
  ): void;
  abstract destroy(element: HTMLElement): void;
}
