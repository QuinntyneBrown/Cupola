import { Routes } from '@angular/router';

import { BrowseComponent } from './browse/browse.component';
import { browseResolver } from './browse/browse.resolver';

export const routes: Routes = [
  {
    path: 'browse',
    children: [
      {
        path: '**',
        component: BrowseComponent,
        resolve: { browse: browseResolver },
      },
    ],
  },
  // C16 disclosure: third-party licenses route (OMCT-C16-L2-06.03). Lazy-loaded
  // so the license text and dependency table stay out of the initial bundle.
  {
    path: 'licenses',
    loadComponent: () => import('./licenses/licenses.component').then((m) => m.LicensesComponent),
  },
  { path: '', redirectTo: 'browse', pathMatch: 'full' },
];
