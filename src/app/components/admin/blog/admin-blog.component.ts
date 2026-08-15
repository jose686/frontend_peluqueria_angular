import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BlogService } from '../../../services/blog.service';
import { CatalogService } from '../../../services/catalog.service';
import { MediaService } from '../../../services/media.service';
import { BlogPost, BlogPostRequest } from '../../../models/blog.model';
import { Category } from '../../../models/category.model';
import { MediaFile } from '../../../models/media.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-admin-blog',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  template: `
    <div class="blog-manager fade-in-el">
      <div class="manager-header">
        <h2>Gestor del Blog</h2>
        <button (click)="openCreateForm()" class="btn btn-primary btn-sm">Nuevo Artículo</button>
      </div>

      <div class="manager-layout">
        <!-- Blog Posts List -->
        <div class="table-container glass-panel">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th>Fecha de Publicación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (post of posts; track post.id) {
                <tr>
                  <td>
                    <strong>{{ post.titulo }}</strong>
                    <br/><small class="text-muted">{{ post.slug }}</small>
                  </td>
                  <td>{{ post.categoria.nombre }}</td>
                  <td>
                    <span class="badge" [class]="post.estado === 'PUBLICADO' ? 'badge-confirmed' : 'badge-pending'">
                      {{ post.estado }}
                    </span>
                  </td>
                  <td>{{ post.fechaPublicacion ? (post.fechaPublicacion | date:'dd/MM/yyyy HH:mm') : '-' }}</td>
                  <td>
                    <button (click)="editPost(post)" class="action-btn edit" title="Editar">✏️</button>
                    <button (click)="deletePost(post.id!)" class="action-btn delete" title="Eliminar">🗑️</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" style="text-align: center;">No hay artículos registrados.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Form Panel -->
        @if (showForm) {
          <div class="form-sidebar glass-panel">
            <h3>{{ editingPostId ? 'Editar Artículo' : 'Nuevo Artículo' }}</h3>
            
            <form [formGroup]="postForm" (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label class="form-label" for="titulo">Título *</label>
                <input type="text" id="titulo" formControlName="titulo" class="form-control" required />
              </div>

              <div class="form-group">
                <label class="form-label" for="categoriaId">Categoría *</label>
                <select id="categoriaId" formControlName="categoriaId" class="form-control" required>
                  <option value="">Selecciona categoría</option>
                  @for (cat of categories; track cat.id) {
                    <option [value]="cat.id">{{ cat.nombre }}</option>
                  }
                </select>
              </div>

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
                <label class="form-label" for="resumen">Resumen / Extracto</label>
                <textarea id="resumen" formControlName="resumen" class="form-control" rows="2" placeholder="Breve resumen del post..."></textarea>
              </div>

              <div class="form-group">
                <label class="form-label" for="contenidoHtml">Contenido HTML *</label>
                <textarea id="contenidoHtml" formControlName="contenidoHtml" class="form-control" rows="8" placeholder="<p>Contenido del post...</p>" required></textarea>
              </div>

              <div class="form-group">
                <label class="form-label" for="estado">Estado *</label>
                <select id="estado" formControlName="estado" class="form-control" required>
                  <option value="BORRADOR">Borrador</option>
                  <option value="PUBLICADO">Publicado</option>
                </select>
              </div>

              <div class="form-actions">
                <button type="submit" [disabled]="postForm.invalid" class="btn btn-primary">Guardar</button>
                <button type="button" (click)="closeForm()" class="btn btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .blog-manager {
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
        grid-template-columns: 1.1fr 0.9fr;
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
export class AdminBlogComponent implements OnInit {
  private blogService = inject(BlogService);
  private catalogService = inject(CatalogService);
  private mediaService = inject(MediaService);
  private fb = inject(FormBuilder);

  posts: BlogPost[] = [];
  categories: Category[] = [];
  mediaFiles: MediaFile[] = [];

  showForm = false;
  editingPostId: number | null = null;

  postForm: FormGroup = this.fb.group({
    titulo: ['', [Validators.required]],
    categoriaId: ['', [Validators.required]],
    portadaId: [null],
    resumen: [''],
    contenidoHtml: ['', [Validators.required]],
    estado: ['BORRADOR', [Validators.required]]
  });

  ngOnInit(): void {
    this.loadPosts();
    this.loadBlogCategories();
    this.loadMedia();
  }

  loadPosts(): void {
    this.blogService.getAllBlogPosts(true).subscribe({
      next: (data) => {
        this.posts = data;
      },
      error: () => {
        this.loadMockPosts();
      }
    });
  }

  private loadMockPosts(): void {
    this.posts = [
      { id: 1, titulo: '5 Tendencias de Peinados para este Otoño', slug: '5-tendencias-de-peinados-para-este-otono', resumen: 'Tendencias otoñales.', contenidoHtml: '<p>Contenido</p>', categoria: { id: 3, nombre: 'Tendencias', tipo: 'BLOG' }, estado: 'PUBLICADO', fechaPublicacion: new Date().toISOString() }
    ];
  }

  loadBlogCategories(): void {
    this.catalogService.getCategoriesByTipo('BLOG').subscribe(data => {
      this.categories = data;
      if (this.categories.length === 0) {
        this.categories = [
          { id: 3, nombre: 'Tendencias', tipo: 'BLOG' },
          { id: 4, nombre: 'Cuidado Capilar', tipo: 'BLOG' }
        ];
      }
    });
  }

  loadMedia(): void {
    this.mediaService.getAllMedia().subscribe(data => {
      this.mediaFiles = data;
    });
  }

  openCreateForm(): void {
    this.editingPostId = null;
    this.postForm.reset({
      titulo: '',
      categoriaId: '',
      portadaId: null,
      resumen: '',
      contenidoHtml: '',
      estado: 'BORRADOR'
    });
    this.showForm = true;
  }

  editPost(post: BlogPost): void {
    this.editingPostId = post.id!;
    this.postForm.patchValue({
      titulo: post.titulo,
      categoriaId: post.categoria?.id || '',
      portadaId: post.portada?.id || null,
      resumen: post.resumen,
      contenidoHtml: post.contenidoHtml,
      estado: post.estado
    });
    this.showForm = true;
  }

  onSubmit(): void {
    if (this.postForm.valid) {
      const val = this.postForm.value;
      const req: BlogPostRequest = {
        titulo: val.titulo,
        categoriaId: Number(val.categoriaId),
        portadaId: val.portadaId ? Number(val.portadaId) : null,
        resumen: val.resumen,
        contenidoHtml: val.contenidoHtml,
        estado: val.estado
      };

      if (this.editingPostId) {
        this.blogService.updateBlogPost(this.editingPostId, req).subscribe({
          next: () => {
            this.loadPosts();
            this.closeForm();
          },
          error: (err) => alert('Error al guardar: ' + (err.error?.error || 'error desconocido'))
        });
      } else {
        this.blogService.createBlogPost(req).subscribe({
          next: () => {
            this.loadPosts();
            this.closeForm();
          },
          error: (err) => alert('Error al crear: ' + (err.error?.error || 'error desconocido'))
        });
      }
    }
  }

  deletePost(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este artículo de blog?')) {
      this.blogService.deleteBlogPost(id).subscribe({
        next: () => {
          this.loadPosts();
        },
        error: (err) => alert('Error al eliminar: ' + (err.error?.error || 'error desconocido'))
      });
    }
  }

  closeForm(): void {
    this.showForm = false;
    this.editingPostId = null;
  }
}
