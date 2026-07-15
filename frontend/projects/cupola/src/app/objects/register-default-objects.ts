import { inject } from '@angular/core';
import {
  CompositionApi,
  DefaultCompositionProvider,
  GatewaySearchProvider,
  InMemorySearchProvider,
  InterceptorRegistry,
  MissingObjectInterceptor,
  ObjectApi,
  RootObjectCompositionProvider,
  SearchApi,
  TypeRegistry,
} from '@cupola/core';

/**
 * Registers C02 domain-object defaults during application startup: the default
 * types, the missing-object interceptor, the model-backed and root composition
 * providers, and the federated search providers. Must run inside an injection
 * context (the app initializer).
 *
 * Requirements: OMCT-C02-L2-01.02, 01.03, 01.06, 03.01–03.05, 04.01–04.03.
 */
export function registerDefaultObjects(): void {
  inject(TypeRegistry).register({
    key: 'folder',
    name: 'Folder',
    glyph: 'folder',
    creatable: true,
  });

  inject(InterceptorRegistry).register(new MissingObjectInterceptor());

  const composition = inject(CompositionApi);
  composition.addProvider(inject(DefaultCompositionProvider));
  composition.addProvider(inject(RootObjectCompositionProvider));

  const search = inject(SearchApi);
  search.addProvider(inject(GatewaySearchProvider));
  search.addProvider(inject(InMemorySearchProvider));

  // Instantiate the object API so its default gateway provider and user-provenance
  // subscription are live; persisted namespaces route through the default provider.
  inject(ObjectApi);
}
