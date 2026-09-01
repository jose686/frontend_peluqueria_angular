import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // If the token exists, clone the request and set the Authorization header
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        authService.logout();
        const currentUrl = router.url;
        if (!currentUrl.includes('/login')) {
          alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
        }
      }
      return throwError(() => error);
    })
  );
};
