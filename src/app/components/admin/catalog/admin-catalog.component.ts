import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CatalogService } from '../../../services/catalog.service';
import { MediaService } from '../../../services/media.service';
import { CatalogItem, CatalogItemRequest } from '../../../models/catalog.model';
import { Category } from '../../../models/category.model';
import { MediaFile } from '../../../models/media.model';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-admin-catalog',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe],
  template: `
    <div class="catalog-manager fade-in-el">
      <div class="manager-header">
        <h2>Gestión del Catálogo</h2>
        <button (click)="openCreateForm()" class="btn btn-primary btn-sm">Nuevo Artículo</button>
      </div>

      <div class="manager-layout">
        <!-- Catalog Items Table -->
        <div class="table-container glass-panel">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (item of items; track item.id) {
                <tr>
                  <td>
                    <strong>{{ item.nombre }}</strong>
                    <br/><small class="text-muted">{{ item.slug }}</small>
                  </td>
                  <td>
                    <span class="badge" [class]="item.tipo === 'SERVICIO' ? 'badge-confirmed' : 'badge-pending'">
                      {{ item.tipo }}
                    </span>
                  </td>
                  <td>{{ item.categoria.nombre }}</td>
                  <td>{{ item.precio | currency:'EUR' }}</td>
                  <td>
                    <span class="badge" [class]="item.activo ? 'badge-confirmed' : 'badge-cancelled'">
                      {{ item.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td>
                    <button (click)="editItem(item)" class="action-btn edit" title="Editar">✏️</button>
                    <button (click)="deleteItem(item.id!)" class="action-btn delete" title="Eliminar">🗑️</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" style="text-align: center;">No hay artículos registrados.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Form Panel (Modal-like overlay or sidebar) -->
        @if (showForm) {
          <div class="form-sidebar glass-panel">
            <h3>{{ editingItemId ? 'Editar Artículo' : 'Nuevo Artículo' }}</h3>
            
            <form [formGroup]="itemForm" (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label class="form-label" for="nombre">Nombre *</label>
                <input type="text" id="nombre" formControlName="nombre" class="form-control" required />
              </div>

              <div class="form-group">
                <label class="form-label" for="precio">Precio (€) *</label>
                <input type="number" id="precio" formControlName="precio" class="form-control" step="0.01" required />
              </div>

              <div class="form-group">
                <label class="form-label" for="tipo">Tipo *</label>
                <select id="tipo" formControlName="tipo" class="form-control" (change)="onTipoChange()" required>
                  <option value="SERVICIO">Servicio</option>
                  <option value="PRODUCTO">Producto</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="categoriaId">Categoría *</label>
                <select id="categoriaId" formControlName="categoriaId" class="form-control" required>
                  <option value="">Selecciona categoría</option>
                  @for (cat of categories; track cat.id) {
                    <option [value]="cat.id">{{ cat.nombre }} ({{ cat.tipo }})</option>
                  }
                </select>
              </div>

              @if (itemForm.get('tipo')?.value === 'SERVICIO') {
                <div class="form-group">
                  <label class="form-label" for="duracionMinutos">Duración (minutos)</label>
                  <input type="number" id="duracionMinutos" formControlName="duracionMinutos" class="form-control" />
                </div>
              } @else if (itemForm.get('tipo')?.value === 'PRODUCTO') {
                <div class="form-group">
                  <label class="form-label" for="stock">Stock</label>
                  <input type="number" id="stock" formControlName="stock" class="form-control" />
                </div>
              }

              <div class="form-group">
                <label class="form-label" for="portadaId">Portada (Biblioteca de Medios)</label>
                <select id="portadaId" formControlName="portadaId" class="form-control">
                  <option [value]="null">Sin portada</option>
                  @for (file of mediaFiles; track file.id) {
                    <option [value]="file.id">{{ file.identificador }} ({{ file.filename }})</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="descripcion">Descripción</label>
                <textarea id="descripcion" formControlName="descripcion" class="form-control" rows="3"></textarea>
              </div>

              <div class="form-group checkbox-group">
                <input type="checkbox" id="activo" formControlName="activo" />
                <label for="activo">Artículo Activo</label>
              </div>

              <div class="form-actions">
                <button type="submit" [disabled]="itemForm.invalid" class="btn btn-primary">Guardar</button>
                <button type="button" (click)="closeForm()" class="btn btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .catalog-manager {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .manager-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .manager-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    @media(min-width: 992px) {
      .manager-layout {
        grid-template-columns: 1.2fr 0.8fr;
      }
    }
    .form-sidebar {
      padding: 1.5rem;
      border-radius: var(--border-radius-md);
    }
    .form-sidebar h3 {
      font-size: 1.3rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }
    .checkbox-group {
      flex-direction: row;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .action-btn {
      background: none;
      border: none;
      font-size: 1.1rem;
      cursor: pointer;
      padding: 0.25rem;
      transition: transform 0.2s ease;
    }
    .action-btn:hover {
      transform: scale(1.2);
    }
  `]
})
export class AdminCatalogComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private mediaService = inject(MediaService);
  private fb = inject(FormBuilder);

  items: CatalogItem[] = [];
  categories: Category[] = [];
  mediaFiles: MediaFile[] = [];

  showForm = false;
  editingItemId: number | null = null;

  itemForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]],
    precio: [0.0, [Validators.required, Validators.min(0)]],
    tipo: ['SERVICIO', [Validators.required]],
    categoriaId: ['', [Validators.required]],
    duracionMinutos: [null],
    stock: [null],
    portadaId: [null],
    descripcion: [''],
    activo: [true]
  });

  ngOnInit(): void {
    this.loadCatalog();
    this.loadCategories();
    this.loadMedia();
  }

  loadCatalog(): void {
    this.catalogService.getCatalogItems(true).subscribe({
      next: (data) => {
        this.items = data;
      },
      error: () => {
        this.loadMockCatalog();
      }
    });
  }

  private loadMockCatalog(): void {
    this.items = [
      { id: 1, nombre: 'Corte de Autor & Estilismo', descripcion: 'Servicio de corte premium.', precio: 35.0, tipo: 'SERVICIO', duracionMinutos: 45, categoria: { id: 1, nombre: 'Cortes', tipo: 'SERVICIO' }, activo: true }
    ];
  }

  loadCategories(): void {
    this.catalogService.getCategories().subscribe(data => {
      this.categories = data;
    });
  }

  loadMedia(): void {
    this.mediaService.getAllMedia().subscribe(data => {
      this.mediaFiles = data;
    });
  }

  onTipoChange(): void {
    const tipo = this.itemForm.get('tipo')?.value;
    if (tipo === 'SERVICIO') {
      this.itemForm.get('stock')?.setValue(null);
    } else {
      this.itemForm.get('duracionMinutos')?.setValue(null);
    }
  }

  openCreateForm(): void {
    this.editingItemId = null;
    this.itemForm.reset({
      nombre: '',
      precio: 0.0,
      tipo: 'SERVICIO',
      categoriaId: '',
      duracionMinutos: null,
      stock: null,
      portadaId: null,
      descripcion: '',
      activo: true
    });
    this.showForm = true;
  }

  editItem(item: CatalogItem): void {
    this.editingItemId = item.id!;
    this.itemForm.patchValue({
      nombre: item.nombre,
      precio: item.precio,
      tipo: item.tipo,
      categoriaId: item.categoria?.id || '',
      duracionMinutos: item.duracionMinutos,
      stock: item.stock,
      portadaId: item.portada?.id || null,
      descripcion: item.descripcion,
      activo: item.activo
    });
    this.showForm = true;
  }

  onSubmit(): void {
    if (this.itemForm.valid) {
      const val = this.itemForm.value;
      const req: CatalogItemRequest = {
        nombre: val.nombre,
        precio: val.precio,
        tipo: val.tipo,
        categoriaId: Number(val.categoriaId),
        duracionMinutos: val.duracionMinutos ? Number(val.duracionMinutos) : null,
        stock: val.stock ? Number(val.stock) : null,
        portadaId: val.portadaId ? Number(val.portadaId) : null,
        descripcion: val.descripcion,
        activo: val.activo
      };

      if (this.editingItemId) {
        this.catalogService.updateCatalogItem(this.editingItemId, req).subscribe({
          next: () => {
            this.loadCatalog();
            this.closeForm();
          },
          error: (err) => alert('Error al guardar: ' + (err.error?.error || 'error desconocido'))
        });
      } else {
        this.catalogService.createCatalogItem(req).subscribe({
          next: () => {
            this.loadCatalog();
            this.closeForm();
          },
          error: (err) => alert('Error al crear: ' + (err.error?.error || 'error desconocido'))
        });
      }
    }
  }

  deleteItem(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este artículo?')) {
      this.catalogService.deleteCatalogItem(id).subscribe({
        next: () => {
          this.loadCatalog();
        },
        error: (err) => alert('Error al eliminar: ' + (err.error?.error || 'error desconocido'))
      });
    }
  }

  closeForm(): void {
    this.showForm = false;
    this.editingItemId = null;
  }
}
