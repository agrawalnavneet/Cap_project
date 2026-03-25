import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }

  const requiredRoles = route.data?.['roles'] as string[];
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = authService.userRole;
    if (!requiredRoles.includes(userRole)) {
      router.navigate(['/dashboard']);
      return false;
    }
  }

  return true;
};
