import { Component, OnInit, inject } from '@angular/core';
import { CatalogService } from '../../../services/catalog.service';
import { CatalogItem } from '../../../models/catalog.model';
import { Category } from '../../../models/category.model';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    <div class="catalog-header">
      <h1>Nuestro Catálogo</h1>
      <p>Explora nuestra selección exclusiva de servicios premium y productos profesionales.</p>
    </div>

    <!-- Filters Section -->
    <div class="filters-container glass-panel">
      <div class="filter-group">
        <label>Tipo:</label>
        <div class="filter-buttons">
          <button (click)="setTypeFilter('TODOS')" [class.active]="selectedType === 'TODOS'" class="btn-filter">Todos</button>
          <button (click)="setTypeFilter('SERVICIO')" [class.active]="selectedType === 'SERVICIO'" class="btn-filter">Servicios</button>
          <button (click)="setTypeFilter('PRODUCTO')" [class.active]="selectedType === 'PRODUCTO'" class="btn-filter">Productos</button>
        </div>
      </div>

      @if (filteredCategories.length > 0) {
        <div class="filter-group">
          <label>Categoría:</label>
          <div class="filter-buttons categories-scroll">
            <button (click)="setCategoryFilter(null)" [class.active]="selectedCategory === null" class="btn-filter">Todas</button>
            @for (cat of filteredCategories; track cat.id) {
              <button (click)="setCategoryFilter(cat.id!)" [class.active]="selectedCategory === cat.id" class="btn-filter">
                {{ cat.nombre }}
              </button>
            }
          </div>
        </div>
      }
    </div>

    <!-- Catalog Grid -->
    <div class="catalog-grid">
      @for (item of filteredItems; track item.id) {
        <div class="catalog-card glass-card">
          <div class="card-image-wrapper">
            @if (item.portada) {
              <img [src]="item.portada.url" [alt]="item.nombre" class="card-img" />
            } @else {
              <div class="card-img-placeholder">
                {{ item.tipo === 'SERVICIO' ? '💇‍♀️' : '🧴' }}
              </div>
            }
            <span class="card-badge" [class.badge-service]="item.tipo === 'SERVICIO'">{{ item.tipo }}</span>
          </div>

          <div class="card-content">
            <span class="card-category">{{ item.categoria.nombre }}</span>
            <h3>{{ item.nombre }}</h3>
            <p>{{ item.descripcion }}</p>
            
            <div class="card-footer">
              <span class="card-price">{{ item.precio | currency:'EUR' }}</span>
              @if (item.tipo === 'SERVICIO' && item.duracionMinutos) {
                <span class="card-meta">⏱️ {{ item.duracionMinutos }} min</span>
              } @else if (item.tipo === 'PRODUCTO') {
                <span class="card-meta" [style.color]="item.stock && item.stock > 0 ? '#34d399' : '#f87171'">
                  {{ item.stock && item.stock > 0 ? 'Stock: ' + item.stock : 'Agotado' }}
                </span>
              }
            </div>
          </div>
        </div>
      } @empty {
        <div class="empty-state">
          <p>No se encontraron artículos que coincidan con los filtros seleccionados.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .catalog-header {
      margin-bottom: 3rem;
      text-align: center;
    }
    .catalog-header h1 {
      font-size: 2.5rem;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }
    .catalog-header p {
      color: var(--text-secondary);
      font-size: 1.1rem;
    }
    .filters-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      margin-bottom: 3rem;
      border-radius: var(--border-radius-md);
    }
    .filter-group {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .filter-group label {
      font-family: var(--font-heading);
      font-weight: 600;
      color: var(--text-secondary);
      min-width: 80px;
    }
    .filter-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .categories-scroll {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .btn-filter {
      background: rgba(255, 255, 255, 0.04);
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      padding: 0.4rem 1rem;
      border-radius: 20px;
      font-size: 0.9rem;
      cursor: pointer;
      font-family: var(--font-heading);
      transition: all 0.2s ease;
    }
    .btn-filter:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-primary);
    }
    .btn-filter.active {
      background: var(--accent-gold);
      color: #000;
      border-color: var(--accent-gold);
      font-weight: 600;
    }
    .catalog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 2rem;
    }
    .catalog-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    .card-image-wrapper {
      position: relative;
      aspect-ratio: 16 / 9;
      background: var(--bg-tertiary);
    }
    .card-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .card-img-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      font-size: 3rem;
      background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
    }
    .card-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: rgba(212, 175, 55, 0.15);
      border: 1px solid var(--accent-gold);
      color: var(--accent-gold);
      padding: 0.2rem 0.5rem;
      font-size: 0.7rem;
      font-weight: 700;
      border-radius: 4px;
    }
    .card-badge.badge-service {
      background: rgba(200, 138, 138, 0.15);
      border-color: var(--accent-rose);
      color: var(--accent-rose);
    }
    .card-content {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
    .card-category {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--text-muted);
      font-weight: 600;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }
    .card-content h3 {
      font-size: 1.15rem;
      margin-bottom: 0.5rem;
    }
    .card-content p {
      font-size: 0.9rem;
      color: var(--text-secondary);
      margin-bottom: 1.25rem;
      flex-grow: 1;
      line-height: 1.5;
    }
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color);
    }
    .card-price {
      font-family: var(--font-heading);
      font-weight: 700;
      font-size: 1.15rem;
      color: var(--text-primary);
    }
    .card-meta {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 2rem;
      color: var(--text-secondary);
    }
    @media(max-width: 768px) {
      .filters-container {
        padding: 1rem;
      }
      .filter-group {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }
  `]
})
export class CatalogComponent implements OnInit {
  private catalogService = inject(CatalogService);

  categories: Category[] = [];
  catalogItems: CatalogItem[] = [];

  // Filter state
  selectedType: 'TODOS' | 'SERVICIO' | 'PRODUCTO' = 'TODOS';
  selectedCategory: number | null = null;

  ngOnInit(): void {
    this.catalogService.getCategories('CATALOGO').subscribe(cats => {
      this.categories = cats;
    });

    this.catalogService.getCatalogItems().subscribe({
      next: (items) => {
        this.catalogItems = items.filter(i => i.activo);
      },
      error: () => {
        this.catalogItems = [];
      }
    });
  }

  get filteredCategories(): Category[] {
    if (this.selectedType === 'TODOS') {
      return this.categories;
    }
    return this.categories;
  }

  get filteredItems(): CatalogItem[] {
    return this.catalogItems.filter(item => {
      const matchesType = this.selectedType === 'TODOS' || item.tipo === this.selectedType;
      const matchesCategory = this.selectedCategory === null || item.categoria.id === this.selectedCategory;
      return matchesType && matchesCategory;
    });
  }

  setTypeFilter(type: 'TODOS' | 'SERVICIO' | 'PRODUCTO'): void {
    this.selectedType = type;
    this.selectedCategory = null;
  }

  setCategoryFilter(categoryId: number | null): void {
    this.selectedCategory = categoryId;
  }

}
