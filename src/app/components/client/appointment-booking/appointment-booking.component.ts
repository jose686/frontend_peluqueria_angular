import { Component, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CatalogService } from '../../../services/catalog.service';
import { WorkerService } from '../../../services/worker.service';
import { AppointmentService } from '../../../services/appointment.service';
import { PublicAppointmentService } from '../../../services/public-appointment.service';
import { AuthService } from '../../../services/auth.service';
import { ServiceItemDto } from '../../../models/catalog.model';
import { WorkerDto } from '../../../models/worker.model';
import { AppointmentRequest, PublicBookRequest } from '../../../models/appointment.model';

@Component({
  selector: 'app-appointment-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Tour Overlay Backdrop -->
    @if (tourActive) {
      <div class="tour-overlay" (click)="endTour()"></div>
    }

    <div class="booking-container glass-panel fade-in-el">
      <div class="booking-header">
        <h2>Reservar Nueva Cita</h2>
        <button type="button" class="btn-tour-trigger" (click)="startTour()">
          💡 ¿Cómo pedir cita? (Guía paso a paso)
        </button>
      </div>

      <!-- Stepper Visual Horizontal -->
      <div class="booking-stepper card-border">
        <div class="step-item" [class.active]="getCurrentStep() === 1">
          <span class="step-badge">1</span> Servicio
        </div>
        <div class="step-separator">➔</div>
        <div class="step-item" [class.active]="getCurrentStep() === 2">
          <span class="step-badge">2</span> Profesional
        </div>
        <div class="step-separator">➔</div>
        <div class="step-item" [class.active]="getCurrentStep() === 3">
          <span class="step-badge">3</span> Fecha y Hora
        </div>
        <div class="step-separator">➔</div>
        <div class="step-item" [class.active]="getCurrentStep() === 4">
          <span class="step-badge">4</span> Datos
        </div>
      </div>
      
      @if (successMessage) {
        <div class="alert alert-success">{{ successMessage }}</div>
      }
      @if (errorMessage) {
        <div class="alert alert-danger">{{ errorMessage }}</div>
      }

      <form [formGroup]="bookingForm" (ngSubmit)="onSubmit()">
        <!-- Paso A: Cargar la lista de servicios -->
        <div class="form-group relative-position" [class.tour-highlight]="tourActive && tourStep === 1">
          <label class="form-label" for="serviceItemId">1. Selecciona el Servicio *</label>
          <select id="serviceItemId" formControlName="serviceItemId" class="form-control" (change)="onServiceChange()">
            <option value="">Seleccione un servicio...</option>
            @for (service of services; track service.id) {
              <option [value]="service.id">{{ service.nombre }} ({{ service.precio }}€ - {{ service.duracionMinutos }} min)</option>
            }
          </select>

          <!-- Tooltip Paso 1 -->
          @if (tourActive && tourStep === 1) {
            <div class="tour-tooltip tour-tooltip-step-1">
              <h4><span>Paso 1: Servicio</span> <button type="button" class="close-tour-btn" (click)="endTour()">&times;</button></h4>
              <p>Elige el servicio que deseas reservar en esta lista desplegable (ej. Peinado, Corte de Pelo).</p>
              <div class="tour-buttons">
                <span>1 / 4</span>
                <button type="button" class="btn btn-primary btn-sm" (click)="nextTourStep()">Siguiente &rarr;</button>
              </div>
            </div>
          }
        </div>

        <!-- Paso B: Al seleccionar servicio, cargar trabajadores -->
        @if (bookingForm.get('serviceItemId')?.value || tourActive) {
          <div class="form-group fade-in-el relative-position" [class.tour-highlight]="tourActive && tourStep === 2">
            <label class="form-label" for="workerId">2. Selecciona el Profesional *</label>
            <select id="workerId" formControlName="workerId" class="form-control" (change)="onWorkerChange()">
              <option value="">Seleccione un profesional...</option>
              @for (worker of workers; track worker.id) {
                <option [value]="worker.id">{{ worker.nombre }} - {{ worker.especialidad }}</option>
              }
            </select>

            <!-- Tooltip Paso 2 -->
            @if (tourActive && tourStep === 2) {
              <div class="tour-tooltip tour-tooltip-step-2">
                <h4><span>Paso 2: Estilista</span> <button type="button" class="close-tour-btn" (click)="endTour()">&times;</button></h4>
                <p>Elige a tu profesional o peluquero favorito. Si no tienes preferencia, escoge cualquiera.</p>
                <div class="tour-buttons">
                  <button type="button" class="btn btn-secondary btn-sm" (click)="prevTourStep()">&larr; Atrás</button>
                  <span>2 / 4</span>
                  <button type="button" class="btn btn-primary btn-sm" (click)="nextTourStep()">Siguiente &rarr;</button>
                </div>
              </div>
            }
          </div>
        }

        <!-- Calendario Visual Interactivo (Paso C) -->
        @if ((bookingForm.get('workerId')?.value || tourActive)) {
          <div class="calendar-section fade-in-el card-border relative-position" [class.tour-highlight]="tourActive && tourStep === 3">
            <div class="calendar-header">
              <h3>3. Selecciona la Fecha</h3>
              <div class="month-nav">
                <button type="button" class="btn btn-icon" (click)="changeMonth(-1)" [disabled]="isCurrentMonthOrPast()">&lt;</button>
                <span class="month-title">{{ getMonthYearLabel() }}</span>
                <button type="button" class="btn btn-icon" (click)="changeMonth(1)">&gt;</button>
              </div>
            </div>

            <!-- Grid de días de la semana -->
            <div class="weekdays-grid">
              <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span>
            </div>

            <!-- Grid del mes -->
            @if (loadingCalendar) {
              <p class="loading-text">Cargando disponibilidad del mes...</p>
            } @else {
              <div class="days-grid">
                @for (day of calendarDays; track day.dateString) {
                  @if (day.isPadding) {
                    <div class="day-cell padding"></div>
                  } @else {
                    <button type="button" 
                            class="day-cell"
                            [class.past]="day.isPast"
                            [class.available]="day.isAvailable"
                            [class.busy]="!day.isPast && !day.isAvailable"
                            [class.selected]="bookingForm.get('fecha')?.value === day.dateString"
                            [disabled]="day.isPast || !day.isAvailable"
                            (click)="selectDate(day.dateString)">
                      {{ day.dayNumber }}
                    </button>
                  }
                }
              </div>
            }

            <div class="legend">
              <span class="legend-item"><span class="dot available"></span> Disponible</span>
              <span class="legend-item"><span class="dot busy"></span> Completo/Cerrado</span>
            </div>

            <!-- Tooltip Paso 3 -->
            @if (tourActive && tourStep === 3) {
              <div class="tour-tooltip tour-tooltip-step-3">
                <h4><span>Paso 3: Calendario</span> <button type="button" class="close-tour-btn" (click)="endTour()">&times;</button></h4>
                <p>Haz clic en los días marcados en verde (disponibles). Los días completos o festivos estarán desactivados en rojo.</p>
                <div class="tour-buttons">
                  <button type="button" class="btn btn-secondary btn-sm" (click)="prevTourStep()">&larr; Atrás</button>
                  <span>3 / 4</span>
                  <button type="button" class="btn btn-primary btn-sm" (click)="nextTourStep()">Siguiente &rarr;</button>
                </div>
              </div>
            }
          </div>
        }

        <!-- Selector de Franjas Horarias (Slots - Paso D) -->
        @if ((bookingForm.get('fecha')?.value && bookingForm.get('workerId')?.value) || tourActive) {
          <div class="slots-section fade-in-el card-border">
            <h3>4. Selecciona la Hora</h3>
            @if (loadingSlots) {
              <p class="loading-text">Buscando turnos disponibles...</p>
            } @else if (availableSlots.length > 0) {
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
            } @else {
              <div class="alert alert-warning">No hay turnos disponibles para esta fecha.</div>
            }
          </div>
        }

        <!-- Datos del Cliente (Sólo si NO está autenticado) -->
        @if ((bookingForm.get('horaInicio')?.value && !isLoggedIn()) || (tourActive && tourStep === 4)) {
          <div class="guest-details-section card-border fade-in-el relative-position" [class.tour-highlight]="tourActive && tourStep === 4">
            <h3>Datos de Contacto</h3>
            <p class="subtext">Necesitamos tu nombre y teléfono para enviarte el código de confirmación.</p>
            
            <div class="form-group">
              <label class="form-label" for="nombre">Nombre Completo *</label>
              <input type="text" id="nombre" formControlName="nombre" class="form-control" placeholder="Ej: Juan Pérez" />
            </div>

            <div class="form-group">
              <label class="form-label" for="telefono">Teléfono Móvil *</label>
              <input type="tel" id="telefono" formControlName="telefono" class="form-control" placeholder="Ej: 600123456" />
            </div>

            <!-- Solicitar PIN / OTP -->
            @if (!otpSent) {
              <button type="button" 
                      [disabled]="!bookingForm.get('nombre')?.value || !bookingForm.get('telefono')?.value || requestingOtp" 
                      class="btn btn-secondary btn-block" 
                      (click)="sendOtpCode()">
                {{ requestingOtp ? 'Enviando PIN...' : 'Enviar PIN de Verificación' }}
              </button>
            } @else {
              <div class="form-group fade-in-el">
                <label class="form-label" for="pin">Código de Verificación (PIN) *</label>
                <input type="text" id="pin" formControlName="pin" class="form-control" placeholder="Introduce el PIN recibido" />
                <span class="resend-link" (click)="sendOtpCode()">¿No recibiste el código? Solicitar uno nuevo</span>
              </div>
            }

            <!-- Tooltip Paso 4 -->
            @if (tourActive && tourStep === 4) {
              <div class="tour-tooltip tour-tooltip-step-4">
                <h4><span>Paso 4: Registro OTP</span> <button type="button" class="close-tour-btn" (click)="endTour()">&times;</button></h4>
                <p>Escribe tu nombre y teléfono móvil. Te llegará un PIN SMS/WhatsApp para confirmar tu reserva al instante.</p>
                <div class="tour-buttons">
                  <button type="button" class="btn btn-secondary btn-sm" (click)="prevTourStep()">&larr; Atrás</button>
                  <span>4 / 4</span>
                  <button type="button" class="btn btn-primary btn-sm" (click)="endTour()">Entendido</button>
                </div>
              </div>
            }
          </div>
        }

        <!-- Botón de Envío -->
        @if (bookingForm.get('horaInicio')?.value && (isLoggedIn() || otpSent) && !tourActive) {
          <button type="submit" 
                  [disabled]="bookingForm.invalid || submitting" 
                  class="btn btn-primary btn-block">
            {{ submitting ? 'Procesando Reserva...' : 'Confirmar Cita' }}
          </button>
        }

        <!-- Botón Limpiar Formulario -->
        @if (bookingForm.get('serviceItemId')?.value && !tourActive) {
          <button type="button" 
                  (click)="resetForm()" 
                  class="btn btn-secondary btn-block" 
                  style="margin-top: 0.75rem; background: transparent; border: 1px dashed rgba(255,255,255,0.2); color: var(--text-secondary);">
            🧹 Limpiar Formulario
          </button>
        }
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
    .booking-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
    }
    .booking-header h2 {
      font-size: 1.8rem;
      color: var(--text-primary);
      margin: 0;
    }
    .btn-tour-trigger {
      background: transparent;
      border: 1px solid var(--accent-gold);
      color: var(--accent-gold);
      padding: 0.4rem 0.8rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-tour-trigger:hover {
      background: var(--accent-gold);
      color: #000;
      box-shadow: 0 0 8px rgba(212, 163, 89, 0.3);
    }
    /* Stepper Progress Bar */
    .booking-stepper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      margin-bottom: 2rem;
      background: rgba(255, 255, 255, 0.01);
      border-radius: 8px;
    }
    .step-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
      transition: all 0.2s ease;
    }
    .step-badge {
      display: inline-flex;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-primary);
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
    }
    .step-item.active {
      color: var(--accent-gold);
    }
    .step-item.active .step-badge {
      background: var(--accent-gold);
      color: #000;
      font-weight: 700;
    }
    .step-separator {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.1);
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    .relative-position {
      position: relative;
    }
    .calendar-section, .slots-section {
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      background: rgba(255, 255, 255, 0.01);
    }
    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .calendar-header h3, .slots-section h3 {
      font-size: 1.15rem;
      color: var(--text-primary);
      margin: 0;
    }
    .month-nav {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .month-title {
      font-weight: 600;
      color: var(--accent-gold);
      min-width: 120px;
      text-align: center;
      text-transform: capitalize;
    }
    .weekdays-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      text-align: center;
      font-weight: 600;
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }
    .days-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.4rem;
    }
    .day-cell {
      aspect-ratio: 1;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 0.9rem;
      transition: all 0.2s ease;
    }
    .day-cell.padding {
      background: transparent;
      border: none;
      cursor: default;
    }
    .day-cell.past {
      opacity: 0.25;
      cursor: not-allowed;
    }
    .day-cell.available {
      border-color: rgba(52, 211, 153, 0.4);
      background: rgba(52, 211, 153, 0.05);
    }
    .day-cell.available:hover {
      background: #34d399;
      color: #000;
      border-color: #34d399;
    }
    .day-cell.busy {
      border-color: rgba(239, 68, 68, 0.3);
      background: rgba(239, 68, 68, 0.03);
      opacity: 0.5;
      cursor: not-allowed;
    }
    .day-cell.selected {
      background: var(--accent-gold) !important;
      color: #000 !important;
      border-color: var(--accent-gold) !important;
      font-weight: 700;
      box-shadow: 0 0 10px rgba(212, 163, 89, 0.3);
    }
    .legend {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      margin-top: 1rem;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .dot.available {
      background: #34d399;
    }
    .dot.busy {
      background: #ef4444;
    }
    .slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 0.5rem;
      margin-top: 1rem;
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
      text-align: center;
      margin: 1.5rem 0;
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
    .btn-icon {
      padding: 0.25rem 0.6rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-icon:disabled {
      opacity: 0.25;
      cursor: not-allowed;
    }
    .guest-details-section {
      background: rgba(255, 255, 255, 0.01);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1.5rem;
      margin-top: 2rem;
      margin-bottom: 1.5rem;
    }
    .guest-details-section h3 {
      font-size: 1.2rem;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }
    .guest-details-section .subtext {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-bottom: 1.25rem;
    }
    .resend-link {
      display: inline-block;
      margin-top: 0.5rem;
      font-size: 0.8rem;
      color: var(--accent-gold);
      cursor: pointer;
      text-decoration: underline;
    }
    .resend-link:hover {
      color: #fff;
    }

    /* --- Tour Styles --- */
    .tour-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      z-index: 1000;
    }
    .tour-highlight {
      position: relative;
      z-index: 1001 !important;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 15px var(--accent-gold) !important;
      border-color: var(--accent-gold) !important;
      background: #121212 !important;
      border-radius: 6px;
      pointer-events: none;
    }
    .tour-tooltip {
      position: absolute;
      background: #181818;
      border: 2px solid var(--accent-gold);
      border-radius: 8px;
      padding: 1.25rem;
      width: 280px;
      z-index: 1002;
      color: #fff;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      pointer-events: auto;
    }
    .tour-tooltip-step-1 {
      top: 105%;
      left: 50%;
      transform: translateX(-50%);
    }
    .tour-tooltip-step-2 {
      top: 105%;
      left: 50%;
      transform: translateX(-50%);
    }
    .tour-tooltip-step-3 {
      top: 102%;
      left: 50%;
      transform: translateX(-50%);
    }
    .tour-tooltip-step-4 {
      bottom: 105%;
      left: 50%;
      transform: translateX(-50%);
    }
    .tour-tooltip h4 {
      color: var(--accent-gold);
      margin: 0;
      font-size: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .tour-tooltip p {
      margin: 0;
      font-size: 0.85rem;
      line-height: 1.4;
      color: var(--text-secondary);
    }
    .tour-buttons {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.25rem;
      font-size: 0.8rem;
    }
    .close-tour-btn {
      background: transparent;
      border: none;
      color: #fff;
      cursor: pointer;
      font-size: 1.2rem;
      line-height: 1;
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
  private publicAppointmentService = inject(PublicAppointmentService);
  private authService = inject(AuthService);

  isLoggedIn = this.authService.isLoggedIn;

  services: ServiceItemDto[] = [];
  workers: WorkerDto[] = [];
  availableSlots: string[] = [];
  today = new Date().toISOString().split('T')[0];

  // Calendar visual states
  currentMonth = new Date();
  calendarDays: any[] = [];
  loadingCalendar = false;
  availabilityMap: {[key: string]: boolean} = {};

  // Interactive Tour states
  tourActive = false;
  tourStep = 1;
  preTourFormValues: any = null;

  bookingForm: FormGroup = this.fb.group({
    serviceItemId: ['', [Validators.required]],
    workerId: ['', [Validators.required]],
    fecha: ['', [Validators.required]],
    horaInicio: ['', [Validators.required]],
    nombre: [''],
    telefono: [''],
    pin: ['']
  });

  loadingSlots = false;
  submitting = false;
  requestingOtp = false;
  otpSent = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    this.loadServices();
    this.setupGuestValidators();
  }

  setupGuestValidators(): void {
    if (!this.isLoggedIn()) {
      this.bookingForm.get('nombre')?.setValidators([Validators.required]);
      this.bookingForm.get('telefono')?.setValidators([Validators.required]);
      this.bookingForm.get('pin')?.setValidators([Validators.required]);
    } else {
      this.bookingForm.get('nombre')?.clearValidators();
      this.bookingForm.get('telefono')?.clearValidators();
      this.bookingForm.get('pin')?.clearValidators();
    }
    this.bookingForm.get('nombre')?.updateValueAndValidity();
    this.bookingForm.get('telefono')?.updateValueAndValidity();
    this.bookingForm.get('pin')?.updateValueAndValidity();
  }

  loadServices(): void {
    this.catalogService.getServiceItems().subscribe({
      next: (data) => {
        this.services = data;
      },
      error: () => {
        this.errorMessage = 'Error al cargar los servicios de peluquería.';
      }
    });
  }

  onServiceChange(): void {
    if (this.tourActive) return;
    this.bookingForm.patchValue({ workerId: '', fecha: '', horaInicio: '' });
    this.workers = [];
    this.availableSlots = [];
    this.calendarDays = [];

    const serviceId = this.bookingForm.get('serviceItemId')?.value;
    if (serviceId) {
      this.workerService.getAll().subscribe({
        next: (data) => {
          this.workers = data;
        },
        error: () => {
          this.errorMessage = 'Error al cargar profesionales en el paso 2.';
        }
      });
    }
  }

  onWorkerChange(): void {
    if (this.tourActive) return;
    this.bookingForm.patchValue({ fecha: '', horaInicio: '' });
    this.availableSlots = [];
    this.currentMonth = new Date();
    this.generateCalendar();
  }

  getCurrentStep(): number {
    if (this.tourActive) return this.tourStep;
    if (!this.bookingForm.value.serviceItemId) return 1;
    if (!this.bookingForm.value.workerId) return 2;
    if (!this.bookingForm.value.fecha || !this.bookingForm.value.horaInicio) return 3;
    return 4;
  }

  resetForm(): void {
    this.bookingForm.reset();
    this.otpSent = false;
    this.calendarDays = [];
    this.availableSlots = [];
    this.currentMonth = new Date();
    this.setupGuestValidators();
    this.errorMessage = '';
    this.successMessage = '';
  }

  // --- Lógica del Calendario Visual ---
  generateCalendar(): void {
    const serviceId = this.bookingForm.get('serviceItemId')?.value;
    const workerId = this.bookingForm.get('workerId')?.value;
    if (!serviceId || !workerId) return;

    this.loadingCalendar = true;
    this.calendarDays = [];

    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    const startDateStr = this.formatDate(startOfMonth);
    const endDateStr = this.formatDate(endOfMonth);

    this.publicAppointmentService.getAvailableDaysRange(workerId, serviceId, startDateStr, endDateStr).subscribe({
      next: (map) => {
        this.availabilityMap = map;
        this.buildCalendarGrid(year, month);
        this.loadingCalendar = false;
      },
      error: () => {
        this.loadingCalendar = false;
        this.errorMessage = 'No se pudo cargar la disponibilidad en el calendario.';
      }
    });
  }

  buildCalendarGrid(year: number, month: number): void {
    const tempDays: any[] = [];
    const firstDay = new Date(year, month, 1);
    let dayOfWeek = firstDay.getDay() - 1;
    if (dayOfWeek < 0) dayOfWeek = 6;

    for (let i = 0; i < dayOfWeek; i++) {
      tempDays.push({ isPadding: true });
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateString = this.formatDate(dateObj);
      const isPast = dateObj.getTime() < todayDate.getTime();
      const isAvailable = !!this.availabilityMap[dateString];

      tempDays.push({
        isPadding: false,
        dayNumber: day,
        dateString,
        isPast,
        isAvailable
      });
    }

    this.calendarDays = tempDays;
  }

  changeMonth(offset: number): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + offset, 1);
    this.bookingForm.patchValue({ fecha: '', horaInicio: '' });
    this.availableSlots = [];
    this.generateCalendar();
  }

  isCurrentMonthOrPast(): boolean {
    const today = new Date();
    const currentYM = this.currentMonth.getFullYear() * 12 + this.currentMonth.getMonth();
    const todayYM = today.getFullYear() * 12 + today.getMonth();
    return currentYM <= todayYM;
  }

  getMonthYearLabel(): string {
    return this.currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  }

  selectDate(dateString: string): void {
    this.bookingForm.patchValue({ fecha: dateString, horaInicio: '' });
    this.availableSlots = [];
    this.loadSlotsForDate(dateString);
  }

  loadSlotsForDate(fecha: string): void {
    const serviceId = this.bookingForm.get('serviceItemId')?.value;
    const workerId = this.bookingForm.get('workerId')?.value;

    if (serviceId && workerId && fecha) {
      this.loadingSlots = true;
      const slotsObs = this.isLoggedIn() 
        ? this.appointmentService.getAvailableSlots(workerId, serviceId, fecha)
        : this.publicAppointmentService.getAvailableSlots(workerId, serviceId, fecha);

      slotsObs.subscribe({
        next: (res) => {
          this.availableSlots = res.horasDisponibles;
          this.loadingSlots = false;
        },
        error: () => {
          this.loadingSlots = false;
          this.errorMessage = 'Error al consultar las horas disponibles.';
        }
      });
    }
  }

  selectSlot(slot: string): void {
    this.bookingForm.patchValue({ horaInicio: slot });
  }

  // --- Lógica del Asistente Guiado (Tour) ---
  startTour(): void {
    this.preTourFormValues = this.bookingForm.value;
    this.tourActive = true;
    this.tourStep = 1;

    this.bookingForm.patchValue({
      serviceItemId: this.services[0]?.id || 'mock-id',
      workerId: this.workers[0]?.id || 'mock-id',
      fecha: this.today,
      horaInicio: '10:00:00'
    });
    this.availableSlots = ['10:00:00', '11:00:00', '12:00:00'];
    this.calendarDays = [
      { isPadding: false, dayNumber: 15, dateString: this.today, isPast: false, isAvailable: true }
    ];
  }

  nextTourStep(): void {
    if (this.tourStep < 4) {
      this.tourStep++;
    } else {
      this.endTour();
    }
  }

  prevTourStep(): void {
    if (this.tourStep > 1) {
      this.tourStep--;
    }
  }

  endTour(): void {
    this.tourActive = false;
    this.bookingForm.reset();
    
    this.bookingForm.patchValue(this.preTourFormValues);
    this.setupGuestValidators();

    const serviceId = this.bookingForm.get('serviceItemId')?.value;
    const workerId = this.bookingForm.get('workerId')?.value;
    const fecha = this.bookingForm.get('fecha')?.value;

    if (serviceId && workerId) {
      this.generateCalendar();
      if (fecha) {
        this.loadSlotsForDate(fecha);
      }
    } else {
      this.availableSlots = [];
      this.calendarDays = [];
    }
  }

  sendOtpCode(): void {
    const telefono = this.bookingForm.get('telefono')?.value;
    if (!telefono) {
      this.errorMessage = 'Por favor, introduce un número de teléfono válido.';
      return;
    }

    this.requestingOtp = true;
    this.errorMessage = '';
    this.publicAppointmentService.sendOtp(telefono).subscribe({
      next: () => {
        this.requestingOtp = false;
        this.otpSent = true;
        this.successMessage = 'Código PIN enviado correctamente.';
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        this.requestingOtp = false;
        this.errorMessage = err.error?.error || 'No se pudo solicitar el código PIN.';
      }
    });
  }

  onSubmit(): void {
    if (this.bookingForm.valid) {
      this.submitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      if (this.isLoggedIn()) {
        const request: AppointmentRequest = {
          workerId: this.bookingForm.value.workerId,
          serviceItemId: this.bookingForm.value.serviceItemId,
          fecha: this.bookingForm.value.fecha,
          horaInicio: this.bookingForm.value.horaInicio
        };

        this.appointmentService.createAppointment(request).subscribe({
          next: () => {
            this.handleSuccess();
          },
          error: (err) => {
            this.submitting = false;
            this.errorMessage = err.error?.error || 'No se pudo completar la reserva de cita.';
          }
        });
      } else {
        const rawPhone = this.bookingForm.value.telefono;
        const sanitizedPin = this.bookingForm.value.pin ? String(this.bookingForm.value.pin).trim().replace(/\D/g, '') : '';

        const request: PublicBookRequest = {
          workerId: this.bookingForm.value.workerId,
          serviceItemId: this.bookingForm.value.serviceItemId,
          fecha: this.bookingForm.value.fecha,
          horaInicio: this.bookingForm.value.horaInicio,
          nombre: this.bookingForm.value.nombre,
          telefono: rawPhone,
          pin: sanitizedPin
        };

        this.publicAppointmentService.bookAppointment(request).subscribe({
          next: () => {
            sessionStorage.setItem('otp_phone', rawPhone);
            sessionStorage.setItem('otp_pin', sanitizedPin);
            this.handleSuccess();
          },
          error: (err) => {
            this.submitting = false;
            this.errorMessage = err.error?.error || 'No se pudo registrar la cita. Verifica el código PIN.';
          }
        });
      }
    }
  }

  private handleSuccess(): void {
    this.submitting = false;
    this.successMessage = '¡Cita reservada con éxito!';
    this.bookingSuccess.emit();
    
    this.bookingForm.reset();
    this.otpSent = false;
    this.calendarDays = [];
    this.availableSlots = [];
    this.currentMonth = new Date();
    
    this.setupGuestValidators();
    
    setTimeout(() => {
      this.successMessage = '';
    }, 4000);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
