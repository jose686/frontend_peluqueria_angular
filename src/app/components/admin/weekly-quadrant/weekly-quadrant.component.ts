import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="quadrant-container glass-panel fade-in-el">
      <div class="header-bar">
        <div>
          <h2>Cuadrante Semanal</h2>
          <p class="subtitle">Matriz de turnos y descansos de Aura Studio. Configura tu pincel y haz clic directo en las celdas.</p>
        </div>
        <!-- Navegador de Semanas -->
        <div class="navigator">
          <button 
            type="button" 
            class="btn btn-secondary btn-undo" 
            [disabled]="historyStack.length === 0" 
            (click)="undo()"
          >
            ↩️ Deshacer (Ctrl+Z)
          </button>
          <button class="btn btn-secondary" (click)="navigateWeek(-7)">◀ Semana Anterior</button>
          <span class="week-label">Del {{ weekDays[0] | date:'dd/MM' }} al {{ weekDays[6] | date:'dd/MM/yyyy' }}</span>
          <button class="btn btn-secondary" (click)="navigateWeek(7)">Semana Siguiente ▶</button>
          <button type="button" class="btn btn-secondary btn-copy-week" (click)="copyPreviousWeek()">📋 Copiar Anterior</button>
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
              <button type="button" class="btn-template btn-clear" (click)="applyTemplate('clear')">Limpiar Pincel</button>
            </div>

            <div class="brush-inputs">
              <div class="input-inline">
                <label>Jornada:</label>
                <input type="time" step="60" formControlName="horaInicio" class="form-control-inline" />
                <span>a</span>
                <input type="time" step="60" formControlName="horaFin" class="form-control-inline" />
              </div>
              <div class="input-inline">
                <label>Descanso:</label>
                <input type="time" step="60" formControlName="breakStartTime" class="form-control-inline" />
                <span>a</span>
                <input type="time" step="60" formControlName="breakEndTime" class="form-control-inline" />
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



      <!-- Matriz del Cuadrante -->
      <div class="matrix-scroll">
        <div class="quadrant-grid">
          <!-- Esquina superior izquierda -->
          <div class="grid-header-cell corner-cell">Profesional</div>
          <!-- Nueva columna: Total Horas -->
          <div class="grid-header-cell hours-header-cell">Total Horas</div>
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
              <div class="worker-header-row">
                <div>
                  <span class="worker-title">{{ worker.nombre }}</span>
                  <span class="worker-spec" style="display: block;">{{ worker.especialidad }}</span>
                </div>
                
                @if (swappingSourceWorker === null) {
                  <button type="button" class="btn-icon-action" title="Intercambiar horario semanal" (click)="startRowSwapping(worker)">
                    🔄
                  </button>
                } @else if (swappingSourceWorker.id === worker.id) {
                  <button type="button" class="btn-icon-action active" title="Cancelar intercambio" (click)="cancelRowSwapping()">
                    ❌
                  </button>
                } @else {
                  <button type="button" class="btn-icon-action paste" title="Intercambiar con este profesional" (click)="executeRowSwap(worker)">
                    🔄 Intercambiar
                  </button>
                }
              </div>
            </div>

            <!-- Nueva celda: Total Horas -->
            <div class="worker-hours-cell">
              <span class="total-hours-badge">{{ calculateWeeklyHours(worker.id) }}</span>
            </div>
            
            <!-- Celdas de días -->
            @for (day of weekDays; track day.getTime()) {
              @if (getShift(worker.id, day); as shift) {
                <div 
                  [class]="getCellClass(shift)" 
                  (click)="onCellClick(worker, day, shift)"
                  (contextmenu)="onCellRightClick($event, shift)"
                >
                  <div class="shift-time-block">
                    {{ formatTime(shift.horaInicio) }} - {{ formatTime(shift.horaFin) }}
                  </div>
                  @if (shift.breakStartTime && shift.breakEndTime) {
                    <div class="break-badge">
                      ☕ Descanso: {{ formatTime(shift.breakStartTime) }} - {{ formatTime(shift.breakEndTime) }}
                    </div>
                  }
                </div>
              } @else {
                <div 
                  [class]="getCellClass(undefined)" 
                  (click)="onCellClick(worker, day, undefined)"
                  (contextmenu)="onCellRightClick($event, undefined)"
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
      grid-template-columns: 200px 100px repeat(7, minmax(130px, 1fr));
      background: rgba(255, 255, 255, 0.02);
    }
    .hours-header-cell {
      font-size: 0.9rem;
      color: var(--accent-gold);
    }
    .worker-hours-cell {
      padding: 1rem;
      background: rgba(0, 0, 0, 0.15);
      border-bottom: 1px solid var(--border-color);
      border-right: 2px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .total-hours-badge {
      font-weight: 700;
      color: var(--accent-gold);
      background: rgba(212, 175, 55, 0.1);
      padding: 0.35rem 0.6rem;
      border-radius: 4px;
      border: 1px solid rgba(212, 175, 55, 0.2);
      font-size: 0.85rem;
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
    .btn-copy-week {
      border-color: var(--accent-gold);
      color: var(--accent-gold);
      margin-left: 0.5rem;
    }
    .btn-copy-week:hover {
      background: var(--accent-gold);
      color: #000;
    }
    .btn-undo:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      border-color: rgba(255, 255, 255, 0.1);
      color: var(--text-secondary);
    }
    .worker-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .btn-icon-action {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .btn-icon-action:hover {
      background: var(--accent-gold);
      color: #000;
      border-color: var(--accent-gold);
    }
    .btn-icon-action.active {
      background: rgba(220, 38, 38, 0.2);
      border-color: #ef4444;
      color: #fff;
    }
    .btn-icon-action.paste {
      background: rgba(16, 185, 129, 0.2);
      border-color: #10b981;
      color: #34d399;
    }
    .btn-icon-action.paste:hover {
      background: #10b981;
      color: #fff;
    }
  `]
})
export class WeeklyQuadrantComponent implements OnInit {
  private fb = inject(FormBuilder);
  private workerService = inject(WorkerService);
  private scheduleService = inject(WorkerScheduleService);
  private cdr = inject(ChangeDetectorRef);

  workers: WorkerDto[] = [];
  shifts: ShiftDto[] = [];
  weekDays: Date[] = [];
  currentReferenceDate: Date = new Date();
  swappingSourceWorker: WorkerDto | null = null;
  historyStack: ShiftDto[][] = [];

  // Pincel State
  brushMode: 'paint' | 'erase' = 'paint';

  scheduleForm: FormGroup = this.fb.group({
    horaInicio: ['', [Validators.required]],
    horaFin: ['', [Validators.required]],
    breakStartTime: [''],
    breakEndTime: ['']
  }, { validators: [this.scheduleTimeValidator] });

  submitting = false;

  ngOnInit(): void {
    this.calculateWeekDays();
    this.loadWorkers();
    this.loadWeekShifts();
  }

  loadWorkers(): void {
    this.workerService.getAll().subscribe({
      next: (data) => {
        this.workers = data;
        this.cdr.markForCheck();
      },
      error: () => {
        console.error('No se pudieron cargar los estilistas.');
        this.cdr.markForCheck();
      }
    });
  }

  loadWeekShifts(): void {
    const formattedStart = this.formatDate(this.weekDays[0]);
    this.scheduleService.getShiftsByWeek(formattedStart).subscribe({
      next: (data) => {
        this.shifts = data;
        this.historyStack = [];
        this.cdr.markForCheck();
      },
      error: () => {
        console.error('No se pudieron cargar los turnos de la semana.');
        this.cdr.markForCheck();
      }
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
    this.cdr.markForCheck();
  }

  onCellClick(worker: WorkerDto, date: Date, shift: ShiftDto | undefined): void {
    if (this.brushMode === 'erase') {
      if (shift && shift.id) {
        this.submitting = true;
        this.saveHistoryState();
        this.scheduleService.deleteShift(shift.id).subscribe({
          next: () => {
            this.submitting = false;
            this.shifts = this.shifts.filter(s => s.id !== shift.id);
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.submitting = false;
            // Si el backend indica que ya no existe (por haber sido borrado), limpiamos localmente
            if (err.status === 400 || err.error?.error === 'Turno no encontrado') {
              this.shifts = this.shifts.filter(s => s.id !== shift.id);
            } else {
              console.error(err.error?.error || 'Error al eliminar el turno.');
            }
            this.cdr.markForCheck();
          }
        });
      }
    } else {
      if (this.scheduleForm.invalid) {
        return;
      }

      this.submitting = true;
      this.saveHistoryState();
      const formVal = this.scheduleForm.value;
      const request: ShiftRequestDto = {
        fecha: this.formatDate(date),
        horaInicio: formVal.horaInicio,
        horaFin: formVal.horaFin,
        breakStartTime: formVal.breakStartTime || null,
        breakEndTime: formVal.breakEndTime || null
      };

      this.scheduleService.saveShift(worker.id, request).subscribe({
        next: (savedShift) => {
          this.submitting = false;

          const index = this.shifts.findIndex(s => s.workerId === worker.id && s.fecha === request.fecha);
          if (index !== -1) {
            this.shifts[index] = savedShift;
          } else {
            this.shifts.push(savedShift);
          }
          this.shifts = [...this.shifts];
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.submitting = false;
          console.error(err.error?.error || 'Error al guardar el turno.');
          this.cdr.markForCheck();
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
    if (type === 'clear') {
      this.scheduleForm.patchValue({
        horaInicio: '',
        horaFin: '',
        breakStartTime: '',
        breakEndTime: ''
      });
    }
    this.cdr.markForCheck();
  }

  formatTime(time: string | undefined): string {
    if (!time) return '';
    return time.substring(0, 5); // "09:00:00" -> "09:00"
  }

  calculateWeeklyHours(workerId: string): string {
    const activeWeekDates = this.weekDays.map(d => this.formatDate(d));
    const uniqueShiftsByDate = new Map<string, ShiftDto>();

    for (const shift of this.shifts) {
      if (shift.workerId === workerId && activeWeekDates.includes(shift.fecha)) {
        uniqueShiftsByDate.set(shift.fecha, shift);
      }
    }

    let totalMinutes = 0;
    for (const shift of uniqueShiftsByDate.values()) {
      if (!shift.horaInicio || !shift.horaFin) continue;
      const shiftMinutes = this.parseTimeToMinutes(shift.horaFin) - this.parseTimeToMinutes(shift.horaInicio);
      let breakMinutes = 0;
      if (shift.breakStartTime && shift.breakEndTime) {
        breakMinutes = this.parseTimeToMinutes(shift.breakEndTime) - this.parseTimeToMinutes(shift.breakStartTime);
      }
      totalMinutes += Math.max(0, shiftMinutes - breakMinutes);
    }
    const totalHours = totalMinutes / 60;
    return Number.isInteger(totalHours) ? `${totalHours}h` : `${totalHours.toFixed(1)} h`;
  }

  onCellRightClick(event: MouseEvent, shift: ShiftDto | undefined): void {
    event.preventDefault();
    if (shift) {
      this.scheduleForm.patchValue({
        horaInicio: this.formatTime(shift.horaInicio),
        horaFin: this.formatTime(shift.horaFin),
        breakStartTime: this.formatTime(shift.breakStartTime) || '',
        breakEndTime: this.formatTime(shift.breakEndTime) || ''
      });
      this.brushMode = 'paint';
      this.cdr.markForCheck();
    }
  }

  private parseTimeToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  }

  private formatDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  copyPreviousWeek(): void {
    const monday = this.weekDays[0];
    const prevMonday = new Date(monday);
    prevMonday.setDate(monday.getDate() - 7);
    const fromStart = this.formatDate(prevMonday);
    const toStart = this.formatDate(monday);

    this.submitting = true;
    this.saveHistoryState();
    this.scheduleService.copyWeek(fromStart, toStart).subscribe({
      next: () => {
        this.submitting = false;
        this.loadWeekShifts();
      },
      error: (err) => {
        this.submitting = false;
        console.error(err.error?.error || 'Error al copiar la semana anterior.');
        this.cdr.markForCheck();
      }
    });
  }

  startRowSwapping(worker: WorkerDto): void {
    this.swappingSourceWorker = worker;
    this.cdr.markForCheck();
  }

  cancelRowSwapping(): void {
    this.swappingSourceWorker = null;
    this.cdr.markForCheck();
  }

  executeRowSwap(targetWorker: WorkerDto): void {
    if (!this.swappingSourceWorker) return;
    
    this.saveHistoryState();
    
    const workerAId = this.swappingSourceWorker.id;
    const workerBId = targetWorker.id;
    const activeWeekDates = this.weekDays.map(d => this.formatDate(d));

    this.shifts = this.shifts.map(shift => {
      if (activeWeekDates.includes(shift.fecha)) {
        if (shift.workerId === workerAId) {
          return { ...shift, workerId: workerBId };
        } else if (shift.workerId === workerBId) {
          return { ...shift, workerId: workerAId };
        }
      }
      return shift;
    });

    this.swappingSourceWorker = null;
    this.cdr.markForCheck();
  }

  saveHistoryState(): void {
    this.historyStack.push(this.shifts.map(s => ({ ...s })));
  }

  undo(): void {
    if (this.historyStack.length === 0) return;
    const previousState = this.historyStack.pop();
    if (previousState) {
      // Crear copias frescas (inmutabilidad) para romper bloqueos de referencia
      this.shifts = previousState.map(s => ({ ...s }));
      this.cdr.markForCheck();
      this.cdr.detectChanges(); // Forzar re-renderizado
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      this.undo();
    }
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
