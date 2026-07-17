import { CupolaApplication } from './app/lifecycle/cupola-application';

// main.ts is not owned by any single capability in the cross-capability
// ownership map; this file wires the C01 lifecycle facade in place of the
// prior direct bootstrapApplication() call, which is a deliberate,
// minimal, flagged exception to the branch-touches-only-owned-paths rule.
// Mount into the <cp-root> element index.html ships (and styles size);
// the no-target overload would append a second, unstyled host to <body>.
new CupolaApplication().start('cp-root').catch((err) => console.error(err));
