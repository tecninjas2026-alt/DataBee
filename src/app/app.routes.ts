import { Routes } from '@angular/router';

import { authGuard, guestGuard, tabsChildGuard } from './core/auth/auth.guards';

/**
 * Mapa das 8 telas do MVP (D25):
 * 1 Login · 2 Início · 3 Novo Registro/Foto · 4 Novo Registro/Dados · 5 Resultado + Aprender
 * 6 Minhas Observações · 7 Detalhe · 8 Feed/Comunidade (comentários ficam dentro do detalhe/feed).
 * Todas as páginas são lazy (loadComponent). Não crie telas fora deste mapa sem decisão registrada.
 */
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'tabs',
    canActivateChild: [tabsChildGuard],
    loadComponent: () => import('./features/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'inicio',
        loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'registrar',
        loadComponent: () => import('./features/register/register-photo.page').then((m) => m.RegisterPhotoPage),
      },
      {
        path: 'registrar/dados',
        loadComponent: () => import('./features/register/register-details.page').then((m) => m.RegisterDetailsPage),
      },
      {
        path: 'minhas',
        loadComponent: () => import('./features/observations/my-observations.page').then((m) => m.MyObservationsPage),
      },
      {
        path: 'feed',
        loadComponent: () => import('./features/feed/feed.page').then((m) => m.FeedPage),
      },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    ],
  },
  {
    path: 'observacao/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/observations/observation-detail.page').then((m) => m.ObservationDetailPage),
  },
  {
    path: 'observacao/:id/resultado',
    canActivate: [authGuard],
    loadComponent: () => import('./features/observations/analysis-result.page').then((m) => m.AnalysisResultPage),
  },
  { path: '', redirectTo: 'tabs/inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'tabs/inicio' },
];
