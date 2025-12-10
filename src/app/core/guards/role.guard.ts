import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.currentUser();

  if (!currentUser) {
    router.navigate(['/login']);
    return false;
  }

  const requiredRole = route.data['role'] as string;

  if (requiredRole && currentUser.role?.toLowerCase() !== requiredRole) {
    // User doesn't have the required role, redirect to events page
    router.navigate(['/events']);
    return false;
  }

  return true;
};
