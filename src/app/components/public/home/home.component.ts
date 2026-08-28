import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../../services/catalog.service';
import { CatalogItem } from '../../../models/catalog.model';
import { CurrencyPipe, SlicePipe } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, SlicePipe],
  template: `
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Encuentra Tu Estilo Exclusivo</h1>
        <p class="hero-subtitle">Experimenta el arte del estilismo y el cuidado capilar de la mano de nuestros profesionales.</p>
        <div class="hero-actions">
          <a routerLink="/mis-citas" class="btn btn-primary">Reservar Cita</a>
          <a routerLink="/catalog" class="btn btn-secondary">Ver Catálogo</a>
        </div>
      </div>
      <div class="hero-blur-orb"></div>
    </div>

    <section class="featured-services-section">
      <h2 class="section-title">Nuestros Servicios Destacados</h2>
      <p class="section-desc">Cortes de diseño, tratamientos reparadores, coloraciones personalizadas y más.</p>
      
      <div class="services-grid">
        @if (isLoading) {
          @for (i of [1, 2, 3]; track i) {
            <div class="skeleton-card">
              <div class="skeleton-img"></div>
              <div class="skeleton-info">
                <div class="skeleton-title"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text" style="width: 85%;"></div>
                <div class="skeleton-meta">
                  <div class="skeleton-price"></div>
                  <div class="skeleton-duration"></div>
                </div>
              </div>
            </div>
          }
        } @else {
          @for (item of featuredServices; track item.id) {
            <div class="service-card glass-card">
              <div class="service-cover-wrapper">
                @if (item.portada) {
                  <img [src]="item.portada.url" [alt]="item.nombre" class="service-img" />
                } @else {
                  <div class="service-img-placeholder">💇‍♀️</div>
                }
                <span class="service-category">{{ item.categoria.nombre }}</span>
              </div>
              <div class="service-info">
                <h3>{{ item.nombre }}</h3>
                <p class="service-desc">{{ item.descripcion | slice:0:100 }}...</p>
                <div class="service-meta">
                  <span class="service-price">{{ item.precio | currency:'EUR' }}</span>
                  @if (item.duracionMinutos) {
                    <span class="service-duration">⏱️ {{ item.duracionMinutos }} min</span>
                  }
                </div>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <div class="empty-state-icon">✨</div>
              <h3 class="empty-state-title">Servicios No Disponibles</h3>
              <p class="empty-state-desc">Próximamente tendremos listos nuestros mejores servicios para ti. ¡Vuelve pronto!</p>
            </div>
          }
        }
      </div>
    </section>
  `,
  styles: [`
    .hero-section {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6rem 2rem;
      border-radius: var(--border-radius-lg);
      background: linear-gradient(135deg, rgba(20,20,24,0.8), rgba(10,10,12,0.9)), url('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200') center/cover no-repeat;
      overflow: hidden;
      margin-bottom: 4rem;
      text-align: center;
      border: 1px solid var(--border-color);
    }
    .hero-content {
      position: relative;
      z-index: 2;
      max-width: 700px;
    }
    .hero-title {
      font-size: 3.5rem;
      line-height: 1.1;
      margin-bottom: 1.5rem;
      background: linear-gradient(to right, #ffffff, var(--accent-gold));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-subtitle {
      font-size: 1.25rem;
      color: var(--text-secondary);
      margin-bottom: 2rem;
    }
    .hero-actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }
    .hero-blur-orb {
      position: absolute;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(212,175,55,0.15) 0%, rgba(0,0,0,0) 70%);
      bottom: -100px;
      right: -50px;
      z-index: 1;
    }
    .featured-services-section {
      margin-bottom: 4rem;
    }
    .section-title {
      font-size: 2.2rem;
      text-align: center;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
    }
    .section-desc {
      text-align: center;
      color: var(--text-secondary);
      margin-bottom: 3rem;
      font-size: 1.1rem;
    }
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 2rem;
    }
    .service-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    .service-cover-wrapper {
      position: relative;
      height: 200px;
      background: var(--bg-tertiary);
    }
    .service-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .service-img-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      font-size: 3rem;
      background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
    }
    .service-category {
      position: absolute;
      top: 1rem;
      left: 1rem;
      background: rgba(10, 10, 12, 0.85);
      border: 1px solid var(--accent-gold);
      color: var(--accent-gold);
      padding: 0.25rem 0.6rem;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .service-info {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
    .service-info h3 {
      font-size: 1.3rem;
      margin-bottom: 0.5rem;
    }
    .service-desc {
      font-size: 0.95rem;
      color: var(--text-secondary);
      margin-bottom: 1.5rem;
      flex-grow: 1;
    }
    .service-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }
    .service-price {
      font-family: var(--font-heading);
      font-weight: 700;
      font-size: 1.25rem;
      color: var(--accent-gold);
    }
    .service-duration {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    .loading-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .skeleton-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-md);
      height: 380px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }
    .skeleton-img {
      height: 200px;
      background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--border-color) 37%, var(--bg-tertiary) 63%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    .skeleton-info {
      padding: 1.5rem;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .skeleton-title {
      height: 1.5rem;
      width: 70%;
      background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--border-color) 37%, var(--bg-tertiary) 63%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }
    .skeleton-text {
      height: 1rem;
      width: 100%;
      background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--border-color) 37%, var(--bg-tertiary) 63%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }
    .skeleton-meta {
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .skeleton-price {
      height: 1.25rem;
      width: 30%;
      background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--border-color) 37%, var(--bg-tertiary) 63%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }
    .skeleton-duration {
      height: 1rem;
      width: 25%;
      background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--border-color) 37%, var(--bg-tertiary) 63%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 2rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px dashed var(--border-color);
      border-radius: var(--border-radius-md);
      color: var(--text-secondary);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    .empty-state-icon {
      font-size: 3rem;
      color: var(--accent-gold);
      opacity: 0.8;
    }
    .empty-state-title {
      font-family: var(--font-heading);
      font-size: 1.5rem;
      color: var(--text-primary);
      margin: 0;
    }
    .empty-state-desc {
      max-width: 400px;
      margin: 0;
      font-size: 0.95rem;
    }
    @media(max-width: 768px) {
      .hero-title { font-size: 2.5rem; }
      .hero-subtitle { font-size: 1.1rem; }
      .hero-actions { flex-direction: column; }
    }
  `]
})
export class HomeComponent implements OnInit {
  private catalogService = inject(CatalogService);
  featuredServices: CatalogItem[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.catalogService.getCatalogItemsByTipo('SERVICIO').subscribe({
      next: (items) => {
        this.featuredServices = items
          .filter(i => i.activo)
          .slice(0, 3);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar servicios destacados:', err);
        this.featuredServices = [];
        this.isLoading = false;
      }
    });
  }
}
