import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SetupService } from '../services/setup.service';
import { map } from 'rxjs/operators';

export const setupGuard: CanActivateFn = (route, state) => {
  const setupService = inject(SetupService);
  const router = inject(Router);
  const isSetupRoute = state.url.startsWith('/setup');

  return setupService.getSetupStatus().pipe(
    map(status => {
      if (status.setupRequired) {
        if (!isSetupRoute) {
          router.navigate(['/setup']);
          return false;
        }
        return true;
      } else {
        if (isSetupRoute) {
          router.navigate(['/']);
          return false;
        }
        return true;
      }
    })
  );
};
