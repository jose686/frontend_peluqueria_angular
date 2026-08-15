import { Component, inject } from '@angular/core';
import { AdminAppointmentsComponent } from '../appointments/admin-appointments.component';
import { AdminCatalogComponent } from '../catalog/admin-catalog.component';
import { AdminBlogComponent } from '../blog/admin-blog.component';
import { AdminMediaComponent } from '../media/admin-media.component';
import { GestionCitasAdminComponent } from '../gestion-citas-admin/gestion-citas-admin.component';
import { WorkerRegistrationComponent } from '../worker-registration/worker-registration.component';
import { WeeklyQuadrantComponent } from '../weekly-quadrant/weekly-quadrant.component';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    AdminAppointmentsComponent,
    AdminCatalogComponent,
    AdminBlogComponent,
    AdminMediaComponent,
    GestionCitasAdminComponent,
    WorkerRegistrationComponent,
    WeeklyQuadrantComponent
  ],
  template: `
    <div class="admin-container fade-in-el">
      <div class="admin-sidebar glass-panel">
        <h3 class="admin-title">Menú de Gestión</h3>
        <nav class="admin-nav">
          <button (click)="setTab('citas')" [class.active]="activeTab === 'citas'">📅 Citas</button>
          <button (click)="setTab('disponibilidad')" [class.active]="activeTab === 'disponibilidad'">🗓️ Disponibilidad</button>
          @if (isAdmin()) {
            <button (click)="setTab('workers')" [class.active]="activeTab === 'workers'">👤 Profesionales</button>
            <button (click)="setTab('horarios')" [class.active]="activeTab === 'horarios'">🕒 Horarios</button>
            <button (click)="setTab('catalog')" [class.active]="activeTab === 'catalog'">💇‍♀️ Catálogo</button>
            <button (click)="setTab('blog')" [class.active]="activeTab === 'blog'">📝 Blog</button>
            <button (click)="setTab('media')" [class.active]="activeTab === 'media'">📁 Biblioteca de Medios</button>
          }
        </nav>
      </div>

      <div class="admin-content">
        @switch (activeTab) {
          @case ('citas') {
            <app-admin-appointments></app-admin-appointments>
          }
          @case ('disponibilidad') {
            <app-gestion-citas-admin></app-gestion-citas-admin>
          }
          @case ('workers') {
            <app-worker-registration></app-worker-registration>
          }
          @case ('horarios') {
            <app-weekly-quadrant></app-weekly-quadrant>
          }
          @case ('catalog') {
            <app-admin-catalog></app-admin-catalog>
          }
          @case ('blog') {
            <app-admin-blog></app-admin-blog>
          }
          @case ('media') {
            <app-admin-media></app-admin-media>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      display: flex;
      gap: 1.5rem;
      min-height: calc(100vh - 250px);
      width: 100%;
    }
    .admin-sidebar {
      padding: 1.5rem;
      height: fit-content;
      border-radius: var(--border-radius-md);
      width: 260px;
      flex-shrink: 0;
    }
    .admin-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-color);
    }
    .admin-nav {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .admin-nav button {
      background: none;
      border: 1px solid transparent;
      color: var(--text-secondary);
      font-family: var(--font-heading);
      font-weight: 500;
      font-size: 0.95rem;
      padding: 0.75rem 1rem;
      border-radius: var(--border-radius-sm);
      text-align: left;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
    }
    .admin-nav button:hover {
      background: rgba(255, 255, 255, 0.03);
      color: var(--text-primary);
    }
    .admin-nav button.active {
      background: rgba(212, 175, 55, 0.08);
      border-color: rgba(212, 175, 55, 0.2);
      color: var(--accent-gold);
      font-weight: 600;
    }
    .admin-content {
      flex-grow: 1;
      min-width: 0;
    }
    @media(max-width: 992px) {
      .admin-container {
        flex-direction: column;
        gap: 1.5rem;
      }
      .admin-sidebar {
        width: 100%;
      }
    }
  `]
})
export class AdminDashboardComponent {
  private authService = inject(AuthService);
  isAdmin = this.authService.isAdmin;
  activeTab = 'citas';

  setTab(tab: string): void {
    if (!this.isAdmin() && ['workers', 'horarios', 'catalog', 'blog', 'media'].includes(tab)) {
      return;
    }
    this.activeTab = tab;
  }
}
