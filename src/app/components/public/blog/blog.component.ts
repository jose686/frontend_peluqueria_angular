import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BlogService } from '../../../services/blog.service';
import { BlogPost } from '../../../models/blog.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="blog-header">
      <h1>Blog de Tendencias</h1>
      <p>Descubre los mejores consejos de estilismo, cuidado del cabello y últimas tendencias de moda.</p>
    </div>

    <div class="blog-grid">
      @for (post of blogPosts; track post.id) {
        <article class="blog-card glass-card">
          <div class="blog-cover-wrapper">
            @if (post.portada) {
              <img [src]="post.portada.url" [alt]="post.titulo" class="blog-img" />
            } @else {
              <div class="blog-img-placeholder">📖</div>
            }
            <span class="blog-category">{{ post.categoria.nombre }}</span>
          </div>
          <div class="blog-info">
            <span class="blog-date">{{ post.fechaPublicacion | date:'dd MMM yyyy' }}</span>
            <h3>{{ post.titulo }}</h3>
            <p class="blog-excerpt">{{ post.resumen || 'Lee nuestro último artículo para estar al día de las últimas novedades...' }}</p>
            <a [routerLink]="['/blog', post.slug]" class="read-more-link">Leer más &rarr;</a>
          </div>
        </article>
      } @empty {
        <div class="empty-state">
          <p>No hay artículos de blog publicados en este momento.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: min(calc(100% - 2rem), 1200px);
      margin: 0 auto;
    }
    .blog-header {
      margin-bottom: 3rem;
      text-align: center;
    }
    .blog-header h1 {
      font-size: 2.5rem;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }
    .blog-header p {
      color: var(--text-secondary);
      font-size: 1.1rem;
      max-width: 600px;
      margin: 0 auto;
    }
    .blog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 2.5rem;
    }
    @media (max-width: 700px) {
      :host { width: min(calc(100% - 1.25rem), 1200px); }
      .blog-grid { grid-template-columns: 1fr; gap: 1.25rem; }
    }
    .blog-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    .blog-cover-wrapper {
      position: relative;
      height: 200px;
      background: var(--bg-tertiary);
    }
    .blog-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .blog-img-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      font-size: 3rem;
      background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
    }
    .blog-category {
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
    .blog-info {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
    .blog-date {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
      text-transform: uppercase;
    }
    .blog-info h3 {
      font-size: 1.25rem;
      margin-bottom: 0.75rem;
      line-height: 1.3;
    }
    .blog-excerpt {
      font-size: 0.9rem;
      color: var(--text-secondary);
      margin-bottom: 1.5rem;
      flex-grow: 1;
      line-height: 1.6;
    }
    .read-more-link {
      font-family: var(--font-heading);
      color: var(--accent-gold);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95rem;
      transition: transform 0.2s ease, color 0.2s ease;
      align-self: flex-start;
    }
    .read-more-link:hover {
      color: var(--accent-gold-hover);
      transform: translateX(4px);
    }
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem;
      color: var(--text-secondary);
    }
  `]
})
export class BlogComponent implements OnInit {
  private blogService = inject(BlogService);
  blogPosts: BlogPost[] = [];

  ngOnInit(): void {
    this.blogService.getAllBlogPosts(false).subscribe({
      next: (posts) => {
        this.blogPosts = posts;
      },
      error: () => {
        this.blogPosts = [];
      }
    });
  }
}
