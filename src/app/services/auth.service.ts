import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, RegisterRequest, User } from '../models/user.model';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  // Core session signals
  currentUserSignal = signal<User | null>(null);

  isLoggedIn = computed(() => this.currentUserSignal() !== null);
  isAdmin = computed(() => {
    const role = this.currentUserSignal()?.role;
    return role === 'ROLE_ADMIN' || role === 'ADMIN';
  });
  isWorker = computed(() => {
    const role = this.currentUserSignal()?.role;
    return role === 'ROLE_WORKER' || role === 'WORKER';
  });

  constructor() {
    this.loadSession();
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(res => {
        localStorage.setItem('auth_token', res.token);
        let normalizedRole = res.role;
        if (normalizedRole === 'ADMIN') normalizedRole = 'ROLE_ADMIN';
        if (normalizedRole === 'CLIENT') normalizedRole = 'ROLE_CLIENTE';
        if (normalizedRole === 'WORKER') normalizedRole = 'ROLE_WORKER';

        const user: User = {
          id: res.id,
          email: res.email,
          nombre: res.email.split('@')[0], // Initial name placeholder
          role: normalizedRole
        };
        localStorage.setItem('auth_user', JSON.stringify(user));
        this.currentUserSignal.set(user);
      })
    );
  }

  register(request: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, request);
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.currentUserSignal.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private loadSession(): void {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        if (user.role === 'ADMIN') user.role = 'ROLE_ADMIN';
        if (user.role === 'CLIENT') user.role = 'ROLE_CLIENTE';
        if (user.role === 'WORKER') user.role = 'ROLE_WORKER';
        this.currentUserSignal.set(user);
      } catch (e) {
        this.logout();
      }
    }
  }
}
