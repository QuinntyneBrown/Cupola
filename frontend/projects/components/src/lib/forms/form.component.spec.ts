import { ComponentRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormComponent } from './form.component';
import { FormStructure } from './form-structure';
import { FORMS_CONTROL_SOURCE } from './forms-control-source';
import { FormsService } from './forms.service';

describe('OMCT-C15-L2-04.03 FormComponent presentation', () => {
  let fixture: ComponentFixture<FormComponent>;
  let ref: ComponentRef<FormComponent>;

  const structure: FormStructure = {
    title: 'Edit properties',
    rows: [{ key: 'name', name: 'Title', control: 'textfield', value: 'Original', required: true }],
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: FORMS_CONTROL_SOURCE, useExisting: FormsService }],
    });
    fixture = TestBed.createComponent(FormComponent);
    ref = fixture.componentRef;
    ref.setInput('structure', structure);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  function input(): HTMLInputElement {
    return fixture.nativeElement.querySelector('[data-testid="form-control"]');
  }

  it('mounts the form control for each row', () => {
    expect(input()).not.toBeNull();
    expect(input().value).toBe('Original');
  });

  it('emits the changed values on save', async () => {
    let saved: Record<string, unknown> | undefined;
    ref.instance.saved.subscribe((values) => (saved = values));

    input().value = 'Renamed';
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-testid="form-save"]').click();

    expect(saved).toEqual({ name: 'Renamed' });
  });

  it('emits cancel without values when cancelled', () => {
    let cancelled = false;
    ref.instance.cancelled.subscribe(() => (cancelled = true));

    fixture.nativeElement.querySelector('[data-testid="form-cancel"]').click();

    expect(cancelled).toBe(true);
  });

  it('blocks save while a required field is empty', () => {
    input().value = '';
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const save = fixture.nativeElement.querySelector('[data-testid="form-save"]') as HTMLButtonElement;
    expect(save.disabled).toBe(true);
  });
});
