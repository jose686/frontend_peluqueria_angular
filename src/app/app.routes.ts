import { Routes } from '@angular/router';
import { HomeComponent } from './components/public/home/home.component';
import { CatalogComponent } from './components/public/catalog/catalog.component';
import { BlogComponent } from './components/public/blog/blog.component';
import { BlogPostViewComponent } from './components/public/blog/blog-post-view.component';
import { LoginComponent } from './components/public/login/login.component';
import { RegisterComponent } from './components/public/register/register.component';
import { MisCitasComponent } from './components/client/mis-citas/mis-citas.component';
import { AppointmentBookingComponent } from './components/client/appointment-booking/appointment-booking.component';
import { AdminDashboardComponent } from './components/admin/dashboard/admin-dashboard.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

import { WorkerRegistrationComponent } from './components/admin/worker-registration/worker-registration.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'catalog', component: CatalogComponent },
  { path: 'blog', component: BlogComponent },
  { path: 'blog/:slug', component: BlogPostViewComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'mis-citas', 
    component: MisCitasComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'reservar', 
    component: AppointmentBookingComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'admin', 
    component: AdminDashboardComponent, 
    canActivate: [authGuard, roleGuard], 
    data: { expectedRoles: ['ROLE_ADMIN', 'ROLE_WORKER'] } 
  },
  { 
    path: 'admin/workers/register', 
    component: WorkerRegistrationComponent, 
    canActivate: [authGuard, roleGuard], 
    data: { expectedRoles: ['ROLE_ADMIN'] } 
  },
  { path: '**', redirectTo: '' }
];
