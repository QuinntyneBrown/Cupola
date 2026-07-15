import { CupolaApplication } from './cupola-application';

/**
 * A plugin installation function. Requirement: OMCT-C01-L2-01.01 — cupola
 * invokes each installed plugin exactly once with the active application
 * instance, giving the plugin the opportunity to register extensions on
 * the `@cupola/core` registries reachable through that instance.
 */
export type CupolaPlugin = (application: CupolaApplication) => void;
