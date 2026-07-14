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
  { path: '', redirectTo: 'browse', pathMatch: 'full' },
];
