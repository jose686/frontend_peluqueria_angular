import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { WorkerService } from '../../../services/worker.service';
import { WorkerScheduleService } from '../../../services/worker-schedule.service';
import { WorkerDto } from '../../../models/worker.model';
import { ShiftDto, ShiftRequestDto } from '../../../models/worker-schedule.model';

@Component({
  selector: 'app-weekly-quadrant',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="quadrant-container glass-panel fade-in-el">
      <div class="header-bar">
        <div>
          <h2>Cuadrante Semanal</h2>
          <p class="subtitle">Matriz de turnos y descansos de Aura Studio. Haz clic en cualquier celda para gestionar.</p>
        </div>
        <!-- Navegador de Semanas -->
        <div class="navigator">
          <button class="btn btn-secondary" (click)="navigateWeek(-7)">◀ Semana Anterior</button>
          <span class="week-label">Del {{ weekDays[0] | date:'dd/MM' }} al {{ weekDays[6] | date:'dd/MM/yyyy' }}</span>
          <button class="btn btn-secondary" (click)="navigateWeek(7)">Semana Siguiente ▶</button>
        </div>
      </div>

      <!-- Matriz del Cuadrante -->
      <div class="matrix-scroll">
        <div class="quadrant-grid">
          <!-- Esquina superior izquierda -->
          <div class="grid-header-cell corner-cell">Profesional</div>
          <!-- Encabezados de días -->
          @for (day of weekDays; track day.getTime()) {
            <div class="grid-header-cell day-cell">
              <span class="day-name">{{ day | date:'EEEE' }}</span>
              <span class="day-date">{{ day | date:'dd/MM' }}</span>
            </div>
          }

          <!-- Filas de trabajadores -->
          @for (worker of workers; track worker.id) {
            <!-- Nombre del profesional -->
            <div class="worker-name-cell">
              <span class="worker-title">{{ worker.nombre }}</span>
              <span class="worker-spec">{{ worker.especialidad }}</span>
            </div>
            
            <!-- Celdas de días -->
            @for (day of weekDays; track day.getTime()) {
              @let shift = getShift(worker.id, day);
              <div 
                [class]="getCellClass(shift)" 
                (click)="openModal(worker, day, shift)"
              >
                @if (shift) {
                  <div class="shift-time-block">
                    {{ shift.horaInicio }} - {{ shift.horaFin }}
                  </div>
                  @if (shift.breakStartTime && shift.breakEndTime) {
                    <div class="break-badge">
                      ☕ Descanso: {{ shift.breakStartTime }} - {{ shift.breakEndTime }}
                    </div>
                  }
                } @else {
                  <span class="free-label">Libre</span>
                }
              </div>
            }
          }
        </div>
      </div>

      <!-- ================= MODAL DE GESTIÓN (CREAR / EDITAR) ================= -->
      <div class="modal-backdrop fade-in-el" *ngIf="showModal">
        <div class="modal-content glass-panel">
          <div class="modal-header">
            <h3>{{ isEditMode ? 'Editar Turno' : 'Asignar Turno' }}</h3>
            <button class="btn-close" (click)="closeModal()">×</button>
          </div>
          
          <div class="modal-body">
            <p class="modal-subtitle">
              Profesional: <strong>{{ activeWorker?.nombre }}</strong><br>
              Fecha: <strong>{{ activeDate | date:'EEEE dd/MM/yyyy' }}</strong>
            </p>

            @if (successMessage) {
              <div class="alert alert-success">{{ successMessage }}</div>
            }
            @if (errorMessage) {
              <div class="alert alert-danger">{{ errorMessage }}</div>
            }

            <form [formGroup]="scheduleForm" (ngSubmit)="onSubmit()">
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

              <div class="break-section-title">☕ Horario de Descanso (Opcional)</div>

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
                <span class="error-text block-error">El descanso debe estar dentro de la jornada laboral.</span>
              }

              <div class="modal-footer-actions">
                @if (isEditMode) {
                  <button type="button" class="btn btn-danger" (click)="deleteShift()" [disabled]="submitting">
                    🗑️ Eliminar Turno
                  </button>
                }
                <button type="submit" [disabled]="scheduleForm.invalid || submitting" class="btn btn-primary">
                  {{ submitting ? 'Guardando...' : (isEditMode ? 'Actualizar Turno' : 'Asignar Turno') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .quadrant-container {
      margin: 1.5rem auto;
      padding: 2rem;
      border-radius: var(--border-radius-md);
      background: rgba(18, 18, 20, 0.6);
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .subtitle {
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }
    .navigator {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .week-label {
      font-weight: 700;
      color: var(--accent-gold);
      font-size: 1.05rem;
      min-width: 180px;
      text-align: center;
    }
    .matrix-scroll {
      width: 100%;
      overflow-x: auto;
      border-radius: var(--border-radius-sm);
      border: 1px solid var(--border-color);
    }
    .quadrant-grid {
      display: grid;
      grid-template-columns: 200px repeat(7, minmax(130px, 1fr));
      background: rgba(255, 255, 255, 0.02);
    }
    .grid-header-cell {
      background: rgba(0, 0, 0, 0.4);
      padding: 1rem;
      font-weight: 700;
      text-align: center;
      border-bottom: 2px solid var(--border-color);
      border-right: 1px solid var(--border-color);
      color: var(--text-primary);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .corner-cell {
      align-items: flex-start;
      font-size: 0.95rem;
      color: var(--accent-gold);
    }
    .day-cell {
      text-transform: capitalize;
    }
    .day-name {
      font-size: 0.9rem;
    }
    .day-date {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }
    .worker-name-cell {
      padding: 1rem;
      background: rgba(0, 0, 0, 0.25);
      border-bottom: 1px solid var(--border-color);
      border-right: 2px solid var(--border-color);
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .worker-title {
      font-weight: 700;
      color: var(--text-primary);
    }
    .worker-spec {
      font-size: 0.75rem;
      color: var(--accent-gold);
      margin-top: 0.25rem;
    }
    .grid-day-cell {
      padding: 0.75rem;
      border-bottom: 1px solid var(--border-color);
      border-right: 1px solid var(--border-color);
      min-height: 85px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: background 0.2s ease;
      background: rgba(255, 255, 255, 0.01);
    }
    .grid-day-cell:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    /* Clases de Turnos */
    .cell-free {
      color: var(--text-secondary);
    }
    .cell-morning {
      background: rgba(59, 130, 246, 0.08); /* Azul suave */
      border-left: 3px solid #3b82f6;
    }
    .cell-afternoon {
      background: rgba(249, 115, 22, 0.08); /* Naranja suave */
      border-left: 3px solid #f97316;
    }
    .cell-full {
      background: rgba(16, 185, 129, 0.08); /* Verde suave */
      border-left: 3px solid #10b981;
    }
    .shift-time-block {
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }
    .break-badge {
      font-size: 0.7rem;
      background: rgba(212, 175, 55, 0.15);
      color: var(--accent-gold);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      margin-top: 0.25rem;
      text-align: center;
    }
    .free-label {
      font-size: 0.8rem;
      color: var(--text-secondary);
      font-style: italic;
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(5px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-content {
      width: 100%;
      max-width: 480px;
      padding: 2rem;
      border-radius: var(--border-radius-md);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .btn-close {
      background: none;
      border: none;
      font-size: 1.8rem;
      color: var(--text-secondary);
      cursor: pointer;
    }
    .btn-close:hover {
      color: var(--text-primary);
    }
    .modal-subtitle {
      font-size: 0.95rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 1.5rem;
      background: rgba(255, 255, 255, 0.03);
      padding: 0.75rem;
      border-radius: 6px;
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
    .error-text {
      color: #f87171;
      font-size: 0.8rem;
      margin-top: 0.25rem;
      display: block;
    }
    .modal-footer-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
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
    .btn-danger {
      background: rgba(220, 38, 38, 0.2);
      border: 1px solid rgba(220, 38, 38, 0.4);
      color: #f87171;
      padding: 0.5rem 1rem;
      border-radius: var(--border-radius-sm);
      cursor: pointer;
    }
    .btn-danger:hover {
      background: rgba(220, 38, 38, 0.3);
    }
  `]
})
export class WeeklyQuadrantComponent implements OnInit {
  private fb = inject(FormBuilder);
  private workerService = inject(WorkerService);
  private scheduleService = inject(WorkerScheduleService);

  workers: WorkerDto[] = [];
  shifts: ShiftDto[] = [];
  weekDays: Date[] = [];
  currentReferenceDate: Date = new Date();

  // Modal State
  showModal = false;
  isEditMode = false;
  activeWorker: WorkerDto | null = null;
  activeDate: Date | null = null;
  activeShift: ShiftDto | null = null;

  scheduleForm: FormGroup = this.fb.group({
    horaInicio: ['', [Validators.required]],
    horaFin: ['', [Validators.required]],
    breakStartTime: [''],
    breakEndTime: ['']
  }, { validators: [this.scheduleTimeValidator] });

  submitting = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    this.calculateWeekDays();
    this.loadWorkers();
    this.loadWeekShifts();
  }

  loadWorkers(): void {
    this.workerService.getAll().subscribe({
      next: (data) => this.workers = data,
      error: () => this.errorMessage = 'No se pudieron cargar los estilistas.'
    });
  }

  loadWeekShifts(): void {
    const formattedStart = this.formatDate(this.weekDays[0]);
    this.scheduleService.getShiftsByWeek(formattedStart).subscribe({
      next: (data) => this.shifts = data,
      error: () => this.errorMessage = 'No se pudieron cargar los turnos de la semana.'
    });
  }

  calculateWeekDays(): void {
    const dayOfWeek = this.currentReferenceDate.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(this.currentReferenceDate);
    monday.setDate(this.currentReferenceDate.getDate() + distanceToMonday);

    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(monday);
      currentDay.setDate(monday.getDate() + i);
      this.weekDays.push(currentDay);
    }
  }

  navigateWeek(days: number): void {
    this.currentReferenceDate.setDate(this.currentReferenceDate.getDate() + days);
    this.calculateWeekDays();
    this.loadWeekShifts();
  }

  getShift(workerId: string, date: Date): ShiftDto | undefined {
    const dateStr = this.formatDate(date);
    return this.shifts.find(s => s.workerId === workerId && s.fecha === dateStr);
  }

  getCellClass(shift: ShiftDto | undefined): string {
    if (!shift) return 'grid-day-cell cell-free';
    
    // Determinar franja horaria para el color Aura Studio
    const startHour = parseInt(shift.horaInicio.split(':')[0], 10);
    if (startHour < 14) {
      return 'grid-day-cell cell-morning'; // Azul
    } else {
      return 'grid-day-cell cell-afternoon'; // Naranja
    }
  }

  // Modal CRUD Operations
  openModal(worker: WorkerDto, date: Date, shift: ShiftDto | undefined): void {
    this.activeWorker = worker;
    this.activeDate = date;
    this.activeShift = shift || null;
    this.isEditMode = !!shift;
    this.errorMessage = '';
    this.successMessage = '';

    if (shift) {
      this.scheduleForm.patchValue({
        horaInicio: this.formatTimeForInput(shift.horaInicio),
        horaFin: this.formatTimeForInput(shift.horaFin),
        breakStartTime: this.formatTimeForInput(shift.breakStartTime),
        breakEndTime: this.formatTimeForInput(shift.breakEndTime)
      });
    } else {
      this.scheduleForm.reset();
    }

    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.activeWorker = null;
    this.activeDate = null;
    this.activeShift = null;
  }

  onSubmit(): void {
    if (this.scheduleForm.valid && this.activeWorker && this.activeDate) {
      this.submitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      const formVal = this.scheduleForm.value;
      const request: ShiftRequestDto = {
        fecha: this.formatDate(this.activeDate),
        horaInicio: formVal.horaInicio,
        horaFin: formVal.horaFin,
        breakStartTime: formVal.breakStartTime || null,
        breakEndTime: formVal.breakEndTime || null
      };

      this.scheduleService.saveShift(this.activeWorker.id, request).subscribe({
        next: () => {
          this.submitting = false;
          this.successMessage = 'Turno guardado con éxito.';
          this.loadWeekShifts();
          setTimeout(() => this.closeModal(), 800);
        },
        error: (err) => {
          this.submitting = false;
          this.errorMessage = err.error?.error || 'Error al guardar el turno.';
        }
      });
    }
  }

  deleteShift(): void {
    if (this.activeShift && this.activeShift.id) {
      this.submitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.scheduleService.deleteShift(this.activeShift.id).subscribe({
        next: () => {
          this.submitting = false;
          this.successMessage = 'Turno eliminado con éxito.';
          this.loadWeekShifts();
          setTimeout(() => this.closeModal(), 800);
        },
        error: (err) => {
          this.submitting = false;
          this.errorMessage = err.error?.error || 'Error al eliminar el turno.';
        }
      });
    }
  }

  // Helpers
  private formatDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private formatTimeForInput(time: string | undefined): string {
    if (!time) return '';
    return time.substring(0, 5); // Convierte "09:00:00" en "09:00"
  }

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
