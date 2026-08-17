import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { AppointmentService } from '../../../services/appointment.service';

@Component({
  selector: 'app-admin-billing',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    <div class="billing-panel fade-in-el">
      <div class="panel-header">
        <h2>💰 Historial y Facturación</h2>
        <p>Consulta los servicios completados, ingresos acumulados y métricas de negocio.</p>
      </div>

      <!-- Filtros de Rango -->
      <div class="filters-bar glass-panel">
        <div class="range-buttons">
          <button class="btn" [class.btn-primary]="activeRange === 'today'" [class.btn-secondary]="activeRange !== 'today'" (click)="setRange('today')">Hoy</button>
          <button class="btn" [class.btn-primary]="activeRange === 'week'" [class.btn-secondary]="activeRange !== 'week'" (click)="setRange('week')">Esta Semana</button>
          <button class="btn" [class.btn-primary]="activeRange === 'month'" [class.btn-secondary]="activeRange !== 'month'" (click)="setRange('month')">Este Mes</button>
          <button class="btn" [class.btn-primary]="activeRange === 'all'" [class.btn-secondary]="activeRange !== 'all'" (click)="setRange('all')">Todo</button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card glass-panel">
          <div class="kpi-icon">💰</div>
          <div class="kpi-data">
            <span class="kpi-value">{{ totalRevenue | currency:'EUR' }}</span>
            <span class="kpi-label">Total Facturado</span>
          </div>
        </div>
        <div class="kpi-card glass-panel">
          <div class="kpi-icon">📋</div>
          <div class="kpi-data">
            <span class="kpi-value">{{ filteredAppointments.length }}</span>
            <span class="kpi-label">Servicios Atendidos</span>
          </div>
        </div>
        <div class="kpi-card glass-panel">
          <div class="kpi-icon">💳</div>
          <div class="kpi-data">
            <span class="kpi-value">{{ averageTicket | currency:'EUR' }}</span>
            <span class="kpi-label">Ticket Medio</span>
          </div>
        </div>
      </div>

      <!-- Tabla de Historial -->
      <div class="table-container glass-panel">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Profesional</th>
              <th>Servicio</th>
              <th>Fecha y Hora</th>
              <th>Importe</th>
            </tr>
          </thead>
          <tbody>
            @for (app of filteredAppointments; track app.id) {
              <tr>
                <td>
                  <strong>{{ app.clienteNombre || 'Sin nombre' }}</strong>
                  <br/><small class="text-muted">{{ app.clienteTelefono || '' }}</small>
                </td>
                <td><strong>{{ app.workerName || 'Sin asignar' }}</strong></td>
                <td>{{ app.serviceName || 'Sin servicio' }}</td>
                <td>📅 {{ (app.fecha + 'T' + app.horaInicio) | date:'dd/MM/yyyy HH:mm' }}</td>
                <td class="amount-cell">{{ app.precio | currency:'EUR' }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" style="text-align: center;">No hay servicios completados en este rango.</td>
              </tr>
            }
          </tbody>
          @if (filteredAppointments.length > 0) {
            <tfoot>
              <tr>
                <td colspan="4" style="text-align: right;"><strong>TOTAL</strong></td>
                <td class="amount-cell"><strong>{{ totalRevenue | currency:'EUR' }}</strong></td>
              </tr>
            </tfoot>
          }
        </table>
      </div>
    </div>
  `,
  styles: [`
    .billing-panel {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .panel-header h2 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    .panel-header p {
      color: var(--text-secondary);
      font-size: 0.95rem;
    }
    .filters-bar {
      padding: 1rem 1.5rem;
    }
    .range-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }
    .kpi-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      border-radius: var(--border-radius-md);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }
    .kpi-icon {
      font-size: 2rem;
      line-height: 1;
    }
    .kpi-data {
      display: flex;
      flex-direction: column;
    }
    .kpi-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--accent-gold, #d4a359);
    }
    .kpi-label {
      font-size: 0.85rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .amount-cell {
      font-weight: 600;
      color: var(--accent-gold, #d4a359);
    }
    tfoot td {
      border-top: 2px solid var(--border-color);
      padding-top: 0.75rem;
    }
  `]
})
export class AdminBillingComponent implements OnInit {
  private appointmentService = inject(AppointmentService);

  allCompleted: any[] = [];
  filteredAppointments: any[] = [];
  activeRange: 'today' | 'week' | 'month' | 'all' = 'month';

  totalRevenue = 0;
  averageTicket = 0;

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.appointmentService.getCompletedAppointments().subscribe({
      next: (data) => {
        this.allCompleted = data.sort((a, b) => {
          const dateA = new Date(a.fecha + 'T' + a.horaInicio);
          const dateB = new Date(b.fecha + 'T' + b.horaInicio);
          return dateB.getTime() - dateA.getTime();
        });
        this.applyFilter();
      },
      error: () => {
        this.allCompleted = [];
        this.filteredAppointments = [];
      }
    });
  }

  setRange(range: 'today' | 'week' | 'month' | 'all'): void {
    this.activeRange = range;
    this.applyFilter();
  }

  applyFilter(): void {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    this.filteredAppointments = this.allCompleted.filter(app => {
      if (this.activeRange === 'all') return true;

      const appDate = new Date(app.fecha);

      if (this.activeRange === 'today') {
        return appDate >= startOfToday;
      }

      if (this.activeRange === 'week') {
        const dayOfWeek = now.getDay() || 7; // Monday = 1
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - (dayOfWeek - 1));
        return appDate >= startOfWeek;
      }

      if (this.activeRange === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return appDate >= startOfMonth;
      }

      return true;
    });

    this.calculateKpis();
  }

  calculateKpis(): void {
    this.totalRevenue = this.filteredAppointments.reduce((sum, app) => sum + (app.precio || 0), 0);
    const count = this.filteredAppointments.length;
    this.averageTicket = count > 0 ? this.totalRevenue / count : 0;
  }
}
