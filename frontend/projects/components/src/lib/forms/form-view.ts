import { ApplicationRef, ComponentRef, EnvironmentInjector, createComponent } from '@angular/core';
import { CupolaView } from '@cupola/core';

import { FormComponent } from './form.component';
import { FormStructure } from './form-structure';

/** Mounts a FormComponent as a CupolaView, wiring its save/cancel outputs. */
export function formView(
  environmentInjector: EnvironmentInjector,
  structure: FormStructure,
  onSave: (values: Record<string, unknown>) => void,
  onCancel: () => void,
): CupolaView {
  let ref: ComponentRef<FormComponent> | null = null;
  return {
    show(element: HTMLElement): void {
      ref = createComponent(FormComponent, { environmentInjector });
      ref.setInput('structure', structure);
      ref.instance.saved.subscribe(onSave);
      ref.instance.cancelled.subscribe(onCancel);
      environmentInjector.get(ApplicationRef).attachView(ref.hostView);
      element.appendChild(ref.location.nativeElement);
    },
    destroy(): void {
      ref?.destroy();
      ref = null;
    },
  };
}
