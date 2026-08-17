import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AppointmentService } from '../../../services/appointment.service';
import { PublicAppointmentService } from '../../../services/public-appointment.service';
import { CatalogService } from '../../../services/catalog.service';
import { WorkerService } from '../../../services/worker.service';
import { AuthService } from '../../../services/auth.service';
import { AppointmentDto } from '../../../models/appointment.model';
import { ServiceItemDto } from '../../../models/catalog.model';
import { WorkerDto } from '../../../models/worker.model';
import { CurrencyPipe, DatePipe, CommonModule } from '@angular/common';
import { AppointmentBookingComponent } from '../appointment-booking/appointment-booking.component';

@Component({
  selector: 'app-mis-citas',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe, AppointmentBookingComponent, ReactiveFormsModule],
  template: `
    <div class="appointments-container fade-in-el">
      <div class="appointments-header">
        <h1>Mis Citas & Reservas</h1>
        <p>Gestiona tus reservas y solicita tus citas online al instante.</p>
      </div>

      <!-- Selector de Pestañas (Evita conflicto de botones) -->
      <div class="tabs-container card-border">
        <button class="tab-btn" [class.active]="activeTab === 'book'" (click)="activeTab = 'book'">
          📅 Reservar Nueva Cita
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'query'" (click)="activeTab = 'query'">
          🔍 Consultar / Cancelar mis Citas
        </button>
      </div>

      <div class="appointments-content-wrapper">
        <!-- Pestaña de Reservas -->
        @if (activeTab === 'book') {
          <div class="booking-tab-content fade-in-el">
            <app-appointment-booking (bookingSuccess)="onBookingSuccess()"></app-appointment-booking>
          </div>
        }

        <!-- Pestaña de Consulta -->
        @if (activeTab === 'query') {
          <div class="query-tab-content glass-panel fade-in-el">
            <!-- Si el usuario no está logueado y no ha verificado su teléfono, mostrar formulario de acceso por OTP -->
            @if (!isLoggedIn() && !phoneVerified) {
              <div class="otp-login-box">
                <h2>Verificar tu Identidad</h2>
                <p class="info-text">Introduce tu teléfono móvil para recibir un código PIN de acceso y consultar tus citas.</p>
                
                @if (errorMsg) {
                  <div class="alert alert-danger">{{ errorMsg }}</div>
                }
                @if (successMsg) {
                  <div class="alert alert-success">{{ successMsg }}</div>
                }

                <form [formGroup]="otpForm" (ngSubmit)="onVerifyOtp()">
                  <div class="form-group">
                    <label class="form-label" for="telefono">Número de Teléfono</label>
                    <input type="tel" id="telefono" formControlName="telefono" class="form-control" placeholder="Ej: 600123456" [readonly]="otpSent" />
                  </div>

                  @if (otpSent) {
                    <div class="form-group fade-in-el">
                      <label class="form-label" for="pin">Introduce el PIN de 6 dígitos</label>
                      <input type="text" id="pin" formControlName="pin" class="form-control" placeholder="Ej: 123456" />
                      <span class="resend-link" (click)="onRequestOtp()">¿No recibiste el código? Solicitar uno nuevo</span>
                    </div>
                  }

                  @if (!otpSent) {
                    <button type="button" 
                            [disabled]="!otpForm.get('telefono')?.value || sendingOtp" 
                            (click)="onRequestOtp()" 
                            class="btn btn-primary btn-block">
                      {{ sendingOtp ? 'Enviando código...' : 'Solicitar Código PIN' }}
                    </button>
                  } @else {
                    <button type="submit" 
                            [disabled]="otpForm.invalid || verifyingOtp" 
                            class="btn btn-primary btn-block">
                      {{ verifyingOtp ? 'Verificando...' : 'Acceder a mis Citas' }}
                    </button>
                  }
                </form>
              </div>
            } @else {
              <!-- Mostrar citas (si está logueado o si ya verificó el teléfono por OTP) -->
              <div class="header-with-action">
                <h2>Tus Reservas Activas</h2>
                @if (!isLoggedIn()) {
                  <button class="btn btn-secondary btn-sm" (click)="exitOtpSession()">
                    🔒 Consultar otro número / Cerrar consulta
                  </button>
                }
              </div>
              
              <div class="appointments-list">
                @for (app of appointments; track app.id) {
                  <div class="appointment-item card-border">
                    <div class="app-main-info">
                      <span class="app-service">{{ getServiceName(app.serviceItemId) }}</span>
                      <span class="app-date">📅 {{ app.fecha }} a las {{ app.horaInicio.substring(0, 5) }}</span>
                      <span class="app-worker">👤 Profesional: {{ getWorkerName(app.workerId) }}</span>
                      @if (app.clienteNombre) {
                        <span class="app-customer">👤 Cliente: {{ app.clienteNombre }}</span>
                      }
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
                    <p class="subtext">¡Completa el formulario de reserva para programar tu primera cita!</p>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Bloque de Guía Rápida al final -->
      <div class="instructions-card glass-panel fade-in-el">
        <h3>💡 ¿Cómo funciona el sistema de reservas?</h3>
        <div class="instructions-steps">
          <div class="step-col">
            <span class="step-num">1</span>
            <div>
              <strong>Para pedir una cita:</strong>
              <p>Selecciona servicio y profesional, elige fecha y hora en el calendario interactivo, introduce tus datos y confirma con el código PIN recibido.</p>
            </div>
          </div>
          <div class="step-col">
            <span class="step-num">2</span>
            <div>
              <strong>Para consultar o cancelar:</strong>
              <p>Introduce tu teléfono móvil para recibir tu PIN de acceso instantáneo. Podrás ver tus reservas futuras activas y cancelarlas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .appointments-container {
      margin-bottom: 2rem;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }
    .appointments-header {
      text-align: center;
      margin-bottom: 2rem;
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
    /* Pestañas de Navegación */
    .tabs-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      margin-bottom: 2rem;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 8px;
      overflow: hidden;
      padding: 0.25rem;
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      padding: 1rem;
      cursor: pointer;
      font-weight: 600;
      font-size: 1rem;
      border-radius: 6px;
      transition: all 0.2s ease;
    }
    .tab-btn:hover {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.03);
    }
    .tab-btn.active {
      background: var(--accent-gold);
      color: #000;
      box-shadow: 0 4px 10px rgba(212, 163, 89, 0.2);
    }
    .appointments-content-wrapper {
      margin-bottom: 2.5rem;
    }
    .instructions-card {
      margin-top: 3rem;
      padding: 1.5rem 2rem;
      border-radius: var(--border-radius-md);
      background: rgba(212, 163, 89, 0.02);
      border: 1px solid rgba(212, 163, 89, 0.08);
    }
    .instructions-card h3 {
      font-size: 1.2rem;
      color: var(--accent-gold);
      margin-bottom: 1rem;
    }
    .instructions-steps {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
    .step-col {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }
    .step-num {
      background: var(--accent-gold);
      color: #000;
      font-weight: 700;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 0.85rem;
    }
    .step-col strong {
      display: block;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
      font-size: 0.95rem;
    }
    .step-col p {
      color: var(--text-secondary);
      font-size: 0.85rem;
      margin: 0;
      line-height: 1.4;
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
    }
    .header-with-action {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
      margin-bottom: 1rem;
    }
    .header-with-action h2 {
      margin-bottom: 0;
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
    .app-date, .app-worker, .app-customer {
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
    .otp-login-box {
      max-width: 450px;
      margin: 2rem auto;
      width: 100%;
    }
    .otp-login-box h2 {
      text-align: center;
      margin-bottom: 0.5rem;
    }
    .info-text {
      color: var(--text-secondary);
      text-align: center;
      font-size: 0.95rem;
      margin-bottom: 2rem;
      line-height: 1.4;
    }
    .resend-link {
      display: inline-block;
      margin-top: 0.5rem;
      font-size: 0.8rem;
      color: var(--accent-gold);
      cursor: pointer;
      text-decoration: underline;
    }
    .btn-block {
      width: 100%;
      margin-top: 1.5rem;
    }
    @media(max-width: 992px) {
      .instructions-steps {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
    }
  `]
})
export class MisCitasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private appointmentService = inject(AppointmentService);
  private publicAppointmentService = inject(PublicAppointmentService);
  private catalogService = inject(CatalogService);
  private workerService = inject(WorkerService);
  private authService = inject(AuthService);

  isLoggedIn = this.authService.isLoggedIn;

  activeTab: 'book' | 'query' = 'book';

  appointments: AppointmentDto[] = [];
  services: ServiceItemDto[] = [];
  workers: WorkerDto[] = [];

  // OTP Login states
  phoneVerified = false;
  otpSent = false;
  sendingOtp = false;
  verifyingOtp = false;
  verifiedPhone = '';
  verifiedPin = '';
  errorMsg = '';
  successMsg = '';

  otpForm: FormGroup = this.fb.group({
    telefono: ['', [Validators.required]],
    pin: ['']
  });

  ngOnInit(): void {
    this.loadServices();
    this.loadWorkers();
    
    if (this.isLoggedIn()) {
      this.loadAppointments();
    } else {
      // Check session storage for OTP session backup
      const savedPhone = sessionStorage.getItem('otp_phone');
      const savedPin = sessionStorage.getItem('otp_pin');
      if (savedPhone && savedPin) {
        this.verifiedPhone = savedPhone;
        this.verifiedPin = savedPin;
        this.phoneVerified = true;
        this.loadPublicAppointments();
      }
    }
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

  loadPublicAppointments(): void {
    this.publicAppointmentService.getMyAppointments(this.verifiedPhone, this.verifiedPin).subscribe({
      next: (data) => {
        this.appointments = data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      },
      error: (err) => {
        this.errorMsg = err.error?.error || 'Error al recuperar citas.';
        this.exitOtpSession();
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

  onRequestOtp(): void {
    const telefono = this.otpForm.get('telefono')?.value;
    if (!telefono) {
      this.errorMsg = 'Por favor, introduce tu número de teléfono.';
      return;
    }

    this.sendingOtp = true;
    this.errorMsg = '';
    this.successMsg = '';

    this.publicAppointmentService.sendOtp(telefono).subscribe({
      next: () => {
        this.sendingOtp = false;
        this.otpSent = true;
        this.successMsg = 'PIN enviado. Búscalo en tu SMS/WhatsApp o logs de consola.';
        this.otpForm.get('pin')?.setValidators([Validators.required, Validators.minLength(6)]);
        this.otpForm.get('pin')?.updateValueAndValidity();
      },
      error: (err) => {
        this.sendingOtp = false;
        this.errorMsg = err.error?.error || 'No se pudo enviar el código PIN.';
      }
    });
  }

  onVerifyOtp(): void {
    if (this.otpForm.invalid) return;

    this.verifyingOtp = true;
    this.errorMsg = '';

    const telefono = this.otpForm.value.telefono;
    const rawPin = this.otpForm.value.pin;
    const cleanPin = rawPin ? String(rawPin).trim().replace(/\D/g, '') : '';

    this.publicAppointmentService.verifyOtp(telefono, cleanPin).subscribe({
      next: () => {
        this.verifyingOtp = false;
        this.phoneVerified = true;
        this.verifiedPhone = telefono;
        this.verifiedPin = cleanPin;
        
        // Cache OTP session
        sessionStorage.setItem('otp_phone', telefono);
        sessionStorage.setItem('otp_pin', cleanPin);

        this.loadPublicAppointments();
      },
      error: (err) => {
        this.verifyingOtp = false;
        this.errorMsg = err.error?.error || 'Código PIN incorrecto o inválido.';
      }
    });
  }

  exitOtpSession(): void {
    sessionStorage.removeItem('otp_phone');
    sessionStorage.removeItem('otp_pin');
    this.phoneVerified = false;
    this.otpSent = false;
    this.verifiedPhone = '';
    this.verifiedPin = '';
    this.otpForm.reset();
    this.appointments = [];
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
    // Redirigir a la pestaña de consulta para ver las citas reservadas
    this.activeTab = 'query';
    
    if (this.isLoggedIn()) {
      this.loadAppointments();
    } else {
      const savedPhone = sessionStorage.getItem('otp_phone');
      const savedPin = sessionStorage.getItem('otp_pin');
      if (savedPhone && savedPin) {
        this.verifiedPhone = savedPhone;
        this.verifiedPin = savedPin;
        this.phoneVerified = true;
        this.loadPublicAppointments();
      }
    }
  }

  cancelAppointment(id: string): void {
    if (confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      const cancelObs = this.isLoggedIn()
        ? this.appointmentService.cancelAppointment(id)
        : this.publicAppointmentService.cancelAppointment(id, this.verifiedPhone, this.verifiedPin);

      cancelObs.subscribe({
        next: () => {
          if (this.isLoggedIn()) {
            this.loadAppointments();
          } else {
            this.loadPublicAppointments();
          }
        },
        error: (err) => {
          alert('No se pudo cancelar la cita: ' + (err.error?.error || 'error desconocido'));
        }
      });
    }
  }
}
