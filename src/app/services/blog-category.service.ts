import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from '../models/category.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BlogCategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/blog/categories`;

  list(): Observable<Category[]> { return this.http.get<Category[]>(this.apiUrl); }
  create(nombre: string): Observable<Category> { return this.http.post<Category>(this.apiUrl, { nombre }); }
  update(id: number, nombre: string): Observable<Category> { return this.http.put<Category>(`${this.apiUrl}/${id}`, { nombre }); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
}
