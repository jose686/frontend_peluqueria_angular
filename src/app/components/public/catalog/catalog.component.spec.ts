import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CatalogComponent } from './catalog.component';
import { CatalogService } from '../../../services/catalog.service';

describe('CatalogComponent', () => {
  let catalogService: jasmine.SpyObj<CatalogService>;

  beforeEach(async () => {
    catalogService = jasmine.createSpyObj<CatalogService>('CatalogService', ['getCategories', 'getCatalogItems']);
    await TestBed.configureTestingModule({
      imports: [CatalogComponent],
      providers: [{ provide: CatalogService, useValue: catalogService }]
    }).compileComponents();
  });

  it('loads active catalog items during ngOnInit and renders them', () => {
    catalogService.getCategories.and.returnValue(of([{ id: 1, nombre: 'Corte', tipo: 'SERVICIO' }]));
    catalogService.getCatalogItems.and.returnValue(of([
      { id: 1, nombre: 'Corte clásico', precio: 25, tipo: 'SERVICIO', categoria: { id: 1, nombre: 'Corte', tipo: 'SERVICIO' }, activo: true },
      { id: 2, nombre: 'Oculto', precio: 10, tipo: 'PRODUCTO', categoria: { id: 1, nombre: 'Corte', tipo: 'SERVICIO' }, activo: false }
    ]));

    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();

    expect(catalogService.getCategories).toHaveBeenCalledWith('CATALOGO');
    expect(catalogService.getCatalogItems).toHaveBeenCalled();
    expect(fixture.componentInstance.catalogItems.length).toBe(1);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Corte clásico');
  });

  it('filters by type through the filter button click', () => {
    catalogService.getCategories.and.returnValue(of([]));
    catalogService.getCatalogItems.and.returnValue(of([
      { id: 1, nombre: 'Corte', precio: 25, tipo: 'SERVICIO', categoria: { id: 1, nombre: 'Corte', tipo: 'SERVICIO' }, activo: true },
      { id: 2, nombre: 'Champú', precio: 10, tipo: 'PRODUCTO', categoria: { id: 2, nombre: 'Productos', tipo: 'PRODUCTO' }, activo: true }
    ]));
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.btn-filter')[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedType).toBe('SERVICIO');
    expect(fixture.componentInstance.filteredItems.map(item => item.nombre)).toEqual(['Corte']);
  });

  it('clears catalog results when the API fails', () => {
    catalogService.getCategories.and.returnValue(of([]));
    catalogService.getCatalogItems.and.returnValue(throwError(() => new Error('network')));
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.catalogItems).toEqual([]);
  });
});
