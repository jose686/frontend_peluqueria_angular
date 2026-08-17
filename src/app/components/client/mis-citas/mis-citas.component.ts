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
        <p>Consulta el estado de tus reservas y solicita nuevas citas online.</p>
      </div>

      <div class="appointments-grid">
        <!-- List of existing appointments -->
        <div class="appointments-list-section glass-panel">
          
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
              <h2>Tus Reservas</h2>
              @if (!isLoggedIn()) {
                <button class="btn btn-secondary btn-sm" (click)="exitOtpSession()">
                  🔒 Salir (Tel: {{ verifiedPhone }})
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
                  <p class="subtext">¡Completa el formulario de la derecha para programar tu primera cita!</p>
                </div>
              }
            </div>
          }
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
      .appointments-grid {
        grid-template-columns: 1fr;
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
    const pin = this.otpForm.value.pin;

    this.publicAppointmentService.verifyOtp(telefono, pin).subscribe({
      next: () => {
        this.verifyingOtp = false;
        this.phoneVerified = true;
        this.verifiedPhone = telefono;
        this.verifiedPin = pin;
        
        // Cache OTP session
        sessionStorage.setItem('otp_phone', telefono);
        sessionStorage.setItem('otp_pin', pin);

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
    if (this.isLoggedIn()) {
      this.loadAppointments();
    } else if (this.phoneVerified) {
      this.loadPublicAppointments();
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
