import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { jwtInterceptor } from '../interceptors/jwt.interceptor';
import { CatalogService } from './catalog.service';
import { environment } from '../../environments/environment';

describe('AuthService and JWT interceptor', () => {
  let authService: AuthService;
  let catalogService: CatalogService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([jwtInterceptor])), provideHttpClientTesting()]
    });
    authService = TestBed.inject(AuthService);
    catalogService = TestBed.inject(CatalogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('persists and normalizes the authenticated user after login', () => {
    authService.login({ email: 'admin@aura.test', password: 'secret' }).subscribe();

    const request = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({ token: 'jwt-token', type: 'Bearer', id: '1', email: 'admin@aura.test', role: 'ADMIN' });

    expect(authService.getToken()).toBe('jwt-token');
    expect(authService.isLoggedIn()).toBeTrue();
    expect(authService.currentUserSignal()?.role).toBe('ROLE_ADMIN');
  });

  it('adds a Bearer token to authenticated API requests', () => {
    localStorage.setItem('auth_token', 'token-123');
    catalogService.getCatalogItems().subscribe();

    const request = httpMock.expectOne(req => req.url === `${environment.apiUrl}/catalog`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-123');
    expect(request.request.params.get('all')).toBe('false');
    request.flush([]);
  });
});
