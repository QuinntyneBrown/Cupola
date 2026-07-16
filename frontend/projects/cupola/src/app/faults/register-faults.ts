import { EnvironmentInjector, inject } from '@angular/core';
import {
  FaultManagementService,
  InspectorViewRegistry,
  ObjectApi,
  RootRegistry,
  TypeRegistry,
  ViewRegistry,
} from '@cupola/core';
import { FakeFaultProvider } from '@cupola/api';

import { FaultInspectorViewProvider } from './fault-inspector/fault-inspector-view-provider';
import { FaultListViewProvider } from './fault-list/fault-list-view-provider';
import { FAULT_ROOT_KEY, FaultRootProvider } from './fault-root-provider';

/**
 * Registers the fault-management root object with its list and inspector views
 * and configures the fault provider. Must run inside an injection context (the
 * app initializer).
 *
 * Requirements: OMCT-C14-L2-03.01, OMCT-C14-L2-03.02.
 */
export function registerFaults(): void {
  inject(TypeRegistry).register({
    key: 'fault-management',
    name: 'Fault Management',
    glyph: 'alert-triangle',
    creatable: false,
  });

  inject(ObjectApi).registerProvider('fault', new FaultRootProvider());
  inject(RootRegistry).addRoot(FAULT_ROOT_KEY);

  const injector = inject(EnvironmentInjector);
  inject(ViewRegistry).register(new FaultListViewProvider(injector));
  inject(InspectorViewRegistry).register(new FaultInspectorViewProvider(injector));

  inject(FaultManagementService).setProvider(new FakeFaultProvider());
}
