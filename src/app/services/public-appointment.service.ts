import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AppointmentDto, AvailableSlotsResponse, PublicBookRequest } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class PublicAppointmentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl.replace('/v1', '/public')}/appointments`; // Apunta a /api/public/appointments

  getAvailableSlots(workerId: string, serviceItemId: string, fecha: string): Observable<AvailableSlotsResponse> {
    const params = new HttpParams()
      .set('workerId', workerId)
      .set('serviceItemId', serviceItemId)
      .set('fecha', fecha);
    return this.http.get<AvailableSlotsResponse>(`${this.apiUrl}/slots`, { params });
  }

  getAvailableDaysRange(workerId: string, serviceItemId: string, startDate: string, endDate: string): Observable<{[key: string]: boolean}> {
    const params = new HttpParams()
      .set('workerId', workerId)
      .set('serviceItemId', serviceItemId)
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<{[key: string]: boolean}>(`${this.apiUrl}/slots/range`, { params });
  }

  sendOtp(telefono: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/otp/send`, { telefono });
  }

  verifyOtp(telefono: string, pin: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/otp/verify`, { telefono, pin });
  }

  bookAppointment(request: PublicBookRequest): Observable<AppointmentDto> {
    return this.http.post<AppointmentDto>(`${this.apiUrl}/book`, request);
  }

  getMyAppointments(telefono: string, pin: string): Observable<AppointmentDto[]> {
    return this.http.post<AppointmentDto[]>(`${this.apiUrl}/my-appointments`, { telefono, pin });
  }

  cancelAppointment(id: string, telefono: string, pin: string): Observable<AppointmentDto> {
    return this.http.put<AppointmentDto>(`${this.apiUrl}/cancel/${id}`, { telefono, pin });
  }
}
