import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WorkerService } from './worker.service';
import { environment } from '../../environments/environment';

describe('WorkerService', () => {
  let service: WorkerService; let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }); service = TestBed.inject(WorkerService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('uses the worker collection for listing and creation', () => {
    service.getAll().subscribe(); service.create({ nombre: 'Ana', email: 'ana@test.es' } as any).subscribe();
    const list = http.expectOne(req => req.url === `${environment.apiUrl}/workers` && req.method === 'GET'); list.flush([]);
    const create = http.expectOne(req => req.url === `${environment.apiUrl}/workers` && req.method === 'POST'); expect(create.request.body.nombre).toBe('Ana'); create.flush({ id: '1' });
  });
  it('targets worker resources for update, deletion and registration', () => {
    service.update('w1', { nombre: 'Ana' } as any).subscribe(); service.delete('w1').subscribe(); service.registerWorker({} as any).subscribe();
    const update = http.expectOne(req => req.url === `${environment.apiUrl}/workers/w1` && req.method === 'PUT'); update.flush({});
    const remove = http.expectOne(req => req.url === `${environment.apiUrl}/workers/w1` && req.method === 'DELETE'); remove.flush({});
    const register = http.expectOne(`${environment.apiUrl}/admin/workers`); expect(register.request.method).toBe('POST'); register.flush({});
  });
});
