import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ShiftDto, ShiftRequestDto } from '../models/worker-schedule.model';

@Injectable({
  providedIn: 'root'
})
export class WorkerScheduleService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/shifts`;

  getShiftsByWorker(workerId: string): Observable<ShiftDto[]> {
    return this.http.get<ShiftDto[]>(`${this.apiUrl}/worker/${workerId}`);
  }

  saveShift(workerId: string, request: ShiftRequestDto): Observable<ShiftDto> {
    return this.http.post<ShiftDto>(`${this.apiUrl}/worker/${workerId}`, request);
  }

  getShiftsByWeek(startDate: string): Observable<ShiftDto[]> {
    return this.http.get<ShiftDto[]>(`${this.apiUrl}/week?startDate=${startDate}`);
  }

  deleteShift(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  copyWeek(fromStart: string, toStart: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/copy-week?fromStart=${fromStart}&toStart=${toStart}`, {});
  }

  copyWorkerShifts(fromWorkerId: string, toWorkerId: string, startDate: string, endDate: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/copy-worker-shifts?fromWorkerId=${fromWorkerId}&toWorkerId=${toWorkerId}&startDate=${startDate}&endDate=${endDate}`, {});
  }
}
