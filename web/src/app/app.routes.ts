import { Routes } from '@angular/router';
import { ArchivePage } from './archive-page';
import { EditionPage } from './edition-page';

export const routes: Routes = [
  { path: '', component: EditionPage },
  { path: 'ausgabe/:date', component: EditionPage },
  { path: 'archiv', component: ArchivePage },
  { path: '**', redirectTo: '' },
];
