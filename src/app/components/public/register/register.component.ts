import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container fade-in-el">
      <div class="auth-card glass-panel">
        <h2>Crear Cuenta</h2>
        <p class="auth-subtitle">Regístrate para reservar citas online de forma rápida.</p>

        @if (errorMessage) {
          <div class="alert alert-danger">{{ errorMessage }}</div>
        }
        @if (successMessage) {
          <div class="alert alert-success">{{ successMessage }}</div>
        }

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="nombre">Nombre *</label>
            <input 
              type="text" 
              id="nombre" 
              formControlName="nombre" 
              class="form-control" 
              placeholder="Tu nombre"
              required 
            />
            @if (registerForm.get('nombre')?.touched && registerForm.get('nombre')?.invalid) {
              <span class="error-text">El nombre es obligatorio.</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="apellidos">Apellidos</label>
            <input 
              type="text" 
              id="apellidos" 
              formControlName="apellidos" 
              class="form-control" 
              placeholder="Tus apellidos" 
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="telefono">Teléfono</label>
            <input 
              type="tel" 
              id="telefono" 
              formControlName="telefono" 
              class="form-control" 
              placeholder="600 000 000" 
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Correo Electrónico *</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email" 
              class="form-control" 
              placeholder="ejemplo@correo.com"
              required 
            />
            @if (registerForm.get('email')?.touched && registerForm.get('email')?.invalid) {
              <span class="error-text">Introduce un correo electrónico válido.</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Contraseña *</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password" 
              class="form-control" 
              placeholder="Mínimo 6 caracteres"
              required 
            />
            @if (registerForm.get('password')?.touched && registerForm.get('password')?.invalid) {
              <span class="error-text">La contraseña debe tener al menos 6 caracteres.</span>
            }
          </div>

          <button type="submit" [disabled]="registerForm.invalid || submitting" class="btn btn-primary btn-block">
            {{ submitting ? 'Registrando...' : 'Registrarse' }}
          </button>
        </form>

        <p class="auth-footer">
          ¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión</a>
        </p>
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
      max-width: 480px;
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
      margin-bottom: 2rem;
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
    .alert-success {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.2);
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
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]],
    apellidos: [''],
    telefono: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submitting = false;
  errorMessage = '';
  successMessage = '';

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.submitting = true;
      this.errorMessage = '';
      this.successMessage = '';
      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.submitting = false;
          this.successMessage = 'Cuenta creada con éxito. Redirigiendo al login...';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (err) => {
          this.submitting = false;
          this.errorMessage = err.error?.error || 'Error al registrar la cuenta. Inténtalo de nuevo.';
        }
      });
    }
  }
}
