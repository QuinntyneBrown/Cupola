import { ChangeDetectionStrategy, Component } from '@angular/core';

import { MIT_LICENSE_TEXT } from './mit-license';
import { THIRD_PARTY_LICENSES } from './third-party-licenses';

/**
 * The third-party license route. Rendered by the `/licenses` route as a
 * full-screen, nondismissible overlay listing the project's MIT license and the
 * licenses of bundled third-party dependencies. OMCT-C16-L2-06.02, OMCT-C16-L2-06.03.
 */
@Component({
  selector: 'cp-licenses',
  templateUrl: './licenses.component.html',
  styleUrl: './licenses.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LicensesComponent {
  protected readonly licenseText = MIT_LICENSE_TEXT;
  protected readonly thirdParty = THIRD_PARTY_LICENSES;
}
