import { TestBed } from '@angular/core/testing';

import { FormControlModel } from './form-control-model';
import { FormControlProvider } from './form-control-provider';
import { FormsService } from './forms.service';

const DEFAULT_CONTROL_NAMES = [
  'autocomplete',
  'checkbox',
  'composite',
  'datetime',
  'file-input',
  'locator',
  'numberfield',
  'select',
  'textarea',
  'textfield',
  'toggleSwitch',
];

describe('OMCT-C15-L2-04.01 FormsService default controls', () => {
  let service: FormsService;

  beforeEach(() => {
    service = TestBed.inject(FormsService);
  });

  it('returns a control provider with show and destroy functions for each default control', () => {
    for (const name of DEFAULT_CONTROL_NAMES) {
      const provider = service.getFormControl(name);
      expect(typeof provider.show).toBe('function');
      expect(typeof provider.destroy).toBe('function');
    }
  });

  it('throws for an unknown control name', () => {
    expect(() => service.getFormControl('does-not-exist')).toThrow();
  });
});

describe('OMCT-C15-L2-04.02 FormsService custom controls', () => {
  it('returns a caller-registered provider for a new control name', () => {
    const service = TestBed.inject(FormsService);
    const custom: FormControlProvider = {
      show: (_element: HTMLElement, _control: FormControlModel) => {},
      destroy: () => {},
    };

    service.addNewFormControl('rating', custom);

    expect(service.getFormControl('rating')).toBe(custom);
  });
});
