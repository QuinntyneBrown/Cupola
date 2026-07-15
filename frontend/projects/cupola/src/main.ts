import { CupolaApplication } from './app/lifecycle/cupola-application';

// main.ts is not owned by any single capability in the cross-capability
// ownership map; this file wires the C01 lifecycle facade in place of the
// prior direct bootstrapApplication() call, which is a deliberate,
// minimal, flagged exception to the branch-touches-only-owned-paths rule.
new CupolaApplication().start().catch((err) => console.error(err));
