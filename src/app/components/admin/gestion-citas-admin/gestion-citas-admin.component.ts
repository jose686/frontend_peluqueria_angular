import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { AppointmentService } from '../../../services/appointment.service';
import { CatalogService } from '../../../services/catalog.service';
import { User } from '../../../models/user.model';
import { AppointmentDto, AppointmentRequest } from '../../../models/appointment.model';
import { CatalogItem } from '../../../models/catalog.model';

interface TimeSlot {
  horaInicio: string; // e.g. "09:00"
  horaFin: string;    // e.g. "09:30"
  isCommercial: boolean;
}

@Component({
  selector: 'app-gestion-citas-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="gestion-citas fade-in-el">
      <div class="panel-header">
        <h2>Gestión de Disponibilidad y Citas</h2>
        <p>Controla la cuadrícula de trabajo de los estilistas, bloquea horas de libranza y gestiona reservas manuales.</p>
      </div>

      <!-- Barra de Filtros Superior -->
      <div class="filters-bar glass-panel">
        <div class="filter-group">
          <label class="form-label" for="employee-select">Estilista / Empleado</label>
          <select id="employee-select" class="form-control" [(ngModel)]="selectedEmployeeId" (change)="onFilterChange()">
            <option [value]="null" disabled selected>Selecciona un estilista...</option>
            @for (emp of employees; track emp.id) {
              <option [value]="emp.id">{{ emp.nombre }} {{ emp.apellidos || '' }}</option>
            }
          </select>
        </div>

        <div class="filter-group date-navigator">
          <label class="form-label">Fecha de Gestión</label>
          <div class="navigator-controls">
            <button class="btn btn-secondary btn-nav" (click)="navigateDay(-1)">◀</button>
            <input type="date" class="form-control date-input" [(ngModel)]="selectedDate" (change)="onFilterChange()"/>
            <button class="btn btn-secondary btn-nav" (click)="navigateDay(1)">▶</button>
          </div>
        </div>
      </div>

      <!-- Grid Visual de Horarios -->
      <div class="grid-container" *ngIf="selectedEmployeeId; else selectEmployeePlaceholder">
        <div class="grid-header">
          <h3>Horario de {{ getSelectedEmployeeName() }} — 📅 {{ selectedDate | date:'dd/MM/yyyy' }}</h3>
          <span class="legend-badge badge-green">Disponible (Verde)</span>
          <span class="legend-badge badge-red">Ocupado (Rojo)</span>
          <span class="legend-badge badge-gray">Bloqueado / Descanso (Gris)</span>
        </div>

        <!-- Bloque Mañana -->
        <div class="schedule-section">
          <h4>Jornada de Mañana (09:00 - 14:00)</h4>
          <div class="slots-grid">
            @for (slot of morningSlots; track slot.horaInicio) {
              <div 
                [class]="getSlotClass(slot)" 
                (click)="onSlotClick(slot)"
                [title]="getSlotTooltip(slot)"
              >
                <div class="slot-time">{{ slot.horaInicio }} - {{ slot.horaFin }}</div>
                <div class="slot-status-text">{{ getSlotStatusText(slot) }}</div>
                <div class="slot-details" *ngIf="getSlotAppointment(slot) as app">
                  <span class="slot-client" *ngIf="!isBlockedService(app.servicio)">👤 {{ app.cliente.nombre }}</span>
                  <span class="slot-service">💇‍♀️ {{ app.servicio.nombre }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Descanso Almuerzo -->
        <div class="lunch-break glass-panel">
          ☕ 14:00 - 17:00 — Intervalo de Cierre / Almuerzo
        </div>

        <!-- Bloque Tarde -->
        <div class="schedule-section">
          <h4>Jornada de Tarde (17:00 - 20:00)</h4>
          <div class="slots-grid">
            @for (slot of afternoonSlots; track slot.horaInicio) {
              <div 
                [class]="getSlotClass(slot)" 
                (click)="onSlotClick(slot)"
                [title]="getSlotTooltip(slot)"
              >
                <div class="slot-time">{{ slot.horaInicio }} - {{ slot.horaFin }}</div>
                <div class="slot-status-text">{{ getSlotStatusText(slot) }}</div>
                <div class="slot-details" *ngIf="getSlotAppointment(slot) as app">
                  <span class="slot-client" *ngIf="!isBlockedService(app.servicio)">👤 {{ app.cliente.nombre }}</span>
                  <span class="slot-service">💇‍♀️ {{ app.servicio.nombre }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Placeholder cuando no hay empleado seleccionado -->
      <ng-template #selectEmployeePlaceholder>
        <div class="placeholder-panel glass-panel">
          <p>Selecciona un estilista en la barra de filtros superior para cargar su cuadrícula de disponibilidad.</p>
        </div>
      </ng-template>

      <!-- ================= MODAL: HORARIO LIBRE / CREACIÓN DE CITA ================= -->
      <div class="modal-backdrop fade-in-el" *ngIf="activeSlot && showFreeSlotModal">
        <div class="modal-content glass-panel">
          <div class="modal-header">
            <h3>Gestionar Slot Libre: {{ activeSlot.horaInicio }} - {{ activeSlot.horaFin }}</h3>
            <button class="btn-close" (click)="closeModals()">×</button>
          </div>
          
          <div class="modal-body">
            <p>Elige una acción para este horario asignado a <strong>{{ getSelectedEmployeeName() }}</strong>.</p>
            
            <div class="modal-actions-buttons">
              <button class="btn btn-secondary btn-block-action" (click)="blockActiveSlot()">
                🚫 Bloquear Horario / Libranza
              </button>
              <button class="btn btn-primary btn-block-action" (click)="showManualBookingForm()">
                📅 Crear Cita Manual (Reserva)
              </button>
            </div>

            <!-- Formulario de Creación Manual (Oculto inicialmente) -->
            <div class="manual-booking-form fade-in-el" *ngIf="isCreatingManualBooking">
              <h4>Crear Cita Manual</h4>
              
              <div class="form-group">
                <label class="form-label" for="client-select">Cliente</label>
                <select id="client-select" class="form-control" [(ngModel)]="newBooking.clienteId">
                  <option [value]="null" disabled selected>Selecciona un cliente...</option>
                  @for (cli of clients; track cli.id) {
                    <option [value]="cli.id">{{ cli.nombre }} {{ cli.apellidos || '' }} ({{ cli.email }})</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="service-select">Servicio</label>
                <select id="service-select" class="form-control" [(ngModel)]="newBooking.servicioId">
                  <option [value]="null" disabled selected>Selecciona un servicio...</option>
                  @for (srv of activeServices; track srv.id) {
                    <option [value]="srv.id">{{ srv.nombre }} ({{ srv.duracionMinutos }} min) — {{ srv.precio | currency:'EUR' }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="booking-notes">Notas / Comentarios</label>
                <textarea id="booking-notes" class="form-control" rows="3" [(ngModel)]="newBooking.notas" placeholder="Ej: Reserva telefónica, alergia al tinte..."></textarea>
              </div>

              <div class="form-actions">
                <button class="btn btn-secondary" (click)="isCreatingManualBooking = false">Cancelar</button>
                <button class="btn btn-primary" (click)="saveManualBooking()" [disabled]="!newBooking.clienteId || !newBooking.servicioId">
                  Guardar Cita
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= MODAL: DETALLE DE CITA EXISTENTE (ROJO) ================= -->
      <div class="modal-backdrop fade-in-el" *ngIf="selectedApp && showDetailModal">
        <div class="modal-content glass-panel">
          <div class="modal-header">
            <h3>Detalle de la Cita</h3>
            <button class="btn-close" (click)="closeModals()">×</button>
          </div>
          <div class="modal-body">
            <div class="app-detail-card">
              <div class="detail-section">
                <h5>Cliente</h5>
                <p><strong>{{ selectedApp.cliente.nombre }} {{ selectedApp.cliente.apellidos || '' }}</strong></p>
                <p class="text-muted"><small>✉ {{ selectedApp.cliente.email }} | 📞 {{ selectedApp.cliente.telefono || 'Sin teléfono' }}</small></p>
              </div>

              <div class="detail-section">
                <h5>Servicio Reservado</h5>
                <p><strong>{{ selectedApp.servicio.nombre }}</strong></p>
                <p class="text-muted">
                  <small>⏰ {{ selectedApp.servicio.duracionMinutos }} minutos | 💰 {{ selectedApp.servicio.precio | currency:'EUR' }}</small>
                </p>
              </div>

              <div class="detail-section">
                <h5>Fecha & Hora</h5>
                <p>📅 {{ selectedApp.fechaHora | date:'EEEE, d MMMM yyyy, HH:mm':'':'es' }}</p>
              </div>

              <div class="detail-section" *ngIf="selectedApp.notas">
                <h5>Notas del Administrador / Cliente</h5>
                <p class="notes-box">{{ selectedApp.notas }}</p>
              </div>

              <div class="detail-section">
                <h5>Estado</h5>
                <span class="badge" [class]="getStatusClass(selectedApp.estado)">{{ selectedApp.estado }}</span>
              </div>
            </div>

            <div class="modal-actions-footer">
              <button class="btn btn-secondary" (click)="closeModals()">Cerrar</button>
              <div class="actions-group-right">
                @if (selectedApp.estado !== 'CONFIRMADA' && selectedApp.estado !== 'COMPLETADA') {
                  <button class="btn btn-secondary btn-success-badge" (click)="updateAppStatus('CONFIRMADA')">Confirmar</button>
                }
                @if (selectedApp.estado !== 'COMPLETADA') {
                  <button class="btn btn-secondary btn-complete-badge" (click)="updateAppStatus('COMPLETADA')">Completar</button>
                }
                @if (selectedApp.estado !== 'CANCELADA') {
                  <button class="btn btn-danger" (click)="updateAppStatus('CANCELADA')">Cancelar Cita</button>
                }
                <button class="btn btn-danger btn-delete-app" (click)="deleteAppointment(selectedApp.id!)">🗑️ Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= MODAL: DESBLOQUEAR SLOT (GRIS) ================= -->
      <div class="modal-backdrop fade-in-el" *ngIf="selectedApp && showBlockedModal">
        <div class="modal-content glass-panel" style="max-width: 450px;">
          <div class="modal-header">
            <h3>Horario Bloqueado</h3>
            <button class="btn-close" (click)="closeModals()">×</button>
          </div>
          <div class="modal-body" style="text-align: center;">
            <p style="margin-bottom: 1.5rem;">Este bloque horario está marcado como <strong>libranza / ocupación interna</strong>.</p>
            
            <div class="blocked-info glass-panel" style="padding: 1rem; margin-bottom: 1.5rem; text-align: left;">
              <p>📍 <strong>Fecha:</strong> {{ selectedApp.fechaHora | date:'dd/MM/yyyy' }}</p>
              <p>⏰ <strong>Hora:</strong> {{ selectedApp.fechaHora | date:'HH:mm' }}</p>
              <p *ngIf="selectedApp.notas">📝 <strong>Motivo:</strong> {{ selectedApp.notas }}</p>
            </div>

            <div style="display: flex; gap: 0.5rem; justify-content: center;">
              <button class="btn btn-secondary" (click)="closeModals()">Cerrar</button>
              <button class="btn btn-primary" (click)="deleteAppointment(selectedApp.id!)">🔓 Desbloquear Horario</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .gestion-citas {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .panel-header h2 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    .panel-header p {
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    /* Barra de filtros */
    .filters-bar {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      padding: 1.5rem;
    }
    .filter-group {
      display: flex;
      flex-direction: column;
    }
    .date-navigator {
      display: flex;
      flex-direction: column;
    }
    .navigator-controls {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .btn-nav {
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
    }
    .date-input {
      flex: 1;
      text-align: center;
    }

    /* Grid y Calendario */
    .grid-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .grid-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
    }
    .grid-header h3 {
      font-size: 1.2rem;
      color: var(--accent-gold);
      margin-right: auto;
    }
    .legend-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 500;
    }
    .badge-green { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .badge-red { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    .badge-gray { background: rgba(255, 255, 255, 0.08); color: #9ca3af; }

    .schedule-section h4 {
      font-size: 1rem;
      color: var(--text-secondary);
      margin-bottom: 0.75rem;
      border-left: 3px solid var(--accent-gold);
      padding-left: 0.5rem;
    }
    .slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
    }

    /* Slot Styles */
    .slot-card {
      padding: 1rem;
      border-radius: var(--border-radius-md);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      transition: all 0.2s ease;
      min-height: 100px;
      justify-content: space-between;
      border: 1px solid transparent;
    }
    .slot-card:hover {
      transform: translateY(-2px);
    }
    .slot-time {
      font-weight: 700;
      font-size: 0.95rem;
      font-family: var(--font-heading);
    }
    .slot-status-text {
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    .slot-details {
      display: flex;
      flex-direction: column;
      font-size: 0.8rem;
      border-top: 1px solid rgba(255,255,255,0.05);
      padding-top: 0.4rem;
    }
    .slot-client {
      font-weight: 600;
      color: #fff;
    }
    .slot-service {
      color: var(--text-secondary);
    }

    /* Color classes */
    .slot-free {
      background: rgba(16, 185, 129, 0.04);
      border-color: rgba(16, 185, 129, 0.15);
      color: #34d399;
    }
    .slot-free:hover {
      background: rgba(16, 185, 129, 0.08);
      border-color: #34d399;
    }
    
    .slot-occupied {
      background: rgba(239, 68, 68, 0.04);
      border-color: rgba(239, 68, 68, 0.15);
      color: #f87171;
    }
    .slot-occupied:hover {
      background: rgba(239, 68, 68, 0.08);
      border-color: #f87171;
    }

    .slot-blocked {
      background: rgba(255, 255, 255, 0.02);
      border-color: rgba(255, 255, 255, 0.05);
      color: var(--text-muted);
    }
    .slot-blocked:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: var(--text-secondary);
    }

    /* Descanso almuerzo */
    .lunch-break {
      text-align: center;
      padding: 0.75rem;
      font-size: 0.9rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    /* Placeholder */
    .placeholder-panel {
      padding: 3rem;
      text-align: center;
      color: var(--text-secondary);
    }

    /* Modales */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-content {
      width: 100%;
      max-width: 500px;
      padding: 1.75rem;
      border-radius: var(--border-radius-lg);
      position: relative;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
      margin-bottom: 1.25rem;
    }
    .modal-header h3 {
      font-size: 1.25rem;
      color: var(--text-primary);
    }
    .btn-close {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 1.5rem;
      cursor: pointer;
    }
    .btn-close:hover {
      color: #fff;
    }
    
    .modal-actions-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1rem;
      margin-bottom: 1rem;
    }
    .btn-block-action {
      width: 100%;
      padding: 1rem;
      justify-content: flex-start;
      font-size: 1rem;
    }

    .manual-booking-form {
      margin-top: 1.5rem;
      border-top: 1px solid var(--border-color);
      padding-top: 1.25rem;
    }
    .manual-booking-form h4 {
      font-size: 1.05rem;
      margin-bottom: 1rem;
      color: var(--accent-gold);
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    /* Detalle de cita */
    .app-detail-card {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .detail-section h5 {
      font-size: 0.85rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }
    .detail-section p {
      font-size: 1rem;
    }
    .notes-box {
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--border-color);
      padding: 0.75rem;
      border-radius: var(--border-radius-sm);
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    .modal-actions-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border-color);
      padding-top: 1.25rem;
    }
    .actions-group-right {
      display: flex;
      gap: 0.5rem;
    }
    .btn-success-badge {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      color: #34d399;
    }
    .btn-success-badge:hover {
      background: rgba(16, 185, 129, 0.2);
    }
    .btn-complete-badge {
      background: rgba(212, 175, 55, 0.1);
      border: 1px solid rgba(212, 175, 55, 0.2);
      color: var(--accent-gold);
    }
    .btn-complete-badge:hover {
      background: rgba(212, 175, 55, 0.2);
    }
    .btn-delete-app {
      background: none;
      border: none;
    }
    .btn-delete-app:hover {
      background: rgba(239, 68, 68, 0.1);
    }

    @media (max-width: 768px) {
      .filters-bar {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class GestionCitasAdminComponent implements OnInit {
  private userService = inject(UserService);
  private appointmentService = inject(AppointmentService);
  private catalogService = inject(CatalogService);

  // Filtros
  employees: User[] = [];
  selectedEmployeeId: any = null;
  selectedDate: string = new Date().toISOString().split('T')[0];

  // Listados cargados
  clients: User[] = [];
  activeServices: CatalogItem[] = [];
  appointments: any[] = [];
  bloqueoService: CatalogItem | null = null;

  // Slots de horarios
  morningSlots: any[] = [];
  afternoonSlots: any[] = [];

  // Control de Modales y Estados Activos
  activeSlot: any = null;
  selectedApp: any = null;

  showFreeSlotModal = false;
  showDetailModal = false;
  showBlockedModal = false;
  isCreatingManualBooking = false;

  // Nueva Reserva Form
  newBooking = {
    clienteId: null as number | null,
    servicioId: null as number | null,
    notas: ''
  };

  ngOnInit(): void {
    this.loadEmployees();
    this.loadClients();
    this.loadServices();
  }

  loadEmployees(): void {
    this.userService.getEmployees().subscribe({
      next: (data) => {
        this.employees = data;
        // Seleccionar el primer empleado por defecto si hay alguno
        if (data.length > 0) {
          this.selectedEmployeeId = data[0].id!;
          this.loadAppointments();
        }
      },
      error: (err) => console.error('Error al cargar empleados:', err)
    });
  }

  loadClients(): void {
    this.userService.getClients().subscribe({
      next: (data) => {
        this.clients = data;
      },
      error: (err) => console.error('Error al cargar clientes:', err)
    });
  }

  loadServices(): void {
    // Cargar todos los elementos del catálogo
    this.catalogService.getCatalogItems(true).subscribe({
      next: (data) => {
        // Filtrar servicios activos para creación manual
        this.activeServices = data.filter(item => item.tipo === 'SERVICIO' && item.activo);
        
        // Buscar el servicio especial de bloqueo
        this.bloqueoService = data.find(item => item.slug === 'bloqueo-horario') || null;
      },
      error: (err) => console.error('Error al cargar servicios:', err)
    });
  }

  loadAppointments(): void {
    if (!this.selectedEmployeeId) return;

    this.appointmentService.getAdminAvailability(this.selectedEmployeeId, this.selectedDate).subscribe({
      next: (data: any[]) => {
        // Formatear hora de 09:00:00 a 09:00
        const formattedData = data.map(slot => ({
          ...slot,
          horaInicio: slot.horaInicio.substring(0, 5),
          horaFin: slot.horaFin.substring(0, 5)
        }));
        this.morningSlots = formattedData.filter(slot => slot.horaFin <= '14:00');
        this.afternoonSlots = formattedData.filter(slot => slot.horaInicio >= '17:00');
      },
      error: (err: any) => console.error('Error al cargar disponibilidad:', err)
    });
  }

  onFilterChange(): void {
    this.loadAppointments();
  }

  navigateDay(offset: number): void {
    const dateObj = new Date(this.selectedDate);
    dateObj.setDate(dateObj.getDate() + offset);
    this.selectedDate = dateObj.toISOString().split('T')[0];
    this.onFilterChange();
  }

  getSelectedEmployeeName(): string {
    const emp = this.employees.find(e => String(e.id) === String(this.selectedEmployeeId));
    return emp ? `${emp.nombre} ${emp.apellidos || ''}` : '';
  }

  getSlotAppointment(slot: any): any {
    return slot.appointment;
  }

  isBlockedService(service: any): boolean {
    return service?.slug === 'bloqueo-horario' || service?.nombre?.toLowerCase().includes('bloqueo');
  }

  getSlotClass(slot: any): string {
    if (slot.disponible) {
      return 'slot-card slot-free';
    }
    return 'slot-card slot-occupied';
  }

  getSlotStatusText(slot: any): string {
    const app = slot.appointment;
    if (app) {
      return `Reservado (${app.estado})`;
    }
    return slot.disponible ? 'Disponible' : 'No disponible';
  }

  getSlotTooltip(slot: any): string {
    const app = slot.appointment;
    if (app) {
      return `Cliente: ${app.cliente?.nombre}. Servicio: ${app.servicio?.nombre}. Estado: ${app.estado}`;
    }
    return slot.disponible ? 'Haz clic para reservar' : 'Fuera de jornada / Descanso';
  }

  onSlotClick(slot: any): void {
    const app = slot.appointment;
    this.activeSlot = slot;

    if (slot.disponible) {
      this.isCreatingManualBooking = false;
      this.newBooking = { clienteId: null, servicioId: null, notas: '' };
      this.showFreeSlotModal = true;
    } else if (app) {
      this.selectedApp = app;
      if (this.isBlockedService(app.servicio)) {
        this.showBlockedModal = true;
      } else {
        this.showDetailModal = true;
      }
    }
  }

  closeModals(): void {
    this.showFreeSlotModal = false;
    this.showDetailModal = false;
    this.showBlockedModal = false;
    this.activeSlot = null;
    this.selectedApp = null;
  }

  // --- ACCIÓN: BLOQUEAR HORARIO (LIBRANZA) ---
  blockActiveSlot(): void {
    if (!this.activeSlot || !this.selectedEmployeeId) return;

    if (!this.bloqueoService) {
      alert('Error: No se ha encontrado el servicio de "Bloqueo de Horario" en el sistema. Asegúrate de que el catálogo está sembrado.');
      return;
    }

    // Combinar fecha e inicio del slot
    const startDateTime = `${this.selectedDate}T${this.activeSlot.horaInicio}:00`;

    const request: any = {
      servicioId: this.bloqueoService.id!,
      empleadoId: Number(this.selectedEmployeeId),
      fechaHora: startDateTime,
      estado: 'CONFIRMADA',
      notas: 'Bloqueo administrativo de agenda / Libranza laboral.'
    };

    this.appointmentService.createAppointment(request).subscribe({
      next: () => {
        this.loadAppointments();
        this.closeModals();
      },
      error: (err) => {
        alert('Error al bloquear horario: ' + (err.error?.error || 'Desconocido'));
      }
    });
  }

  // --- ACCIÓN: MOSTRAR FORMULARIO CITA MANUAL ---
  showManualBookingForm(): void {
    this.isCreatingManualBooking = true;
  }

  // --- ACCIÓN: GUARDAR CITA MANUAL ---
  saveManualBooking(): void {
    if (!this.activeSlot || !this.selectedEmployeeId || !this.newBooking.clienteId || !this.newBooking.servicioId) return;

    const startDateTime = `${this.selectedDate}T${this.activeSlot.horaInicio}:00`;

    const request: any = {
      clienteId: Number(this.newBooking.clienteId),
      servicioId: Number(this.newBooking.servicioId),
      empleadoId: Number(this.selectedEmployeeId),
      fechaHora: startDateTime,
      estado: 'CONFIRMADA', // Las citas manuales desde admin se marcan como confirmadas directamente
      notas: this.newBooking.notas
    };

    this.appointmentService.createAppointment(request).subscribe({
      next: () => {
        this.loadAppointments();
        this.closeModals();
      },
      error: (err) => {
        alert('Error al crear reserva: ' + (err.error?.error || 'Desconocido'));
      }
    });
  }

  // --- ACCIÓN: ACTUALIZAR ESTADO DE LA CITA ---
  updateAppStatus(status: string): void {
    if (!this.selectedApp) return;

    const request: any = {
      clienteId: this.selectedApp.cliente.id,
      servicioId: this.selectedApp.servicio.id!,
      empleadoId: this.selectedApp.empleado?.id,
      fechaHora: this.selectedApp.fechaHora,
      estado: status,
      notas: this.selectedApp.notas
    };

    this.appointmentService.updateAppointment(this.selectedApp.id!, request).subscribe({
      next: () => {
        this.loadAppointments();
        this.closeModals();
      },
      error: (err: any) => {
        alert('Error al actualizar estado: ' + (err.error?.error || 'Desconocido'));
      }
    });
  }

  // --- ACCIÓN: ELIMINAR O DESBLOQUEAR APPOINTMENT ---
  deleteAppointment(id: string | number): void {
    const isBlock = this.showBlockedModal;
    const confirmMessage = isBlock 
      ? '¿Estás seguro de que deseas desbloquear y liberar esta franja horaria?' 
      : '¿Estás seguro de que deseas eliminar permanentemente esta cita del registro?';

    if (confirm(confirmMessage)) {
      this.appointmentService.deleteAppointment(id).subscribe({
        next: () => {
          this.loadAppointments();
          this.closeModals();
        },
        error: (err: any) => {
          alert('Error al realizar la acción: ' + (err.error?.error || 'Desconocido'));
        }
      });
    }
  }

  // --- AUXILIARES ---
  private parseTimeToMinutes(timeStr: string): number {
    const [hrs, mins] = timeStr.split(':').map(Number);
    return hrs * 60 + mins;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDIENTE': return 'badge-pending';
      case 'CONFIRMADA': return 'badge-confirmed';
      case 'CANCELADA': return 'badge-cancelled';
      case 'COMPLETADA': return 'badge-confirmed'; // Usar verde o dorado
      default: return 'badge-pending';
    }
  }
}
