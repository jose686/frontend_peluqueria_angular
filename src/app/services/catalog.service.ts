import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Category } from '../models/category.model';
import { CatalogItem, CatalogItemRequest, ServiceItemDto, ServiceItemRequest } from '../models/catalog.model';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private http = inject(HttpClient);
  private categoriesUrl = `${environment.apiUrl}/categories`;
  private catalogUrl = `${environment.apiUrl}/catalog`;
  private servicesUrl = `${environment.apiUrl}/services`;

  // --- Category Methods ---
  getCategories(type?: 'CATALOGO' | 'BLOG'): Observable<Category[]> {
    const params = type ? new HttpParams().set('type', type) : undefined;
    return this.http.get<Category[]>(this.categoriesUrl, { params });
  }

  getCategoriesByTipo(tipo: string): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.categoriesUrl}/tipo/${tipo}`);
  }

  createCategory(category: Category): Observable<Category> {
    return this.http.post<Category>(this.categoriesUrl, category);
  }

  updateCategory(id: number, category: Category): Observable<Category> {
    return this.http.put<Category>(`${this.categoriesUrl}/${id}`, category);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.categoriesUrl}/${id}`);
  }

  // --- Catalog Item Methods ---
  getCatalogItems(all = false): Observable<CatalogItem[]> {
    const params = new HttpParams().set('all', all.toString());
    return this.http.get<CatalogItem[]>(this.catalogUrl, { params });
  }

  getCatalogItemById(id: number): Observable<CatalogItem> {
    return this.http.get<CatalogItem>(`${this.catalogUrl}/${id}`);
  }

  getCatalogItemBySlug(slug: string): Observable<CatalogItem> {
    return this.http.get<CatalogItem>(`${this.catalogUrl}/slug/${slug}`);
  }

  getCatalogItemsByTipo(tipo: string): Observable<CatalogItem[]> {
    return this.http.get<CatalogItem[]>(`${this.catalogUrl}/tipo/${tipo}`);
  }

  createCatalogItem(item: CatalogItemRequest): Observable<CatalogItem> {
    return this.http.post<CatalogItem>(this.catalogUrl, item);
  }

  updateCatalogItem(id: number, item: CatalogItemRequest): Observable<CatalogItem> {
    return this.http.put<CatalogItem>(`${this.catalogUrl}/${id}`, item);
  }

  deleteCatalogItem(id: number): Observable<any> {
    return this.http.delete(`${this.catalogUrl}/${id}`);
  }

  // --- Service Item Methods (Fases de Reserva / API v1/services) ---
  getServiceItems(): Observable<ServiceItemDto[]> {
    return this.http.get<ServiceItemDto[]>(this.servicesUrl);
  }

  getServiceItemById(id: string): Observable<ServiceItemDto> {
    return this.http.get<ServiceItemDto>(`${this.servicesUrl}/${id}`);
  }

  createServiceItem(request: ServiceItemRequest): Observable<ServiceItemDto> {
    return this.http.post<ServiceItemDto>(this.servicesUrl, request);
  }

  updateServiceItem(id: string, request: ServiceItemRequest): Observable<ServiceItemDto> {
    return this.http.put<ServiceItemDto>(`${this.servicesUrl}/${id}`, request);
  }

  deleteServiceItem(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.servicesUrl}/${id}`);
  }
}
