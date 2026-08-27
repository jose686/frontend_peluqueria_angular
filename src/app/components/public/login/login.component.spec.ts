import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../services/auth.service';

describe('LoginComponent', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['login']);
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }]
    }).compileComponents();
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('creates and keeps the standard form invalid until email and password are valid', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component).toBeTruthy();
    expect(component.loginForm.invalid).toBeTrue();
    component.loginForm.patchValue({ email: 'not-an-email', password: 'secret' });
    expect(component.loginForm.invalid).toBeTrue();
    component.loginForm.patchValue({ email: 'cliente@aura.test' });
    expect(component.loginForm.valid).toBeTrue();
  });

  it('changes to worker validation when the worker tab is clicked', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.tab-btn')[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.loginMode).toBe('worker');
    expect(fixture.componentInstance.loginForm.invalid).toBeTrue();
    fixture.componentInstance.loginForm.patchValue({ dni: '12345678Z' });
    expect(fixture.componentInstance.loginForm.valid).toBeTrue();
  });

  it('submits valid credentials and navigates a client to their appointments', () => {
    authService.login.and.returnValue(of({ token: 'jwt', type: 'Bearer', id: '1', email: 'cliente@aura.test', role: 'CLIENT' }));
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.loginForm.setValue({ email: 'cliente@aura.test', password: 'secret', dni: '' });

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith({ email: 'cliente@aura.test', password: 'secret' });
    expect(router.navigate).toHaveBeenCalledWith(['/mis-citas']);
  });

  it('shows the API error after a failed login', () => {
    authService.login.and.returnValue(throwError(() => ({ error: { error: 'Credenciales inválidas' } })));
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.loginForm.setValue({ email: 'cliente@aura.test', password: 'bad', dni: '' });

    component.onSubmit();

    expect(component.errorMessage).toBe('Credenciales inválidas');
    expect(component.submitting).toBeFalse();
  });
});
