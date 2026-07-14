import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BrandingGateway, BrandingInfo, BuildInfo, CUPOLA_CONFIG } from '@cupola/core';

@Injectable()
export class HttpBrandingGateway extends BrandingGateway {
  private readonly http = inject(HttpClient);
  private readonly config = inject(CUPOLA_CONFIG);

  override getBranding(): Observable<BrandingInfo> {
    return this.http.get<BrandingInfo>(`${this.config.apiBaseUrl}/branding`);
  }

  override getBuildInfo(): Observable<BuildInfo> {
    return this.http.get<BuildInfo>(`${this.config.apiBaseUrl}/branding/build-info`);
  }
}
