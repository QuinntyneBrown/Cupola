import { ApplicationRef, ComponentRef, EnvironmentInjector, Type, createComponent } from '@angular/core';

import { FormControlComponent } from './form-control-component';
import { FormControlModel } from './form-control-model';
import { FormControlProvider } from './form-control-provider';

/** Mounts an Angular form-control component as a FormControlProvider. */
export class ComponentControlProvider extends FormControlProvider {
  private readonly refs = new Map<HTMLElement, ComponentRef<FormControlComponent>>();

  constructor(
    private readonly environmentInjector: EnvironmentInjector,
    private readonly component: Type<FormControlComponent>,
  ) {
    super();
  }

  override show(
    element: HTMLElement,
    control: FormControlModel,
    onChange: (value: unknown) => void,
  ): void {
    const ref = createComponent(this.component, { environmentInjector: this.environmentInjector });
    ref.setInput('control', control);
    ref.setInput('value', control.value);
    ref.instance.valueChange.subscribe(onChange);
    this.environmentInjector.get(ApplicationRef).attachView(ref.hostView);
    element.appendChild(ref.location.nativeElement);
    this.refs.set(element, ref);
  }

  override destroy(element: HTMLElement): void {
    this.refs.get(element)?.destroy();
    this.refs.delete(element);
  }
}
