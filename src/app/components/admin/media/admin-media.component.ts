import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { forkJoin, finalize } from 'rxjs';
import { MediaFile } from '../../../core/models/media-file.model';
import { MediaService } from '../../../core/services/media.service';

@Component({
  selector: 'app-admin-media', standalone: true, imports: [CommonModule],
  template: `
    <div class="media-manager fade-in-el">
      <div class="media-header"><h2>Biblioteca de Medios</h2><p>Sube imágenes para tus portadas y artículos. Haz clic en una imagen para copiar su URL.</p></div>
      <div class="drag-drop-zone" [class.drag-over]="isDragOver" [class.disabled]="uploading" (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)" (drop)="onDrop($event)" (click)="!uploading && fileInput.click()">
        <input #fileInput type="file" hidden accept="image/jpeg,image/png,image/webp" multiple (change)="onFileSelected($event)" />
        <span class="upload-icon">📁</span><p class="main-text">Arrastra imágenes aquí o haz clic para buscarlas</p><p class="sub-text">Formatos permitidos: JPG, PNG y WEBP. Máx. 10 MB.</p>
      </div>
      @if (uploading) { <p class="status">Subiendo imágenes...</p> }
      @if (errorMessage) { <p class="status error">{{ errorMessage }}</p> }
      @if (noticeMessage) { <p class="status">{{ noticeMessage }}</p> }
      <div class="media-gallery">
        @for (file of mediaFiles; track file.id) {
          <article class="media-card glass-card" (click)="copyUrl(file)">
            <div class="media-preview"><img [src]="file.url" [alt]="file.filename" /><div class="media-overlay"><span>Copiar URL</span></div></div>
            <div class="media-meta"><button class="media-id" type="button" (click)="copyId($event, file)" title="Copiar ID">ID: {{ file.id }}</button><button class="delete-btn" type="button" (click)="deleteFile($event, file)" title="Eliminar imagen">🗑️</button></div>
          </article>
        } @empty { @if (!loading) { <div class="empty-gallery"><p>La biblioteca de medios está vacía. ¡Sube tu primera imagen!</p></div> } }
      </div>
    </div>`,
  styles: [`
    .media-manager{display:flex;flex-direction:column;gap:2rem}.media-header h2{font-size:1.5rem;margin-bottom:.5rem}.media-header p,.sub-text,.empty-gallery{color:var(--text-secondary)}.drag-drop-zone{border:2px dashed rgba(212,175,55,.3);border-radius:var(--border-radius-md);padding:3rem 2rem;text-align:center;cursor:pointer;transition:.3s}.drag-drop-zone:hover,.drag-drop-zone.drag-over{background:rgba(212,175,55,.03);border-color:var(--accent-gold)}.drag-drop-zone.disabled{cursor:wait;opacity:.65}.upload-icon{display:block;font-size:3rem;margin-bottom:1rem}.main-text{font-family:var(--font-heading);font-weight:600;margin-bottom:.5rem}.sub-text{font-size:.85rem}.status{color:var(--accent-gold);font-weight:600;text-align:center;margin:0}.status.error{color:#e57373}.media-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1.5rem}.media-card{border:0;border-radius:var(--border-radius-sm);cursor:pointer;overflow:hidden}.media-preview{background:#000;height:140px;position:relative}.media-preview img{height:100%;object-fit:cover;width:100%}.media-overlay{align-items:center;background:rgba(0,0,0,.7);display:flex;inset:0;justify-content:center;opacity:0;position:absolute;transition:opacity .2s}.media-card:hover .media-overlay{opacity:1}.media-overlay span{border:1px solid var(--accent-gold);border-radius:4px;color:var(--accent-gold);padding:.4rem .8rem}.media-meta{align-items:center;background:rgba(0,0,0,.2);border-top:1px solid var(--border-color);display:flex;justify-content:space-between;padding:.75rem}.media-id,.delete-btn{background:none;border:0;cursor:pointer;padding:.2rem}.media-id{color:var(--text-secondary);font-size:.8rem}.media-id:hover{color:var(--accent-gold);text-decoration:underline}.delete-btn:hover{transform:scale(1.2)}.empty-gallery{grid-column:1/-1;padding:3rem;text-align:center}
  `]
})
export class AdminMediaComponent implements OnInit {
  private readonly mediaService = inject(MediaService);
  private readonly allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  private readonly maxFileSize = 10 * 1024 * 1024;
  mediaFiles: MediaFile[] = []; isDragOver = false; loading = false; uploading = false; errorMessage = ''; noticeMessage = '';

