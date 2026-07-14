import {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  Type,
  createComponent,
} from '@angular/core';
import { CupolaView } from '@cupola/core';

/**
 * Wraps an Angular component as a CupolaView so providers can return
 * components from `view()`.
 */
export function componentView<T>(
  environmentInjector: EnvironmentInjector,
  component: Type<T>,
  inputs: Record<string, unknown> = {},
): CupolaView {
  let componentRef: ComponentRef<T> | null = null;
  return {
    show(element: HTMLElement): void {
      componentRef = createComponent(component, { environmentInjector });
      for (const [name, value] of Object.entries(inputs)) {
        componentRef.setInput(name, value);
      }
      environmentInjector.get(ApplicationRef).attachView(componentRef.hostView);
      element.appendChild(componentRef.location.nativeElement);
    },
    destroy(): void {
      componentRef?.destroy();
      componentRef = null;
    },
  };
}
