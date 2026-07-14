import { InjectionToken } from '@angular/core';

export interface CupolaConfig {
  apiBaseUrl: string;
  hubUrl: string;
}

export const CUPOLA_CONFIG = new InjectionToken<CupolaConfig>('CUPOLA_CONFIG');
