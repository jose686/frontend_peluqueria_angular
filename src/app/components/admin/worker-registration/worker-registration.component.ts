import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WorkerService } from '../../../services/worker.service';
import { RegisterWorkerDto } from '../../../models/worker.model';

@Component({
  selector: 'app-worker-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="registration-container glass-panel fade-in-el">
      <h2>Registrar Nuevo Trabajador</h2>
      <p class="subtitle">Agrega profesionales al equipo y genera automáticamente sus credenciales de acceso.</p>

      @if (successMessage) {
        <div class="alert alert-success">{{ successMessage }}</div>
      }
      @if (errorMessage) {
        <div class="alert alert-danger">{{ errorMessage }}</div>
      }

      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label class="form-label" for="dni">DNI / Identificación *</label>
          <input 
            type="text" 
            id="dni" 
            formControlName="dni" 
            class="form-control" 
            placeholder="Ej. 12345678Z" 
            required 
          />
          @if (registerForm.get('dni')?.touched && registerForm.get('dni')?.errors) {
            <span class="error-text">
              @if (registerForm.get('dni')?.errors?.['required']) { El DNI es obligatorio. }
              @if (registerForm.get('dni')?.errors?.['pattern']) { Formato de DNI inválido. }
            </span>
          }
        </div>

        <div class="form-group">
          <label class="form-label" for="nombre">Nombre Completo *</label>
          <input 
            type="text" 
            id="nombre" 
            formControlName="nombre" 
            class="form-control" 
            placeholder="Ej. Juan Pérez" 
            required 
          />
          @if (registerForm.get('nombre')?.touched && registerForm.get('nombre')?.errors?.['required']) {
            <span class="error-text">El nombre es obligatorio.</span>
          }
        </div>

        <div class="form-group">
          <label class="form-label" for="especialidad">Especialidad</label>
          <input 
            type="text" 
            id="especialidad" 
            formControlName="especialidad" 
            class="form-control" 
            placeholder="Ej. Colorista, Estilista de Caballeros..." 
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Contraseña *</label>
          <input 
            type="password" 
            id="password" 
            formControlName="password" 
            class="form-control" 
            placeholder="Contraseña de acceso del trabajador" 
            required 
          />
          @if (registerForm.get('password')?.touched && registerForm.get('password')?.errors?.['required']) {
            <span class="error-text">La contraseña es obligatoria.</span>
          }
        </div>


        <button type="submit" [disabled]="registerForm.invalid || submitting" class="btn btn-primary btn-block">
          {{ submitting ? 'Registrando...' : 'Registrar Trabajador' }}
        </button>
      </form>
    </div>
  `,
  styles: [`
    .registration-container {
      max-width: 550px;
      margin: 2rem auto;
      padding: 2.5rem;
      border-radius: var(--border-radius-md);
    }
    .registration-container h2 {
      font-size: 1.8rem;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }
    .subtitle {
      color: var(--text-secondary);
      font-size: 0.95rem;
      margin-bottom: 2rem;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    .error-text {
      color: #f87171;
      font-size: 0.8rem;
      margin-top: 0.25rem;
      display: block;
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
    .btn-block {
      width: 100%;
      margin-top: 1.5rem;
    }
  `]
})
export class WorkerRegistrationComponent {
  private fb = inject(FormBuilder);
  private workerService = inject(WorkerService);

  registerForm: FormGroup = this.fb.group({
    dni: ['', [Validators.required, Validators.pattern(/^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i)]],
    nombre: ['', [Validators.required]],
    especialidad: [''],
    password: ['', [Validators.required]]
  });

  submitting = false;
  successMessage = '';
  errorMessage = '';

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.submitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      const request: RegisterWorkerDto = {
        dni: this.registerForm.value.dni.toUpperCase(),
        nombre: this.registerForm.value.nombre,
        especialidad: this.registerForm.value.especialidad || '',
        password: this.registerForm.value.password
      };

      this.workerService.registerWorker(request).subscribe({
        next: () => {
          this.submitting = false;
          this.successMessage = 'Trabajador registrado con éxito.';
          this.registerForm.reset();
        },
        error: (err) => {
          this.submitting = false;
          this.errorMessage = err.error?.error || 'Error al registrar al trabajador.';
        }
      });
    }
  }
}
