/**
 * Third-party license disclosure data (C16, OMCT-C16-L2-06.03).
 *
 * The Cupola equivalent of Open MCT's `third-party-licenses.json`: the runtime
 * dependencies bundled into the distributed application and their licenses.
 */
export interface ThirdPartyLicense {
  name: string;
  version: string;
  license: string;
}

export const THIRD_PARTY_LICENSES: readonly ThirdPartyLicense[] = [
  { name: '@angular/core', version: '21.2.x', license: 'MIT' },
  { name: '@angular/common', version: '21.2.x', license: 'MIT' },
  { name: '@angular/router', version: '21.2.x', license: 'MIT' },
  { name: '@angular/cdk', version: '21.2.x', license: 'MIT' },
  { name: 'rxjs', version: '7.8.x', license: 'Apache-2.0' },
  { name: '@microsoft/signalr', version: '8.0.x', license: 'MIT' },
  { name: 'tslib', version: '2.3.x', license: '0BSD' },
];
