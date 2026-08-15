import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/users';

  getEmployees(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/employees`);
  }

  getClients(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/clientes`);
  }
}
