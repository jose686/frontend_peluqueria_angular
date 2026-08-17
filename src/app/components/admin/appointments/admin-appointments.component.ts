import { Component, OnInit, inject } from '@angular/core';
import { AppointmentService } from '../../../services/appointment.service';
import { AppointmentDto, AppointmentRequest } from '../../../models/appointment.model';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-admin-appointments',
  standalone: true,
  imports: [DatePipe, CurrencyPipe],
  template: `
    <div class="appointments-panel fade-in-el">
      <div class="panel-header">
        <h2>Panel de Citas</h2>
        <p>Gestiona las reservas de los clientes y actualiza su estado.</p>
      </div>

      <div class="table-container glass-panel">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Servicio</th>
              <th>Fecha & Hora</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (app of appointments; track app.id) {
              <tr>
                <td>
                  <strong>{{ app.cliente?.nombre }}</strong>
                  <br/><small class="text-muted">{{ app.cliente?.email }}</small>
                </td>
                <td>{{ app.servicio?.nombre }}</td>
                <td>📅 {{ app.fechaHora | date:'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ app.servicio?.precio | currency:'EUR' }}</td>
                <td>
                  <span class="badge" [class]="getStatusClass(app.estado)">{{ app.estado === 'PENDIENTE' ? 'RESERVADA' : app.estado }}</span>
                </td>
                <td>
                  <div class="actions-group">
                    @if (app.estado !== 'CONFIRMADA') {
                      <button (click)="updateStatus(app, 'CONFIRMADA')" class="btn btn-secondary btn-sm accept-btn" title="Confirmar Cita">
                        Confirmar
                      </button>
                    }
                    @if (app.estado !== 'CANCELADA') {
                      <button (click)="updateStatus(app, 'CANCELADA')" class="btn btn-danger btn-sm cancel-btn" title="Cancelar Cita">
                        Cancelar
                      </button>
                    }
                    <button (click)="deleteAppointment(app.id!)" class="btn btn-secondary btn-sm delete-btn-app" title="Eliminar del registro">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" style="text-align: center;">No hay ninguna reserva registrada.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .appointments-panel {
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
    .actions-group {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .accept-btn {
      background: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.2);
      color: #34d399;
    }
    .accept-btn:hover {
      background: rgba(16, 185, 129, 0.2);
      border-color: #34d399;
    }
    .cancel-btn {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }
    .cancel-btn:hover {
      background: rgba(239, 68, 68, 0.2);
      border-color: #f87171;
    }
    .delete-btn-app {
      background: none;
      border: none;
      padding: 0.4rem;
    }
    .delete-btn-app:hover {
      transform: scale(1.1);
    }
  `]
})
export class AdminAppointmentsComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  appointments: any[] = [];

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.appointmentService.getAppointments().subscribe({
      next: (data) => {
        this.appointments = data.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
      },
      error: () => {
        this.loadMockAppointments();
      }
    });
  }

  private loadMockAppointments(): void {
    this.appointments = [
      {
        id: 1,
        cliente: { nombre: 'María García', email: 'maria@gmail.com', role: 'ROLE_CLIENTE' },
        servicio: { nombre: 'Corte de Autor & Estilismo', precio: 35.0, tipo: 'SERVICIO', categoria: { nombre: 'Cortes', tipo: 'SERVICIO' }, activo: true },
        fechaHora: new Date(Date.now() + 86400000).toISOString(),
        estado: 'PENDIENTE',
        notas: 'Cliente habitual'
      }
    ];
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDIENTE': return 'badge-confirmed';
      case 'CONFIRMADA': return 'badge-confirmed';
      case 'CANCELADA': return 'badge-cancelled';
      default: return 'badge-confirmed';
    }
  }

  updateStatus(app: any, status: 'CONFIRMADA' | 'CANCELADA'): void {
    const req: any = {
      servicioId: app.servicio?.id!,
      fechaHora: app.fechaHora,
      estado: status,
      notas: app.notas
    };

    this.appointmentService.updateAppointment(app.id!, req).subscribe({
      next: () => {
        this.loadAppointments();
      },
      error: (err) => {
        alert('Error al actualizar estado: ' + (err.error?.error || 'error desconocido'));
      }
    });
  }

  deleteAppointment(id: any): void {
    if (confirm('¿Estás seguro de que deseas eliminar permanentemente esta cita del registro?')) {
      this.appointmentService.deleteAppointment(id).subscribe({
        next: () => {
          this.loadAppointments();
        },
        error: (err) => {
          alert('Error al eliminar la cita: ' + (err.error?.error || 'error desconocido'));
        }
      });
    }
  }
}
