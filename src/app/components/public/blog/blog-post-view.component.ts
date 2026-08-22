import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BlogService } from '../../../services/blog.service';
import { BlogPost } from '../../../models/blog.model';
import { DatePipe } from '@angular/common';

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

        <div class="post-content" [innerHTML]="post.contenidoHtml"></div>
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
      width: min(calc(100% - 2rem), 1200px);
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
      aspect-ratio: 16 / 9;
      border-radius: var(--border-radius-md);
      overflow: hidden;
      margin-bottom: 3rem;
      border: 1px solid var(--border-color);
    }
    .post-cover img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .post-content {
      font-size: 1.1rem;
      line-height: 1.8;
      color: #e5e7eb;
    }
    ::ng-deep .post-content img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      display: block;
      margin: 1.5rem auto;
      object-fit: cover;
    }
    @media (max-width: 700px) {
      .post-container { width: min(calc(100% - 1.25rem), 1200px); }
      .post-cover { margin-bottom: 2rem; }
      .post-header h1 { font-size: 2rem; }
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

  post: BlogPost | null = null;
  loading = true;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.blogService.getBlogPostBySlug(slug).subscribe({
        next: (post) => {
          this.post = post;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }
}
