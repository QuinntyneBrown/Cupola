import { InjectionToken } from '@angular/core';

export interface CupolaConfig {
  apiBaseUrl: string;
  hubUrl: string;
  /** Base path for static assets. Requirements: OMCT-C01-L2-03.01, 03.02. */
  assetPath?: string;
}

export const CUPOLA_CONFIG = new InjectionToken<CupolaConfig>('CUPOLA_CONFIG');
