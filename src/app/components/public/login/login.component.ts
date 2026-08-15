import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container fade-in-el">
      <div class="auth-card glass-panel">
        <h2>Iniciar Sesión</h2>
        <p class="auth-subtitle">Accede a tu cuenta de peluquería.</p>

        <div class="auth-tabs">
          <button type="button" class="tab-btn" [class.active]="loginMode === 'standard'" (click)="setLoginMode('standard')">Clientes / Admin</button>
          <button type="button" class="tab-btn" [class.active]="loginMode === 'worker'" (click)="setLoginMode('worker')">Trabajadores</button>
        </div>

        @if (errorMessage) {
          <div class="alert alert-danger">{{ errorMessage }}</div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          @if (loginMode === 'standard') {
            <div class="form-group">
              <label class="form-label" for="email">Correo Electrónico</label>
              <input 
                type="email" 
                id="email" 
                formControlName="email" 
                class="form-control" 
                placeholder="ejemplo@correo.com"
                required 
              />
              @if (loginForm.get('email')?.touched && loginForm.get('email')?.invalid) {
                <span class="error-text">Introduce un correo electrónico válido.</span>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="password">Contraseña</label>
              <input 
                type="password" 
                id="password" 
                formControlName="password" 
                class="form-control" 
                placeholder="••••••••"
                required 
              />
              @if (loginForm.get('password')?.touched && loginForm.get('password')?.invalid) {
                <span class="error-text">La contraseña es obligatoria.</span>
              }
            </div>
          } @else {
            <div class="form-group">
              <label class="form-label" for="dni">DNI / Identificación</label>
              <input 
                type="text" 
                id="dni" 
                formControlName="dni" 
                class="form-control" 
                placeholder="Ej. 12345678Z"
                required 
              />
              @if (loginForm.get('dni')?.touched && loginForm.get('dni')?.invalid) {
                <span class="error-text">Introduce un DNI válido (8 números y letra).</span>
              }
            </div>
          }

          <button type="submit" [disabled]="loginForm.invalid || submitting" class="btn btn-primary btn-block">
            {{ submitting ? 'Accediendo...' : 'Entrar' }}
          </button>
        </form>

        @if (loginMode === 'standard') {
          <p class="auth-footer">
            ¿No tienes una cuenta? <a routerLink="/register">Regístrate aquí</a>
          </p>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem 0;
    }
    .auth-card {
      width: 100%;
      max-width: 450px;
      padding: 2.5rem;
    }
    .auth-card h2 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      text-align: center;
    }
    .auth-subtitle {
      color: var(--text-secondary);
      text-align: center;
      font-size: 0.95rem;
      margin-bottom: 1.5rem;
    }
    .auth-tabs {
      display: flex;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }
    .tab-btn {
      flex: 1;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      padding: 0.75rem;
      color: var(--text-secondary);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .tab-btn.active {
      color: var(--accent-gold);
      border-bottom-color: var(--accent-gold);
    }
    .alert {
      padding: 0.75rem 1rem;
      border-radius: var(--border-radius-sm);
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
    }
    .alert-danger {
      background: rgba(220, 38, 38, 0.15);
      color: #f87171;
      border: 1px solid rgba(220, 38, 38, 0.2);
    }
    .error-text {
      color: #f87171;
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }
    .btn-block {
      width: 100%;
      margin-top: 1rem;
    }
    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    .auth-footer a {
      color: var(--accent-gold);
      text-decoration: none;
      font-weight: 600;
    }
    .auth-footer a:hover {
      color: var(--accent-gold-hover);
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginMode: 'standard' | 'worker' = 'standard';

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    dni: ['']
  });

  submitting = false;
  errorMessage = '';

  setLoginMode(mode: 'standard' | 'worker'): void {
    this.loginMode = mode;
    this.errorMessage = '';
    if (mode === 'worker') {
      this.loginForm.get('email')?.clearValidators();
      this.loginForm.get('email')?.updateValueAndValidity();
      this.loginForm.get('password')?.clearValidators();
      this.loginForm.get('password')?.updateValueAndValidity();
      this.loginForm.get('dni')?.setValidators([Validators.required, Validators.pattern(/^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i)]);
      this.loginForm.get('dni')?.updateValueAndValidity();
    } else {
      this.loginForm.get('email')?.setValidators([Validators.required, Validators.email]);
      this.loginForm.get('email')?.updateValueAndValidity();
      this.loginForm.get('password')?.setValidators([Validators.required]);
      this.loginForm.get('password')?.updateValueAndValidity();
      this.loginForm.get('dni')?.clearValidators();
      this.loginForm.get('dni')?.updateValueAndValidity();
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.submitting = true;
      this.errorMessage = '';

      const credentials = this.loginMode === 'worker' 
        ? { email: this.loginForm.value.dni.toUpperCase(), password: this.loginForm.value.dni.toUpperCase() }
        : { email: this.loginForm.value.email, password: this.loginForm.value.password };

      this.authService.login(credentials).subscribe({
        next: (res) => {
          this.submitting = false;
          // Determine the user's role (checking either localized or raw response role)
          const role = res.role;
          if (role === 'ROLE_ADMIN' || role === 'ADMIN' || role === 'ROLE_WORKER' || role === 'WORKER') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/mis-citas']);
          }
        },
        error: (err) => {
          this.submitting = false;
          this.errorMessage = err.error?.error || 'Error al iniciar sesión. Comprueba tus credenciales.';
        }
      });
    }
  }
}
