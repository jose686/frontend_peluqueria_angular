import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BlogCategoryService } from './blog-category.service';
import { environment } from '../../environments/environment';

describe('BlogCategoryService', () => {
  let service: BlogCategoryService; let http: HttpTestingController; const url = `${environment.apiUrl}/blog/categories`;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }); service = TestBed.inject(BlogCategoryService); http = TestBed.inject(HttpTestingController); }); afterEach(() => http.verify());
  it('performs CRUD requests with category names', () => {
    service.list().subscribe(); service.create('Consejos').subscribe(); service.update(2, 'Noticias').subscribe(); service.delete(2).subscribe();
    http.expectOne(req => req.url === url && req.method === 'GET').flush([]); const create = http.expectOne(req => req.url === url && req.method === 'POST'); expect(create.request.body).toEqual({ nombre: 'Consejos' }); create.flush({}); const update = http.expectOne(req => req.url === `${url}/2` && req.method === 'PUT'); update.flush({}); const remove = http.expectOne(req => req.url === `${url}/2` && req.method === 'DELETE'); remove.flush({});
  });
});
