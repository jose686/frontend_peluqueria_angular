import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SetupService } from '../../../services/setup.service';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="auth-container fade-in-el">
      <div class="auth-card glass-panel">
        <h2>Configuración Inicial</h2>
        <p class="auth-subtitle">Crea la cuenta del primer Superadministrador del sistema.</p>

        @if (errorMessage) {
          <div class="alert alert-danger">{{ errorMessage }}</div>
        }
        @if (successMessage) {
          <div class="alert alert-success">{{ successMessage }}</div>
        }

        <form [formGroup]="setupForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="nombre">Nombre</label>
            <input 
              type="text" 
              id="nombre" 
              formControlName="nombre" 
              class="form-control" 
              placeholder="Nombre del administrador"
              required 
            />
            @if (setupForm.get('nombre')?.touched && setupForm.get('nombre')?.invalid) {
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
              placeholder="Apellidos"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Correo Electrónico</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email" 
              class="form-control" 
              placeholder="admin@aurastudio.com"
              required 
            />
            @if (setupForm.get('email')?.touched && setupForm.get('email')?.invalid) {
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
              placeholder="Mínimo 6 caracteres"
              required 
            />
            @if (setupForm.get('password')?.touched && setupForm.get('password')?.invalid) {
              <span class="error-text">La contraseña debe tener al menos 6 caracteres.</span>
            }
          </div>

          <button type="submit" [disabled]="setupForm.invalid || submitting" class="btn btn-primary btn-block">
            {{ submitting ? 'Guardando configuración...' : 'Completar Configuración Inicial' }}
          </button>
        </form>
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
      max-width: 500px;
      padding: 2.5rem;
    }
    .auth-card h2 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      text-align: center;
      color: var(--accent-gold);
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
      margin-top: 1.5rem;
    }
  `]
})
export class SetupComponent {
  private fb = inject(FormBuilder);
  private setupService = inject(SetupService);
  private router = inject(Router);

  setupForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]],
    apellidos: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submitting = false;
  errorMessage = '';
  successMessage = '';

  onSubmit(): void {
    if (this.setupForm.valid) {
      this.submitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.setupService.createInitialAdmin(this.setupForm.value).subscribe({
        next: () => {
          this.submitting = false;
          this.successMessage = '¡Configuración inicial completada! Redirigiendo...';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (err) => {
          this.submitting = false;
          this.errorMessage = err.error?.error || 'No se pudo completar la configuración. Inténtalo de nuevo.';
        }
      });
    }
  }
}
