import { Component, OnInit, inject } from '@angular/core';
import { AppointmentService } from '../../../services/appointment.service';
import { CatalogService } from '../../../services/catalog.service';
import { WorkerService } from '../../../services/worker.service';
import { AppointmentDto } from '../../../models/appointment.model';
import { ServiceItemDto } from '../../../models/catalog.model';
import { WorkerDto } from '../../../models/worker.model';
import { CurrencyPipe, DatePipe, CommonModule } from '@angular/common';
import { AppointmentBookingComponent } from '../appointment-booking/appointment-booking.component';

@Component({
  selector: 'app-mis-citas',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe, AppointmentBookingComponent],
  template: `
    <div class="appointments-container fade-in-el">
      <div class="appointments-header">
        <h1>Mis Citas & Reservas</h1>
        <p>Consulta el estado de tus reservas y solicita nuevas citas online.</p>
      </div>

      <div class="appointments-grid">
        <!-- List of existing appointments -->
        <div class="appointments-list-section glass-panel">
          <h2>Tus Reservas</h2>
          
          <div class="appointments-list">
            @for (app of appointments; track app.id) {
              <div class="appointment-item card-border">
                <div class="app-main-info">
                  <span class="app-service">{{ getServiceName(app.serviceItemId) }}</span>
                  <span class="app-date">📅 {{ app.fecha }} a las {{ app.horaInicio.substring(0, 5) }}</span>
                  <span class="app-worker">👤 Profesional: {{ getWorkerName(app.workerId) }}</span>
                </div>
                
                <div class="app-status-info">
                  <span class="badge" [class]="getStatusClass(app.estado)">{{ app.estado }}</span>
                  <span class="app-price">{{ getServicePrice(app.serviceItemId) | currency:'EUR' }}</span>
                </div>

                @if (app.estado === 'PENDIENTE') {
                  <button (click)="cancelAppointment(app.id)" class="btn btn-secondary btn-sm cancel-btn">
                    Cancelar Cita
                  </button>
                }
              </div>
            } @empty {
              <div class="empty-list">
                <p>No tienes ninguna cita reservada.</p>
                <p class="subtext">¡Completa el formulario de la derecha para programar tu primera cita!</p>
              </div>
            }
          </div>
        </div>

        <!-- Book a new appointment using the sequential component -->
        <div class="booking-form-wrapper">
          <app-appointment-booking (bookingSuccess)="onBookingSuccess()"></app-appointment-booking>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .appointments-container {
      margin-bottom: 2rem;
    }
    .appointments-header {
      text-align: center;
      margin-bottom: 3rem;
    }
    .appointments-header h1 {
      font-size: 2.5rem;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }
    .appointments-header p {
      color: var(--text-secondary);
      font-size: 1.1rem;
    }
    .appointments-grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 2.5rem;
    }
    .appointments-list-section {
      padding: 2rem;
      border-radius: var(--border-radius-md);
      display: flex;
      flex-direction: column;
    }
    .appointments-list-section h2 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: var(--text-primary);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
    }
    .appointments-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      margin-top: 1rem;
    }
    .appointment-item {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      padding: 1.25rem;
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      gap: 1rem;
      position: relative;
    }
    .app-main-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .app-service {
      font-family: var(--font-heading);
      font-weight: 600;
      font-size: 1.1rem;
      color: var(--text-primary);
    }
    .app-date, .app-worker {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    .app-status-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }
    .app-price {
      font-family: var(--font-heading);
      font-weight: 700;
      color: var(--accent-gold);
    }
    .cancel-btn {
      grid-column: 1 / -1;
      margin-top: 0.5rem;
      justify-self: flex-end;
    }
    .empty-list {
      text-align: center;
      padding: 4rem 1rem;
      color: var(--text-secondary);
    }
    .empty-list .subtext {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-top: 0.5rem;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-pending {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
    }
    .badge-confirmed {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
    }
    .badge-cancelled {
      background: rgba(220, 38, 38, 0.15);
      color: #f87171;
    }
    @media(max-width: 992px) {
      .appointments-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MisCitasComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private catalogService = inject(CatalogService);
  private workerService = inject(WorkerService);

  appointments: AppointmentDto[] = [];
  services: ServiceItemDto[] = [];
  workers: WorkerDto[] = [];

  ngOnInit(): void {
    this.loadServices();
    this.loadWorkers();
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.appointmentService.getMyAppointments().subscribe({
      next: (data) => {
        this.appointments = data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      },
      error: () => {
        this.appointments = [];
      }
    });
  }

  loadServices(): void {
    this.catalogService.getServiceItems().subscribe({
      next: (items) => {
        this.services = items;
      }
    });
  }

  loadWorkers(): void {
    this.workerService.getAll().subscribe({
      next: (data) => {
        this.workers = data;
      }
    });
  }

  getServiceName(serviceId: string): string {
    const srv = this.services.find(s => s.id === serviceId);
    return srv ? srv.nombre : 'Servicio';
  }

  getServicePrice(serviceId: string): number {
    const srv = this.services.find(s => s.id === serviceId);
    return srv ? srv.precio : 0;
  }

  getWorkerName(workerId: string): string {
    const wrk = this.workers.find(w => w.id === workerId);
    return wrk ? wrk.nombre : 'Profesional';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDIENTE': return 'badge-pending';
      case 'CONFIRMADA': return 'badge-confirmed';
      case 'CANCELADA': return 'badge-cancelled';
      default: return 'badge-pending';
    }
  }

  onBookingSuccess(): void {
    this.loadAppointments();
  }

  cancelAppointment(id: string): void {
    if (confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      this.appointmentService.cancelAppointment(id).subscribe({
        next: () => {
          this.loadAppointments();
        },
        error: (err) => {
          alert('No se pudo cancelar la cita: ' + (err.error?.error || 'error desconocido'));
        }
      });
    }
  }
}
