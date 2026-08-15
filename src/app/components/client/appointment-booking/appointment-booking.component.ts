import { Component, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CatalogService } from '../../../services/catalog.service';
import { WorkerService } from '../../../services/worker.service';
import { AppointmentService } from '../../../services/appointment.service';
import { ServiceItemDto } from '../../../models/catalog.model';
import { WorkerDto } from '../../../models/worker.model';
import { AppointmentRequest } from '../../../models/appointment.model';

@Component({
  selector: 'app-appointment-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="booking-container glass-panel fade-in-el">
      <h2>Reservar Nueva Cita</h2>
      
      @if (successMessage) {
        <div class="alert alert-success">{{ successMessage }}</div>
      }
      @if (errorMessage) {
        <div class="alert alert-danger">{{ errorMessage }}</div>
      }

      <form [formGroup]="bookingForm" (ngSubmit)="onSubmit()">
        <!-- Paso A: Cargar la lista de servicios -->
        <div class="form-group">
          <label class="form-label" for="serviceItemId">1. Selecciona el Servicio *</label>
          <select id="serviceItemId" formControlName="serviceItemId" class="form-control" (change)="onServiceChange()">
            <option value="">Seleccione un servicio...</option>
            @for (service of services; track service.id) {
              <option [value]="service.id">{{ service.nombre }} ({{ service.precio }}€ - {{ service.duracionMinutos }} min)</option>
            }
          </select>
        </div>

        <!-- Paso B: Al seleccionar servicio, cargar trabajadores -->
        @if (bookingForm.get('serviceItemId')?.value) {
          <div class="form-group fade-in-el">
            <label class="form-label" for="workerId">2. Selecciona el Profesional *</label>
            <select id="workerId" formControlName="workerId" class="form-control" (change)="onWorkerOrDateChange()">
              <option value="">Seleccione un profesional...</option>
              @for (worker of workers; track worker.id) {
                <option [value]="worker.id">{{ worker.nombre }} - {{ worker.especialidad }}</option>
              }
            </select>
          </div>
        }

        <!-- Selección de Fecha -->
        @if (bookingForm.get('workerId')?.value) {
          <div class="form-group fade-in-el">
            <label class="form-label" for="fecha">3. Selecciona la Fecha *</label>
            <input type="date" id="fecha" formControlName="fecha" class="form-control" [min]="today" (change)="onWorkerOrDateChange()" />
          </div>
        }

        <!-- Paso C: Al seleccionar trabajador y fecha, obtener huecos libres -->
        @if (bookingForm.get('fecha')?.value && bookingForm.get('workerId')?.value && loadingSlots) {
          <p class="loading-text">Buscando turnos disponibles...</p>
        }

        @if (bookingForm.get('fecha')?.value && bookingForm.get('workerId')?.value && !loadingSlots && availableSlots.length > 0) {
          <div class="form-group fade-in-el">
            <label class="form-label">4. Selecciona la Hora *</label>
            <div class="slots-grid">
              @for (slot of availableSlots; track slot) {
                <button type="button" 
                        class="slot-btn" 
                        [class.selected]="bookingForm.get('horaInicio')?.value === slot" 
                        (click)="selectSlot(slot)">
                  {{ slot.substring(0, 5) }}
                </button>
              }
            </div>
          </div>
        } @else if (bookingForm.get('fecha')?.value && bookingForm.get('workerId')?.value && !loadingSlots && availableSlots.length === 0) {
          <div class="alert alert-warning">No hay turnos disponibles para este profesional en la fecha seleccionada.</div>
        }

        <!-- Botón de Envío -->
        <button type="submit" 
                [disabled]="bookingForm.invalid || submitting" 
                class="btn btn-primary btn-block" 
                *ngIf="bookingForm.get('horaInicio')?.value">
          {{ submitting ? 'Procesando Reserva...' : 'Confirmar Cita' }}
        </button>
      </form>
    </div>
  `,
  styles: [`
    .booking-container {
      max-width: 600px;
      margin: 2rem auto;
      padding: 2.5rem;
      border-radius: var(--border-radius-md);
    }
    .booking-container h2 {
      font-size: 1.8rem;
      color: var(--text-primary);
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    .slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .slot-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 500;
    }
    .slot-btn:hover {
      background: var(--accent-gold);
      color: #000;
      border-color: var(--accent-gold);
    }
    .slot-btn.selected {
      background: var(--accent-gold);
      color: #000;
      border-color: var(--accent-gold);
    }
    .loading-text {
      color: var(--text-secondary);
      font-style: italic;
    }
    .alert {
      padding: 0.75rem 1rem;
      border-radius: var(--border-radius-sm);
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
    }
    .alert-danger {
      background: rgba(220, 38, 38, 0.15);
      color: #f87171;
      border: 1px solid rgba(220, 38, 38, 0.2);
    }
    .alert-success {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .alert-warning {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.2);
    }
    .btn-block {
      width: 100%;
      margin-top: 1.5rem;
    }
  `]
})
export class AppointmentBookingComponent implements OnInit {
  @Output() bookingSuccess = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private catalogService = inject(CatalogService);
  private workerService = inject(WorkerService);
  private appointmentService = inject(AppointmentService);

  services: ServiceItemDto[] = [];
  workers: WorkerDto[] = [];
  availableSlots: string[] = [];
  today = new Date().toISOString().split('T')[0];

  bookingForm: FormGroup = this.fb.group({
    serviceItemId: ['', [Validators.required]],
    workerId: ['', [Validators.required]],
    fecha: ['', [Validators.required]],
    horaInicio: ['', [Validators.required]]
  });

  loadingSlots = false;
  submitting = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.catalogService.getServiceItems().subscribe({
      next: (data) => {
        this.services = data;
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar los servicios.';
      }
    });
  }

  onServiceChange(): void {
    this.bookingForm.patchValue({ workerId: '', fecha: '', horaInicio: '' });
    this.workers = [];
    this.availableSlots = [];

    const serviceId = this.bookingForm.get('serviceItemId')?.value;
    if (serviceId) {
      // Cargar los trabajadores
      this.workerService.getAll().subscribe({
        next: (data) => {
          this.workers = data;
        },
        error: () => {
          this.errorMessage = 'Error al cargar profesionales.';
        }
      });
    }
  }

  onWorkerOrDateChange(): void {
    this.bookingForm.patchValue({ horaInicio: '' });
    this.availableSlots = [];

    const serviceId = this.bookingForm.get('serviceItemId')?.value;
    const workerId = this.bookingForm.get('workerId')?.value;
    const fecha = this.bookingForm.get('fecha')?.value;

    if (serviceId && workerId && fecha) {
      this.loadingSlots = true;
      this.appointmentService.getAvailableSlots(workerId, serviceId, fecha).subscribe({
        next: (res) => {
          this.availableSlots = res.horasDisponibles;
          this.loadingSlots = false;
        },
        error: () => {
          this.loadingSlots = false;
          this.errorMessage = 'Error al obtener los turnos disponibles.';
        }
      });
    }
  }

  selectSlot(slot: string): void {
    this.bookingForm.patchValue({ horaInicio: slot });
  }

  onSubmit(): void {
    if (this.bookingForm.valid) {
      this.submitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      const request: AppointmentRequest = {
        workerId: this.bookingForm.value.workerId,
        serviceItemId: this.bookingForm.value.serviceItemId,
        fecha: this.bookingForm.value.fecha,
        horaInicio: this.bookingForm.value.horaInicio
      };

      this.appointmentService.createAppointment(request).subscribe({
        next: () => {
          this.submitting = false;
          this.successMessage = '¡Cita reservada con éxito!';
          this.bookingSuccess.emit();
          this.bookingForm.reset();
          setTimeout(() => {
            this.successMessage = '';
          }, 4000);
        },
        error: (err) => {
          this.submitting = false;
          this.errorMessage = err.error?.error || 'Error al confirmar la cita.';
        }
      });
    }
  }
}
