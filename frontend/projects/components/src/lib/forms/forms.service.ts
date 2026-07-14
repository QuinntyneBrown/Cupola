import { EnvironmentInjector, Injectable, Type, inject } from '@angular/core';

import { OverlayService } from '../overlays/overlay.service';
import { AutocompleteComponent } from './controls/autocomplete/autocomplete.component';
import { CheckboxComponent } from './controls/checkbox/checkbox.component';
import { CompositeComponent } from './controls/composite/composite.component';
import { DatetimeComponent } from './controls/datetime/datetime.component';
import { FileInputComponent } from './controls/file-input/file-input.component';
import { LocatorComponent } from './controls/locator/locator.component';
import { NumberFieldComponent } from './controls/number-field/number-field.component';
import { SelectFieldComponent } from './controls/select-field/select-field.component';
import { TextAreaComponent } from './controls/text-area/text-area.component';
import { TextFieldComponent } from './controls/text-field/text-field.component';
import { ToggleSwitchComponent } from './controls/toggle-switch/toggle-switch.component';
import { ComponentControlProvider } from './component-control-provider';
import { FormControlComponent } from './form-control-component';
import { FormControlProvider } from './form-control-provider';
import { FormStructure } from './form-structure';
import { FormsControlSource } from './forms-control-source';
import { formView } from './form-view';

/**
 * Provides default and custom form controls and renders form structures in
 * a supplied element or an overlay dialog.
 * Requirements: OMCT-C15-L2-04.01, OMCT-C15-L2-04.02, OMCT-C15-L2-04.03.
 */
@Injectable({ providedIn: 'root' })
export class FormsService implements FormsControlSource {
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly overlays = inject(OverlayService);
  private readonly controls = new Map<string, FormControlProvider>();

  constructor() {
    const defaults: [string, Type<FormControlComponent>][] = [
      ['autocomplete', AutocompleteComponent],
      ['checkbox', CheckboxComponent],
      ['composite', CompositeComponent],
      ['datetime', DatetimeComponent],
      ['file-input', FileInputComponent],
      ['locator', LocatorComponent],
      ['numberfield', NumberFieldComponent],
      ['select', SelectFieldComponent],
      ['textarea', TextAreaComponent],
      ['textfield', TextFieldComponent],
      ['toggleSwitch', ToggleSwitchComponent],
    ];
    for (const [name, component] of defaults) {
      this.controls.set(name, new ComponentControlProvider(this.environmentInjector, component));
    }
  }

  getFormControl(name: string): FormControlProvider {
    const provider = this.controls.get(name);
    if (!provider) {
      throw new Error(`Unknown form control: ${name}`);
    }
    return provider;
  }

  addNewFormControl(name: string, provider: FormControlProvider): void {
    this.controls.set(name, provider);
  }

  /** Renders a form into the supplied element, resolving on save. */
  showCustomForm(structure: FormStructure, element: HTMLElement): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const view = formView(
        this.environmentInjector,
        structure,
        resolve,
        () => reject(new Error('cancelled')),
      );
      view.show(element);
    });
  }

  /** Renders a form in an overlay dialog, resolving on save. */
  showForm(structure: FormStructure): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      let dismiss = () => {};
      const view = formView(
        this.environmentInjector,
        structure,
        (values) => {
          dismiss();
          resolve(values);
        },
        () => {
          dismiss();
          reject(new Error('cancelled'));
        },
      );
      const overlay = this.overlays.show({ view, size: 'small', dismissible: true });
      dismiss = () => overlay.dismiss();
    });
  }
}
