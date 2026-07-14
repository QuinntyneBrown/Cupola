import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  viewChildren,
} from '@angular/core';

import { FormStructure } from './form-structure';
import { FORMS_CONTROL_SOURCE, FormsControlSource } from './forms-control-source';

/**
 * Renders a form structure, collecting changed values and resolving or
 * rejecting when save or cancel occurs.
 * Requirement: OMCT-C15-L2-04.03.
 */
@Component({
  selector: 'cp-form',
  templateUrl: './form.component.html',
  styleUrl: './form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormComponent {
  private readonly controls = inject<FormsControlSource>(FORMS_CONTROL_SOURCE);
  private readonly cells = viewChildren<ElementRef<HTMLElement>>('cell');

  readonly structure = input.required<FormStructure>();
  readonly saved = output<Record<string, unknown>>();
  readonly cancelled = output<void>();

  private readonly values = linkedSignal<Record<string, unknown>>(() =>
    Object.fromEntries(this.structure().rows.map((row) => [row.key, row.value])),
  );
  private readonly changed = new Set<string>();
  private mounted = false;

  protected readonly valid = computed(() => {
    const values = this.values();
    return this.structure().rows.every(
      (row) => !row.required || !isEmpty(values[row.key]),
    );
  });

  constructor() {
    afterRenderEffect(() => {
      const cells = this.cells();
      if (this.mounted || cells.length === 0) {
        return;
      }
      this.mounted = true;
      const rows = this.structure().rows;
      cells.forEach((cell, index) => {
        const row = rows[index];
        const provider = this.controls.getFormControl(row.control);
        provider.show(
          cell.nativeElement,
          {
            key: row.key,
            name: row.name,
            value: row.value,
            required: row.required,
            placeholder: row.placeholder,
            options: row.options,
          },
          (value) => this.onChange(row.key, value),
        );
      });
    });
  }

  protected save(): void {
    if (!this.valid()) {
      return;
    }
    const values = this.values();
    const result: Record<string, unknown> = {};
    for (const key of this.changed) {
      result[key] = values[key];
    }
    this.saved.emit(result);
  }

  protected cancel(): void {
    this.cancelled.emit();
  }

  private onChange(key: string, value: unknown): void {
    this.changed.add(key);
    this.values.update((values) => ({ ...values, [key]: value }));
  }
}

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}
