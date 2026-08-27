import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AppointmentBookingComponent } from './appointment-booking.component';
import { CatalogService } from '../../../services/catalog.service';
import { WorkerService } from '../../../services/worker.service';
import { AppointmentService } from '../../../services/appointment.service';
import { PublicAppointmentService } from '../../../services/public-appointment.service';
import { AuthService } from '../../../services/auth.service';

describe('AppointmentBookingComponent', () => {
  let catalogService: jasmine.SpyObj<CatalogService>;
  let workerService: jasmine.SpyObj<WorkerService>;
  let appointmentService: jasmine.SpyObj<AppointmentService>;
  let publicAppointmentService: jasmine.SpyObj<PublicAppointmentService>;
  const isLoggedIn = signal(false);

  beforeEach(async () => {
    catalogService = jasmine.createSpyObj<CatalogService>('CatalogService', ['getServiceItems']);
    workerService = jasmine.createSpyObj<WorkerService>('WorkerService', ['getAll']);
    appointmentService = jasmine.createSpyObj<AppointmentService>('AppointmentService', ['getAvailableSlots', 'createAppointment']);
    publicAppointmentService = jasmine.createSpyObj<PublicAppointmentService>('PublicAppointmentService', ['getAvailableSlots', 'getAvailableDaysRange', 'sendOtp', 'bookAppointment']);
    catalogService.getServiceItems.and.returnValue(of([{ id: 'service-1', nombre: 'Corte', precio: 25, duracionMinutos: 30 }]));
    workerService.getAll.and.returnValue(of([{ id: 'worker-1', nombre: 'Ana' }] as any));

    await TestBed.configureTestingModule({
      imports: [AppointmentBookingComponent],
      providers: [
        provideRouter([]),
        { provide: CatalogService, useValue: catalogService },
        { provide: WorkerService, useValue: workerService },
        { provide: AppointmentService, useValue: appointmentService },
        { provide: PublicAppointmentService, useValue: publicAppointmentService },
        { provide: AuthService, useValue: { isLoggedIn } }
      ]
    }).compileComponents();
  });

  it('initializes, loads services and requires guest details', () => {
    isLoggedIn.set(false);
    const fixture = TestBed.createComponent(AppointmentBookingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component).toBeTruthy();
    expect(catalogService.getServiceItems).toHaveBeenCalled();
    expect(component.services[0].nombre).toBe('Corte');
    expect(component.bookingForm.get('nombre')?.hasError('required')).toBeTrue();
  });

  it('loads workers when a service is selected', () => {
    isLoggedIn.set(false);
    const fixture = TestBed.createComponent(AppointmentBookingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.bookingForm.patchValue({ serviceItemId: 'service-1', workerId: 'old-worker', fecha: '2026-08-25', horaInicio: '10:00' });

    component.onServiceChange();

    expect(workerService.getAll).toHaveBeenCalled();
    expect(component.workers.length).toBe(1);
    expect(component.bookingForm.get('workerId')?.value).toBe('');
  });

  it('updates the selected slot when a user clicks one', () => {
    isLoggedIn.set(false);
    const fixture = TestBed.createComponent(AppointmentBookingComponent);
    fixture.detectChanges();

    fixture.componentInstance.selectSlot('11:00:00');

    expect(fixture.componentInstance.bookingForm.get('horaInicio')?.value).toBe('11:00:00');
  });

  it('loads a guest calendar and its available slots for the selected date', () => {
    isLoggedIn.set(false);
    publicAppointmentService.getAvailableDaysRange.and.returnValue(of({ '2026-08-25': true }));
    publicAppointmentService.getAvailableSlots.and.returnValue(of({ horasDisponibles: ['10:00:00', '11:00:00'] }));
    const fixture = TestBed.createComponent(AppointmentBookingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.bookingForm.patchValue({ serviceItemId: 'service-1', workerId: 'worker-1' });

    component.generateCalendar();
    component.selectDate('2026-08-25');

    expect(publicAppointmentService.getAvailableDaysRange).toHaveBeenCalled();
    expect(publicAppointmentService.getAvailableSlots).toHaveBeenCalledWith('worker-1', 'service-1', '2026-08-25');
    expect(component.availableSlots).toEqual(['10:00:00', '11:00:00']);
  });

  it('sends an OTP for a guest and records the successful state', () => {
    isLoggedIn.set(false);
    publicAppointmentService.sendOtp.and.returnValue(of({}));
    const fixture = TestBed.createComponent(AppointmentBookingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.bookingForm.patchValue({ telefono: '600123456' });

    component.sendOtpCode();

    expect(publicAppointmentService.sendOtp).toHaveBeenCalledWith('600123456');
    expect(component.otpSent).toBeTrue();
    expect(component.successMessage).toContain('enviado');
  });

  it('creates a guest booking, sanitizes the PIN and emits success', () => {
    isLoggedIn.set(false);
    publicAppointmentService.bookAppointment.and.returnValue(of({} as any));
    const fixture = TestBed.createComponent(AppointmentBookingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    spyOn(component.bookingSuccess, 'emit');
    component.bookingForm.patchValue({ serviceItemId: 'service-1', workerId: 'worker-1', fecha: '2026-08-25', horaInicio: '10:00', nombre: 'Ana', telefono: '600123456', pin: ' 12-34 56 ' });

    component.onSubmit();

    expect(publicAppointmentService.bookAppointment).toHaveBeenCalledWith(jasmine.objectContaining({ pin: '123456', nombre: 'Ana' }));
    expect(sessionStorage.getItem('otp_phone')).toBe('600123456');
    expect(component.bookingSuccess.emit).toHaveBeenCalled();
  });

  it('resets booking state and restores guest validators', () => {
    isLoggedIn.set(false);
    const fixture = TestBed.createComponent(AppointmentBookingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.bookingForm.patchValue({ serviceItemId: 'service-1', nombre: 'Ana' });
    component.otpSent = true;
    component.availableSlots = ['10:00'];

    component.resetForm();

    expect(component.bookingForm.get('serviceItemId')?.value).toBeNull();
    expect(component.otpSent).toBeFalse();
    expect(component.availableSlots).toEqual([]);
    expect(component.bookingForm.get('nombre')?.hasError('required')).toBeTrue();
  });

  it('runs the guided tour and restores the form when it ends', () => {
    isLoggedIn.set(false);
    const fixture = TestBed.createComponent(AppointmentBookingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.bookingForm.patchValue({ serviceItemId: 'saved-service' });

    component.startTour();
    expect(component.tourActive).toBeTrue();
    expect(component.getCurrentStep()).toBe(1);
    component.nextTourStep();
    component.nextTourStep();
    component.prevTourStep();
    expect(component.tourStep).toBe(2);
    component.endTour();

    expect(component.tourActive).toBeFalse();
    expect(component.bookingForm.get('serviceItemId')?.value).toBe('saved-service');
  });

  it('reports loading errors for services, slots and OTP requests', () => {
    isLoggedIn.set(false);
    catalogService.getServiceItems.and.returnValue(throwError(() => new Error('offline')));
    publicAppointmentService.sendOtp.and.returnValue(throwError(() => ({ error: { error: 'OTP fallido' } })));
    publicAppointmentService.getAvailableSlots.and.returnValue(throwError(() => new Error('slots')));
    const fixture = TestBed.createComponent(AppointmentBookingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.errorMessage).toContain('servicios');

    component.bookingForm.patchValue({ telefono: '600123456', serviceItemId: 'service-1', workerId: 'worker-1' });
    component.sendOtpCode();
    expect(component.errorMessage).toBe('OTP fallido');
    component.loadSlotsForDate('2026-08-25');
    expect(component.errorMessage).toContain('horas disponibles');
    expect(component.loadingSlots).toBeFalse();
  });

  it('uses authenticated endpoints and creates an appointment for a logged-in user', () => {
    isLoggedIn.set(true);
    appointmentService.getAvailableSlots.and.returnValue(of({ horasDisponibles: ['09:00:00'] }));
    appointmentService.createAppointment.and.returnValue(of({}));
    const fixture = TestBed.createComponent(AppointmentBookingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    spyOn(component.bookingSuccess, 'emit');
    component.bookingForm.patchValue({ serviceItemId: 'service-1', workerId: 'worker-1', fecha: '2026-08-25', horaInicio: '09:00:00' });

    component.loadSlotsForDate('2026-08-25');
    component.onSubmit();

    expect(appointmentService.getAvailableSlots).toHaveBeenCalledWith('worker-1', 'service-1', '2026-08-25');
    expect(appointmentService.createAppointment).toHaveBeenCalledWith({ workerId: 'worker-1', serviceItemId: 'service-1', fecha: '2026-08-25', horaInicio: '09:00:00' });
    expect(component.bookingSuccess.emit).toHaveBeenCalled();
  });

  it('resets date state while navigating calendar months and loading a worker calendar', () => {
    isLoggedIn.set(false);
    publicAppointmentService.getAvailableDaysRange.and.returnValue(of({}));
    const fixture = TestBed.createComponent(AppointmentBookingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.bookingForm.patchValue({ serviceItemId: 'service-1', workerId: 'worker-1', fecha: '2026-08-25', horaInicio: '10:00' });

    component.onWorkerChange();
    component.changeMonth(1);

    expect(component.bookingForm.get('fecha')?.value).toBe('');
    expect(component.availableSlots).toEqual([]);
    expect(component.calendarDays.length).toBeGreaterThan(0);
    expect(component.getMonthYearLabel()).toBeTruthy();
  });

  it('keeps errors visible when authenticated booking is rejected', () => {
    isLoggedIn.set(true);
    appointmentService.createAppointment.and.returnValue(throwError(() => ({ error: { error: 'Horario ocupado' } })));
    const fixture = TestBed.createComponent(AppointmentBookingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.bookingForm.patchValue({ serviceItemId: 'service-1', workerId: 'worker-1', fecha: '2026-08-25', horaInicio: '09:00' });

    component.onSubmit();

    expect(component.submitting).toBeFalse();
    expect(component.errorMessage).toBe('Horario ocupado');
  });

  it('derives each booking step and validates an empty phone before requesting OTP', () => {
    isLoggedIn.set(false);
    const fixture = TestBed.createComponent(AppointmentBookingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.getCurrentStep()).toBe(1);
    component.bookingForm.patchValue({ serviceItemId: 'service-1' });
    expect(component.getCurrentStep()).toBe(2);
    component.bookingForm.patchValue({ workerId: 'worker-1' });
    expect(component.getCurrentStep()).toBe(3);
    component.bookingForm.patchValue({ fecha: '2026-08-25', horaInicio: '10:00' });
    expect(component.getCurrentStep()).toBe(4);
    component.bookingForm.patchValue({ telefono: '' });
    component.sendOtpCode();
    expect(component.errorMessage).toContain('teléfono');
  });
});
