# ADR 0002 — CDK primitives with design-token-styled custom components

- Status: Accepted
- Date: 2026-07-14
- Capability: C15 — User-interface shell

## Context

The design system in `docs/mocks/design-system/` defines a dark "Console"
theme as custom `.cp-*` CSS driven by the tokens in `assets/tokens.css`. The
shell needs overlay positioning, focus management, and a tree, which are
non-trivial to build correctly from scratch. The design-system README refers
to Angular Material 17, but the workspace is Angular 21 and the mocks do not
resemble Material components.

## Decision

Install `@angular/cdk` (v21) for behavioural primitives — the overlay module
(menus, super-menus, tooltips, dialogs) and portals — and build custom
components styled from the design tokens. Do not install Angular Material.

The tokens are shipped as installable theme stylesheets
(`theme-darkmatter.css` is a copy of `tokens.css`; espresso and snow override
surface/ink tokens). `assets/components.css` is adapted into the app's global
`cp-components.css`.

## Consequences

- The visual output matches the mocks without re-theming Material.
- CDK handles overlay positioning and accessibility, avoiding hand-rolled
  focus trapping and coordinate math.
- The team owns the component markup and can keep it aligned with the tokens
  as the design system evolves.
