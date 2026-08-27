import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CatalogService } from './catalog.service';
import { environment } from '../../environments/environment';

describe('CatalogService', () => {
  let service: CatalogService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CatalogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requests catalog categories by type', () => {
    service.getCategories('CATALOGO').subscribe(categories => expect(categories.length).toBe(1));

    const request = httpMock.expectOne(`${environment.apiUrl}/categories?type=CATALOGO`);
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 1, nombre: 'Corte', tipo: 'SERVICIO' }]);
  });

  it('sends a catalog item update to its resource URL', () => {
    const item = { nombre: 'Corte', precio: 25, tipo: 'SERVICIO', categoriaId: 1 };
    service.updateCatalogItem(8, item).subscribe();

    const request = httpMock.expectOne(`${environment.apiUrl}/catalog/8`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(item);
    request.flush({ id: 8, ...item, categoria: { id: 1, nombre: 'Corte' }, activo: true });
  });
});
