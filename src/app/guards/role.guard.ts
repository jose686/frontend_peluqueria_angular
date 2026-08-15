import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles = route.data['expectedRoles'] as Array<string>;
  const user = authService.currentUserSignal();

  if (user && expectedRoles) {
    const userRoleNormalized = user.role.replace('ROLE_', '');
    const hasRole = expectedRoles.some(role => role.replace('ROLE_', '') === userRoleNormalized);
    if (hasRole) {
      return true;
    }
  }

  // Not authorized, redirect to home page
  router.navigate(['/']);
  return false;
};
