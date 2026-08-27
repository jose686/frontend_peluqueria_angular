import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AppointmentService } from './appointment.service';
import { environment } from '../../environments/environment';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AppointmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('queries available slots with all selection parameters', () => {
    service.getAvailableSlots('worker-1', 'service-1', '2026-08-25').subscribe();

    const request = httpMock.expectOne(req => req.url === `${environment.apiUrl}/appointments/available`);
    expect(request.request.params.get('workerId')).toBe('worker-1');
    expect(request.request.params.get('serviceItemId')).toBe('service-1');
    expect(request.request.params.get('fecha')).toBe('2026-08-25');
    request.flush({ horasDisponibles: ['10:00:00'] });
  });

  it('exposes unauthorized errors when creating an appointment', () => {
    let receivedStatus: number | undefined;
    const payload = { workerId: 'worker-1', serviceItemId: 'service-1', fecha: '2026-08-25', horaInicio: '10:00' };
    service.createAppointment(payload).subscribe({ error: error => receivedStatus = error.status });

    const request = httpMock.expectOne(`${environment.apiUrl}/appointments`);
    expect(request.request.method).toBe('POST');
    request.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(receivedStatus).toBe(401);
  });
});
