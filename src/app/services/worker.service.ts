import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { WorkerDto, WorkerRequest, RegisterWorkerDto } from '../models/worker.model';

@Injectable({
  providedIn: 'root'
})
export class WorkerService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/workers`;

  getAll(): Observable<WorkerDto[]> {
    return this.http.get<WorkerDto[]>(this.apiUrl);
  }

  getById(id: string): Observable<WorkerDto> {
    return this.http.get<WorkerDto>(`${this.apiUrl}/${id}`);
  }

  create(request: WorkerRequest): Observable<WorkerDto> {
    return this.http.post<WorkerDto>(this.apiUrl, request);
  }

  registerWorker(request: RegisterWorkerDto): Observable<WorkerDto> {
    return this.http.post<WorkerDto>(`${environment.apiUrl}/admin/workers`, request);
  }

  update(id: string, request: WorkerRequest): Observable<WorkerDto> {
    return this.http.put<WorkerDto>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
