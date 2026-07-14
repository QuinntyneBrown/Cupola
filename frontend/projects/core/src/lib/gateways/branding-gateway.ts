import { Observable } from 'rxjs';

import { BrandingInfo } from '../models/branding-info';
import { BuildInfo } from '../models/build-info';

export abstract class BrandingGateway {
  abstract getBranding(): Observable<BrandingInfo>;
  abstract getBuildInfo(): Observable<BuildInfo>;
}
