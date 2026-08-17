import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AppointmentDto, AppointmentRequest, AvailableSlotsResponse } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/appointments`;

  getAppointments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin`);
  }

  getAppointmentById(id: string | number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createAppointment(request: AppointmentRequest | any): Observable<any> {
    return this.http.post<any>(this.apiUrl, request);
  }

  updateAppointment(id: string | number, request: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, request);
  }

  updateAppointmentStatus(id: string | number, status: string): Observable<AppointmentDto> {
    return this.http.put<AppointmentDto>(`${this.apiUrl}/${id}/status?estado=${status}`, {});
  }

  deleteAppointment(id: string | number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // --- Nuevos métodos específicos del flujo de cliente con DTOs de Spring Boot ---
  getMyAppointments(): Observable<AppointmentDto[]> {
    return this.http.get<AppointmentDto[]>(this.apiUrl);
  }

  getAvailableSlots(workerId: string, serviceItemId: string, fecha: string): Observable<AvailableSlotsResponse> {
    const params = new HttpParams()
      .set('workerId', workerId)
      .set('serviceItemId', serviceItemId)
      .set('fecha', fecha);
    return this.http.get<AvailableSlotsResponse>(`${this.apiUrl}/available`, { params });
  }

  cancelAppointment(id: string): Observable<AppointmentDto> {
    return this.http.patch<AppointmentDto>(`${this.apiUrl}/${id}/cancel`, {});
  }

  getAdminAvailability(employeeId: string, date?: string, startDate?: string, endDate?: string): Observable<any> {
    let params = new HttpParams().set('employeeId', employeeId);
    if (date) {
      params = params.set('date', date);
    }
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    return this.http.get<any>(`${environment.apiUrl}/admin/availability`, { params });
  }
}
