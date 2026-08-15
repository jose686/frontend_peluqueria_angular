import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BlogService } from '../../../services/blog.service';
import { BlogPost } from '../../../models/blog.model';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-blog-post-view',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    @if (post) {
      <article class="post-container fade-in-el">
        <a routerLink="/blog" class="back-link">&larr; Volver al blog</a>

        <div class="post-header">
          <span class="post-category">{{ post.categoria.nombre }}</span>
          <h1>{{ post.titulo }}</h1>
          
          <div class="post-meta">
            <span>Por <strong>{{ post.autor?.nombre || 'Redacción' }}</strong></span>
            <span class="meta-separator">&bull;</span>
            <span>{{ post.fechaPublicacion | date:'dd MMMM yyyy' }}</span>
          </div>
        </div>

        @if (post.portada) {
          <div class="post-cover">
            <img [src]="post.portada.url" [alt]="post.titulo" />
          </div>
        }

        <div class="post-content" [innerHTML]="safeHtml"></div>
      </article>
    } @else if (loading) {
      <div class="loading-state">
        <p>Cargando artículo...</p>
      </div>
    } @else {
      <div class="error-state">
        <h2>Artículo no encontrado</h2>
        <p>Lo sentimos, el artículo de blog que buscas no existe o ha sido despublicado.</p>
        <a routerLink="/blog" class="btn btn-primary">Volver al blog</a>
      </div>
    }
  `,
  styles: [`
    .post-container {
      max-width: 800px;
      margin: 0 auto;
    }
    .back-link {
      display: inline-block;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.95rem;
      margin-bottom: 2rem;
      transition: color 0.2s ease;
    }
    .back-link:hover {
      color: var(--accent-gold);
    }
    .post-header {
      margin-bottom: 2.5rem;
    }
    .post-category {
      display: inline-block;
      background: rgba(212, 175, 55, 0.1);
      border: 1px solid var(--accent-gold);
      color: var(--accent-gold);
      padding: 0.25rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 600;
      border-radius: 20px;
      text-transform: uppercase;
      margin-bottom: 1rem;
    }
    .post-header h1 {
      font-size: 2.75rem;
      line-height: 1.2;
      margin-bottom: 1rem;
      color: var(--text-primary);
    }
    .post-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--text-secondary);
      font-size: 0.95rem;
    }
    .meta-separator {
      color: var(--text-muted);
    }
    .post-cover {
      width: 100%;
      height: 400px;
      border-radius: var(--border-radius-md);
      overflow: hidden;
      margin-bottom: 3rem;
      border: 1px solid var(--border-color);
    }
    .post-cover img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .post-content {
      font-size: 1.1rem;
      line-height: 1.8;
      color: #e5e7eb;
    }
    .post-content ::ng-deep p {
      margin-bottom: 1.5rem;
    }
    .post-content ::ng-deep h2 {
      font-size: 1.8rem;
      margin: 2.5rem 0 1rem;
      color: var(--text-primary);
    }
    .loading-state,
    .error-state {
      text-align: center;
      padding: 4rem 2rem;
    }
    .error-state h2 {
      margin-bottom: 1rem;
      color: #f87171;
    }
    .error-state p {
      color: var(--text-secondary);
      margin-bottom: 2rem;
    }
  `]
})
export class BlogPostViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private blogService = inject(BlogService);
  private sanitizer = inject(DomSanitizer);

  post: BlogPost | null = null;
  safeHtml: SafeHtml = '';
  loading = true;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.blogService.getBlogPostBySlug(slug).subscribe({
        next: (post) => {
          this.post = post;
          this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(post.contenidoHtml);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          // Preload local mock blog data for testing
          if (slug === '5-tendencias-de-peinados-para-este-otono') {
            this.post = {
              id: 1,
              titulo: '5 Tendencias de Peinados para este Otoño',
              slug: '5-tendencias-de-peinados-para-este-otono',
              contenidoHtml: `
                <p>Este otoño llega cargado de melenas texturizadas, cortes bob desestructurados y peinados que evocan naturalidad y movimiento.</p>
                <h2>1. El Corte Bob Desfilado</h2>
                <p>El clásico corte bob se reinventa esta temporada con puntas desfiladas y capas finas que aportan volumen sin apelmazar el cabello.</p>
                <h2>2. Flequillos "Cortina"</h2>
                <p>Un flequillo versátil que se abre a la mitad, adaptándose a cualquier forma de rostro y aportando un aire desenfadado y juvenil.</p>
              `,
              resumen: 'Conoce los cortes y colores que triunfarán en la nueva temporada y cómo adaptarlos a tus rasgos.',
              categoria: { nombre: 'Tendencias', tipo: 'BLOG' },
              estado: 'PUBLICADO',
              fechaPublicacion: new Date().toISOString()
            };
            this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(this.post.contenidoHtml);
          } else if (slug === 'guia-completa-para-cuidar-el-cabello-seco') {
            this.post = {
              id: 2,
              titulo: 'Guía Completa para Cuidar el Cabello Seco',
              slug: 'guia-completa-para-cuidar-el-cabello-seco',
              contenidoHtml: `
                <p>El cabello seco requiere una nutrición molecular intensiva, evitando sulfatos agresivos y sellando las puntas con aceites esenciales.</p>
                <h2>Rutina de Cuidado Recomendada</h2>
                <p>Usa mascarillas hidratantes que contengan manteca de karité, aceite de argán o queratina hidrolizada una vez a la semana.</p>
              `,
              resumen: 'Aprende los mejores rituales y productos profesionales recomendados para devolverle el brillo y la suavidad a tu cabello.',
              categoria: { nombre: 'Cuidado Capilar', tipo: 'BLOG' },
              estado: 'PUBLICADO',
              fechaPublicacion: new Date(Date.now() - 86400000 * 2).toISOString()
            };
            this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(this.post.contenidoHtml);
          }
        }
      });
    } else {
      this.loading = false;
    }
  }
}
