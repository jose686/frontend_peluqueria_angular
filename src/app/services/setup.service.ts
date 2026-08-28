import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';

interface SetupStatusResponse {
  setupRequired: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SetupService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/setup`;

  private setupRequiredCached: boolean | null = null;

  getSetupStatus(): Observable<SetupStatusResponse> {
    if (this.setupRequiredCached === false) {
      return of({ setupRequired: false });
    }
    return this.http.get<SetupStatusResponse>(`${this.apiUrl}/status`).pipe(
      tap(res => {
        this.setupRequiredCached = res.setupRequired;
      })
    );
  }

  createInitialAdmin(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin`, data).pipe(
      tap(() => {
        this.setupRequiredCached = false;
      })
    );
  }
}