  ngOnInit(): void { this.loadMedia(); }
  loadMedia(): void {
    this.loading = true; this.errorMessage = '';
    this.mediaService.getMediaFiles().pipe(finalize(() => this.loading = false)).subscribe({
      next: files => {
        console.log('Medios recibidos del backend:', files);
        this.mediaFiles = (files || []).sort((a, b) => {
          const dateA = String(a?.uploadedAt || a?.fechaSubida || '');
          const dateB = String(b?.uploadedAt || b?.fechaSubida || '');
          return dateB.localeCompare(dateA);
        });
      },
      error: error => {
        console.error('Error detallado al cargar medios:', error);
        this.mediaFiles = [];
        this.errorMessage = this.errorFrom(error, 'No se pudo cargar la biblioteca de medios.');
      }
    });
  }
  onDragOver(event: DragEvent): void { event.preventDefault(); if (!this.uploading) this.isDragOver = true; }
  onDragLeave(event: DragEvent): void { event.preventDefault(); this.isDragOver = false; }
  onDrop(event: DragEvent): void { event.preventDefault(); this.isDragOver = false; if (!this.uploading) this.uploadFiles(Array.from(event.dataTransfer?.files ?? [])); }
  onFileSelected(event: Event): void { const input = event.target as HTMLInputElement; this.uploadFiles(Array.from(input.files ?? [])); input.value = ''; }
  copyUrl(file: MediaFile): void { this.copy(file.url, 'URL copiada al portapapeles.'); }
  copyId(event: MouseEvent, file: MediaFile): void { event.stopPropagation(); this.copy(String(file.id), 'ID copiado al portapapeles.'); }
  deleteFile(event: MouseEvent, file: MediaFile): void {
    event.stopPropagation(); if (!confirm(`¿Eliminar la imagen "${file.filename}"?`)) return; this.errorMessage = '';
    this.mediaService.delete(file.id).subscribe({ next: () => { this.mediaFiles = this.mediaFiles.filter(item => item.id !== file.id); this.noticeMessage = 'Imagen eliminada.'; }, error: error => this.errorMessage = this.errorFrom(error, 'No se pudo eliminar la imagen.') });
  }
  private uploadFiles(files: File[]): void {
    const invalid = files.find(file => !this.allowedTypes.has(file.type) || file.size > this.maxFileSize);
    if (invalid) { this.errorMessage = `"${invalid.name}" no es JPG, PNG o WEBP, o supera 10 MB.`; return; }
    if (!files.length) return;
    this.uploading = true; this.errorMessage = ''; this.noticeMessage = '';
    forkJoin(files.map(file => this.mediaService.upload(file))).pipe(finalize(() => { this.uploading = false; this.isDragOver = false; })).subscribe({
      next: uploaded => {
        this.errorMessage = '';
        const rawList = Array.isArray(uploaded) ? uploaded.flat() : [uploaded];
        const validList = rawList.filter((item): item is MediaFile => !!item && typeof item === 'object');
        if (validList.length > 0) {
          const existingIds = new Set(this.mediaFiles.map(f => f.id));
          const newItems = validList.filter(f => !existingIds.has(f.id));
          this.mediaFiles = [...newItems, ...this.mediaFiles];
          this.noticeMessage = `${validList.length} imagen(es) subida(s).`;
        }
        this.loadMedia();
      },
      error: error => {
        console.error('Error subiendo imagen:', error);
        this.errorMessage = this.errorFrom(error, 'No se pudo subir una de las imágenes.');
      }
    });
  }
  private copy(value: string, message: string): void { navigator.clipboard.writeText(value).then(() => this.noticeMessage = message).catch(() => this.errorMessage = 'No se pudo copiar al portapapeles.'); }
  private errorFrom(error: { error?: { message?: string } }, fallback: string): string { return error.error?.message ?? fallback; }
}
