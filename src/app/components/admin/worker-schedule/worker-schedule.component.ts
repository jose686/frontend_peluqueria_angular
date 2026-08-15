import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { WorkerService } from '../../../services/worker.service';
import { WorkerScheduleService } from '../../../services/worker-schedule.service';
import { WorkerDto } from '../../../models/worker.model';
import { ShiftDto, ShiftRequestDto } from '../../../models/worker-schedule.model';

@Component({
  selector: 'app-worker-schedule',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="schedule-manager-container glass-panel fade-in-el">
      <h2>Gestión de Horarios y Descansos</h2>
      <p class="subtitle">Asigna las jornadas laborales y los descansos diarios de cada estilista.</p>

      <div class="form-group">
        <label class="form-label" for="workerSelect">Seleccionar Profesional *</label>
        <select id="workerSelect" class="form-control" (change)="onWorkerSelect($event)">
          <option value="" disabled selected>-- Elige un estilista --</option>
          @for (worker of workers; track worker.id) {
            <option [value]="worker.id">{{ worker.nombre }} ({{ worker.especialidad }})</option>
          }
        </select>
      </div>

      @if (selectedWorkerId) {
        <div class="grid-layout">
          <!-- Formulario de Asignación -->
          <div class="form-section">
            <h3>Asignar Nuevo Turno</h3>
            
            @if (successMessage) {
              <div class="alert alert-success">{{ successMessage }}</div>
            }
            @if (errorMessage) {
              <div class="alert alert-danger">{{ errorMessage }}</div>
            }

            <form [formGroup]="scheduleForm" (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label class="form-label" for="fecha">Fecha *</label>
                <input type="date" id="fecha" formControlName="fecha" class="form-control" required />
                @if (scheduleForm.get('fecha')?.touched && scheduleForm.get('fecha')?.invalid) {
                  <span class="error-text">La fecha es obligatoria.</span>
                }
              </div>

              <div class="time-range-group">
                <div class="form-group">
                  <label class="form-label" for="horaInicio">Inicio de Jornada *</label>
                  <input type="time" id="horaInicio" formControlName="horaInicio" class="form-control" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="horaFin">Fin de Jornada *</label>
                  <input type="time" id="horaFin" formControlName="horaFin" class="form-control" required />
                </div>
              </div>
              @if (scheduleForm.errors?.['invalidJornada']) {
                <span class="error-text block-error">La hora de fin de jornada debe ser posterior a la de inicio.</span>
              }

              <div class="break-section-title">🕒 Horario de Descanso (Opcional)</div>

              <div class="time-range-group">
                <div class="form-group">
                  <label class="form-label" for="breakStartTime">Inicio del Descanso</label>
                  <input type="time" id="breakStartTime" formControlName="breakStartTime" class="form-control" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="breakEndTime">Fin del Descanso</label>
                  <input type="time" id="breakEndTime" formControlName="breakEndTime" class="form-control" />
                </div>
              </div>
              @if (scheduleForm.errors?.['invalidDescanso']) {
                <span class="error-text block-error">El inicio del descanso debe ser previo a su fin.</span>
              }
              @if (scheduleForm.errors?.['descansoFueraJornada']) {
                <span class="error-text block-error">El periodo de descanso debe estar dentro de la jornada laboral asignada.</span>
              }

              <button type="submit" [disabled]="scheduleForm.invalid || submitting" class="btn btn-primary btn-block">
                {{ submitting ? 'Guardando...' : 'Asignar Horario' }}
              </button>
            </form>
          </div>

          <!-- Listado de Turnos Asignados -->
          <div class="list-section">
            <h3>Turnos Asignados</h3>
            @if (shifts.length === 0) {
              <div class="placeholder-text">No hay turnos registrados para este profesional.</div>
            } @else {
              <div class="shifts-list">
                @for (shift of shifts; track shift.id) {
                  <div class="shift-card glass-panel">
                    <div class="shift-date">📅 {{ shift.fecha | date:'dd/MM/yyyy' }}</div>
                    <div class="shift-details">
                      <div><strong>Jornada:</strong> {{ shift.horaInicio }} - {{ shift.horaFin }}</div>
                      @if (shift.breakStartTime && shift.breakEndTime) {
                        <div class="break-info">☕ <strong>Descanso:</strong> {{ shift.breakStartTime }} - {{ shift.breakEndTime }}</div>
                      } @else {
                        <div class="break-info no-break">Sin descanso programado</div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .schedule-manager-container {
      max-width: 900px;
      margin: 1.5rem auto;
      padding: 2rem;
      border-radius: var(--border-radius-md);
    }
    .subtitle {
      color: var(--text-secondary);
      margin-bottom: 2rem;
    }
    .grid-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-top: 1.5rem;
    }
    .time-range-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .break-section-title {
      font-weight: 600;
      color: var(--accent-gold);
      margin: 1.5rem 0 0.5rem 0;
      font-size: 0.95rem;
    }
    .block-error {
      display: block;
      margin-bottom: 0.75rem;
    }
    .btn-block {
      width: 100%;
      margin-top: 1.5rem;
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
    .placeholder-text {
      color: var(--text-secondary);
      font-style: italic;
    }
    .shifts-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-height: 400px;
      overflow-y: auto;
    }
    .shift-card {
      padding: 1rem;
      border-radius: var(--border-radius-sm);
      border: 1px solid var(--border-color);
    }
    .shift-date {
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }
    .shift-details {
      font-size: 0.9rem;
      color: var(--text-secondary);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .break-info {
      color: var(--accent-gold);
    }
    .no-break {
      color: var(--text-secondary);
      font-style: italic;
    }
    .error-text {
      color: #f87171;
      font-size: 0.8rem;
      margin-top: 0.25rem;
      display: block;
    }
    @media(max-width: 768px) {
      .grid-layout {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class WorkerScheduleComponent implements OnInit {
  private fb = inject(FormBuilder);
  private workerService = inject(WorkerService);
  private scheduleService = inject(WorkerScheduleService);

  workers: WorkerDto[] = [];
  shifts: ShiftDto[] = [];
  selectedWorkerId = '';

  scheduleForm: FormGroup = this.fb.group({
    fecha: ['', [Validators.required]],
    horaInicio: ['', [Validators.required]],
    horaFin: ['', [Validators.required]],
    breakStartTime: [''],
    breakEndTime: ['']
  }, { validators: [this.scheduleTimeValidator] });

  submitting = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    this.workerService.getAll().subscribe({
      next: (data) => this.workers = data,
      error: () => this.errorMessage = 'No se pudieron cargar los estilistas.'
    });
  }

  onWorkerSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedWorkerId = target.value;
    this.errorMessage = '';
    this.successMessage = '';
    this.loadShifts();
  }

  loadShifts(): void {
    if (!this.selectedWorkerId) {
      this.shifts = [];
      return;
    }
    this.scheduleService.getShiftsByWorker(this.selectedWorkerId).subscribe({
      next: (data) => this.shifts = data.sort((a, b) => b.fecha.localeCompare(a.fecha)),
      error: () => this.errorMessage = 'No se pudieron cargar los turnos.'
    });
  }

  onSubmit(): void {
    if (this.scheduleForm.valid && this.selectedWorkerId) {
      this.submitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      const formVal = this.scheduleForm.value;
      const request: ShiftRequestDto = {
        fecha: formVal.fecha,
        horaInicio: formVal.horaInicio,
        horaFin: formVal.horaFin,
        breakStartTime: formVal.breakStartTime || null,
        breakEndTime: formVal.breakEndTime || null
      };

      this.scheduleService.saveShift(this.selectedWorkerId, request).subscribe({
        next: () => {
          this.submitting = false;
          this.successMessage = 'Horario asignado correctamente.';
          this.scheduleForm.reset();
          this.loadShifts();
        },
        error: (err) => {
          this.submitting = false;
          this.errorMessage = err.error?.error || 'Error al guardar el horario.';
        }
      });
    }
  }

  // Validador personalizado en tiempo real
  private scheduleTimeValidator(control: AbstractControl): ValidationErrors | null {
    const horaInicio = control.get('horaInicio')?.value;
    const horaFin = control.get('horaFin')?.value;
    const breakStartTime = control.get('breakStartTime')?.value;
    const breakEndTime = control.get('breakEndTime')?.value;

    const errors: ValidationErrors = {};

    if (horaInicio && horaFin && horaInicio >= horaFin) {
      errors['invalidJornada'] = true;
    }

    if (breakStartTime || breakEndTime) {
      // Si uno está puesto, el otro también es obligatorio para el rango
      if (!breakStartTime || !breakEndTime) {
        errors['invalidDescanso'] = true;
      } else {
        if (breakStartTime >= breakEndTime) {
          errors['invalidDescanso'] = true;
        }
        if (horaInicio && horaFin) {
          if (breakStartTime < horaInicio || breakEndTime > horaFin) {
            errors['descansoFueraJornada'] = true;
          }
        }
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }
}
