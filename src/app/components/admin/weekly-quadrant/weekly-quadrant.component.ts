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
          <p class="subtitle">Matriz de turnos y descansos de Aura Studio. Configura tu pincel y haz clic directo en las celdas.</p>
        </div>
        <!-- Navegador de Semanas -->
        <div class="navigator">
          <button class="btn btn-secondary" (click)="navigateWeek(-7)">◀ Semana Anterior</button>
          <span class="week-label">Del {{ weekDays[0] | date:'dd/MM' }} al {{ weekDays[6] | date:'dd/MM/yyyy' }}</span>
          <button class="btn btn-secondary" (click)="navigateWeek(7)">Semana Siguiente ▶</button>
        </div>
      </div>

      <!-- BARRA DE PINCEL ACTIVO (Configuración de pintado rápido) -->
      <div class="brush-bar glass-panel-accent">
        <div class="brush-header">
          <span class="brush-title">🖌️ Pincel de Turnos Activo</span>
          <div class="mode-toggle">
            <button 
              type="button" 
              class="btn-mode btn-paint" 
              [class.active]="brushMode === 'paint'" 
              (click)="setBrushMode('paint')"
            >
              🖌️ Modo Pintar
            </button>
            <button 
              type="button" 
              class="btn-mode btn-erase" 
              [class.active]="brushMode === 'erase'" 
              (click)="setBrushMode('erase')"
            >
              🧹 Modo Goma (Borrar)
            </button>
          </div>
        </div>

        @if (brushMode === 'paint') {
          <form [formGroup]="scheduleForm" class="brush-form-container">
            <div class="quick-templates">
              <span class="templates-label">Plantillas:</span>
              <button type="button" class="btn-template" (click)="applyTemplate('morning')">[M] Mañana (9:00 - 15:00)</button>
              <button type="button" class="btn-template" (click)="applyTemplate('afternoon')">[T] Tarde (15:00 - 21:00)</button>
              <button type="button" class="btn-template" (click)="applyTemplate('full')">[P] Partido (10:00 - 21:00 / Desc. 14:00 - 17:00)</button>
              <button type="button" class="btn-template btn-clear" (click)="applyTemplate('clear')">Limpiar</button>
            </div>

            <div class="brush-inputs">
              <div class="input-inline">
                <label>Jornada:</label>
                <input type="time" formControlName="horaInicio" class="form-control-inline" />
                <span>a</span>
                <input type="time" formControlName="horaFin" class="form-control-inline" />
              </div>
              <div class="input-inline">
                <label>Descanso:</label>
                <input type="time" formControlName="breakStartTime" class="form-control-inline" />
                <span>a</span>
                <input type="time" formControlName="breakEndTime" class="form-control-inline" />
              </div>
            </div>
            
            @if (scheduleForm.errors?.['invalidJornada']) {
              <span class="error-text">La hora de fin de jornada debe ser posterior a la de inicio.</span>
            }
            @if (scheduleForm.errors?.['invalidDescanso']) {
              <span class="error-text">El inicio del descanso debe ser previo a su fin.</span>
            }
            @if (scheduleForm.errors?.['descansoFueraJornada']) {
              <span class="error-text">El descanso debe estar dentro de la jornada laboral.</span>
            }
          </form>
        } @else {
          <div class="erase-info-box">
            <span>🧹 La goma de borrar está activa. Haz clic sobre cualquier turno asignado en el cuadrante para eliminarlo instantáneamente.</span>
          </div>
        }
      </div>

      @if (successMessage) {
        <div class="alert alert-success">{{ successMessage }}</div>
      }
      @if (errorMessage) {
        <div class="alert alert-danger">{{ errorMessage }}</div>
      }

      <!-- Matriz del Cuadrante -->
      <div class="matrix-scroll">
        <div class="quadrant-grid">
          <!-- Esquina superior izquierda -->
          <div class="grid-header-cell corner-cell">Profesional</div>
          <!-- Encabezados de días -->
          @for (day of weekDays; track day.getTime()) {
            <div class="grid-header-cell day-cell">
              <span class="day-name">{{ getDayName(day) }}</span>
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
              @if (getShift(worker.id, day); as shift) {
                <div 
                  [class]="getCellClass(shift)" 
                  (click)="onCellClick(worker, day, shift)"
                >
                  <div class="shift-time-block">
                    {{ shift.horaInicio }} - {{ shift.horaFin }}
                  </div>
                  @if (shift.breakStartTime && shift.breakEndTime) {
                    <div class="break-badge">
                      ☕ Descanso: {{ shift.breakStartTime }} - {{ shift.breakEndTime }}
                    </div>
                  }
                </div>
              } @else {
                <div 
                  [class]="getCellClass(undefined)" 
                  (click)="onCellClick(worker, day, undefined)"
                >
                  <span class="free-label">Libre</span>
                </div>
              }
            }
          }
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
      width: 100%;
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
    .cell-free {
      color: var(--text-secondary);
    }
    .cell-morning {
      background: rgba(59, 130, 246, 0.08);
      border-left: 3px solid #3b82f6;
    }
    .cell-afternoon {
      background: rgba(249, 115, 22, 0.08);
      border-left: 3px solid #f97316;
    }
    .cell-full {
      background: rgba(16, 185, 129, 0.08);
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

    /* Pincel Activo */
    .glass-panel-accent {
      background: rgba(212, 175, 55, 0.03);
      border: 1px solid rgba(212, 175, 55, 0.15);
      border-radius: var(--border-radius-md);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .brush-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .brush-title {
      font-weight: 700;
      color: var(--accent-gold);
      font-size: 1.1rem;
    }
    .mode-toggle {
      display: flex;
      gap: 0.5rem;
    }
    .btn-mode {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 0.5rem 1rem;
      border-radius: var(--border-radius-sm);
      cursor: pointer;
      font-weight: 600;
      font-size: 0.85rem;
      transition: all 0.2s ease;
    }
    .btn-mode.active.btn-paint {
      background: rgba(59, 130, 246, 0.15);
      border-color: #3b82f6;
      color: #93c5fd;
    }
    .btn-mode.active.btn-erase {
      background: rgba(220, 38, 38, 0.15);
      border-color: #ef4444;
      color: #fca5a5;
    }
    .brush-form-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .quick-templates {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .templates-label {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-right: 0.5rem;
    }
    .btn-template {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 0.4rem 0.75rem;
      border-radius: 4px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-template:hover {
      background: var(--accent-gold);
      color: #000;
      border-color: var(--accent-gold);
    }
    .btn-template.btn-clear {
      background: rgba(255, 255, 255, 0.02);
      border-color: rgba(220, 38, 38, 0.3);
      color: #f87171;
    }
    .btn-template.btn-clear:hover {
      background: rgba(220, 38, 38, 0.2);
      color: #fff;
    }
    .brush-inputs {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
    }
    .input-inline {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: var(--text-primary);
    }
    .input-inline label {
      font-weight: 600;
      color: var(--text-secondary);
    }
    .form-control-inline {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 0.3rem 0.5rem;
      border-radius: 4px;
      font-family: inherit;
      font-size: 0.85rem;
    }
    .form-control-inline:focus {
      border-color: var(--accent-gold);
      outline: none;
    }
    .erase-info-box {
      background: rgba(220, 38, 38, 0.05);
      border: 1px dashed rgba(220, 38, 38, 0.2);
      padding: 0.75rem 1rem;
      border-radius: var(--border-radius-sm);
      color: #fca5a5;
      font-size: 0.9rem;
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
    .error-text {
      color: #f87171;
      font-size: 0.8rem;
      display: block;
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

  // Pincel State
  brushMode: 'paint' | 'erase' = 'paint';

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
    
    const startHour = parseInt(shift.horaInicio.split(':')[0], 10);
    if (startHour < 14) {
      return 'grid-day-cell cell-morning';
    } else {
      return 'grid-day-cell cell-afternoon';
    }
  }

  setBrushMode(mode: 'paint' | 'erase'): void {
    this.brushMode = mode;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onCellClick(worker: WorkerDto, date: Date, shift: ShiftDto | undefined): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.brushMode === 'erase') {
      if (shift && shift.id) {
        this.submitting = true;
        this.scheduleService.deleteShift(shift.id).subscribe({
          next: () => {
            this.submitting = false;
            this.successMessage = `Turno eliminado para ${worker.nombre}.`;
            this.loadWeekShifts();
          },
          error: (err) => {
            this.submitting = false;
            this.errorMessage = err.error?.error || 'Error al eliminar el turno.';
          }
        });
      }
    } else {
      if (this.scheduleForm.invalid) {
        this.errorMessage = 'Por favor, configura un horario válido en el pincel (Inicio y Fin obligatorios).';
        return;
      }

      this.submitting = true;
      const formVal = this.scheduleForm.value;
      const request: ShiftRequestDto = {
        fecha: this.formatDate(date),
        horaInicio: formVal.horaInicio,
        horaFin: formVal.horaFin,
        breakStartTime: formVal.breakStartTime || null,
        breakEndTime: formVal.breakEndTime || null
      };

      this.scheduleService.saveShift(worker.id, request).subscribe({
        next: () => {
          this.submitting = false;
          this.successMessage = `Turno asignado a ${worker.nombre}.`;
          this.loadWeekShifts();
        },
        error: (err) => {
          this.submitting = false;
          this.errorMessage = err.error?.error || 'Error al guardar el turno.';
        }
      });
    }
  }

  getDayName(date: Date): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
  }

  applyTemplate(type: string): void {
    this.scheduleForm.enable();
    if (type === 'morning') {
      this.scheduleForm.patchValue({
        horaInicio: '09:00',
        horaFin: '15:00',
        breakStartTime: '',
        breakEndTime: ''
      });
    } else if (type === 'afternoon') {
      this.scheduleForm.patchValue({
        horaInicio: '15:00',
        horaFin: '21:00',
        breakStartTime: '',
        breakEndTime: ''
      });
    } else if (type === 'full') {
      this.scheduleForm.patchValue({
        horaInicio: '10:00',
        horaFin: '21:00',
        breakStartTime: '14:00',
        breakEndTime: '17:00'
      });
    } else if (type === 'clear') {
      this.scheduleForm.patchValue({
        horaInicio: '',
        horaFin: '',
        breakStartTime: '',
        breakEndTime: ''
      });
    }
  }

  private formatDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
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
