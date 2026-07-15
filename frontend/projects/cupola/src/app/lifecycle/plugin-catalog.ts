import { CupolaPlugin } from './cupola-plugin';

/**
 * Published catalog of the optional plugins cupola ships. Requirement:
 * OMCT-C01-L2-01.04 — an integrator reads the catalog through
 * `application.plugins`.
 *
 * Cupola has not shipped an optional, integrator-installable plugin yet;
 * baseline product views and actions register unconditionally during
 * startup (OMCT-C01-L2-01.03) rather than through this catalog. Later
 * capability waves add entries here as they ship optional behavior.
 */
export const cupolaPlugins: Readonly<Record<string, CupolaPlugin>> = Object.freeze({});
