import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/** Rotas privadas: pré-visualização nunca substitui uma sessão autenticada. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.initialized() && auth.isAuthenticated()) return true;
  return inject(Router).createUrlTree(['/login']);
};

/** Reavalia cada aba; somente o Início sem dados privados continua disponível na prévia. */
export const tabsChildGuard: CanActivateChildFn = (route, state) => {
  const auth = inject(AuthService);
  if (auth.initialized() && auth.previewMode() && route.routeConfig?.path === 'inicio') return true;
  return authGuard(route, state);
};

/** Tela de login: quem já está logado vai direto para o Início. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? inject(Router).createUrlTree(['/tabs/inicio']) : true;
};
