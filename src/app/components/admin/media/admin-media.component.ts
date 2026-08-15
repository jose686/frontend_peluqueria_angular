import { Component, OnInit, inject } from '@angular/core';
import { MediaService } from '../../../services/media.service';
import { MediaFile } from '../../../models/media.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-media',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="media-manager fade-in-el">
      <div class="media-header">
        <h2>Biblioteca de Medios</h2>
        <p>Sube imágenes o vídeos para tus portadas y artículos de blog. Haz clic en una tarjeta para copiar su URL o identificador.</p>
      </div>

      <!-- Drag & Drop Zone -->
      <div 
        class="drag-drop-zone"
        [class.drag-over]="isDragOver"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="fileInput.click()"
      >
        <input 
          type="file" 
          #fileInput 
          (change)="onFileSelected($event)" 
          style="display: none" 
          accept="image/*,video/*"
          multiple 
        />
        <div class="drop-zone-content">
          <span class="upload-icon">📁</span>
          <p class="main-text">Arrastra tus archivos aquí o haz clic para buscarlos</p>
          <p class="sub-text">Formatos permitidos: JPG, PNG, WEBP, MP4. Máx. 10MB.</p>
        </div>
      </div>

      @if (uploading) {
        <div class="upload-progress">
          <p>Subiendo archivo...</p>
        </div>
      }

      <!-- Gallery Grid -->
      <div class="media-gallery">
        @for (file of mediaFiles; track file.id) {
          <div class="media-card glass-card">
            <div class="media-preview" (click)="copyToClipboard(file)">
              @if (file.fileType === 'IMAGE') {
                <img [src]="file.url" [alt]="file.filename" />
              } @else {
                <video [src]="file.url" muted></video>
                <span class="video-indicator">▶️</span>
              }
              <div class="media-overlay">
                <span>Copiar URL</span>
              </div>
            </div>
            
            <div class="media-meta">
              <span class="media-id" (click)="copyIdentificador(file)" title="Hacer clic para copiar ID">ID: {{ file.identificador }}</span>
              <button (click)="deleteFile(file.id!)" class="delete-btn" title="Eliminar archivo">🗑️</button>
            </div>
          </div>
        } @empty {
          <div class="empty-gallery">
            <p>La biblioteca de medios está vacía. ¡Sube tus primeras imágenes!</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .media-manager {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .media-header h2 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    .media-header p {
      color: var(--text-secondary);
      font-size: 0.95rem;
    }
    .drag-drop-zone {
      border: 2px dashed rgba(212, 175, 55, 0.3);
      background: rgba(255, 255, 255, 0.01);
      border-radius: var(--border-radius-md);
      padding: 3rem 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .drag-drop-zone:hover,
    .drag-drop-zone.drag-over {
      background: rgba(212, 175, 55, 0.03);
      border-color: var(--accent-gold);
    }
    .upload-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 1rem;
    }
    .main-text {
      font-family: var(--font-heading);
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .sub-text {
      color: var(--text-muted);
      font-size: 0.85rem;
    }
    .upload-progress {
      text-align: center;
      color: var(--accent-gold);
      font-weight: 600;
    }
    .media-gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1.5rem;
    }
    .media-card {
      display: flex;
      flex-direction: column;
      border-radius: var(--border-radius-sm);
      overflow: hidden;
    }
    .media-preview {
      position: relative;
      height: 140px;
      background: #000;
      cursor: pointer;
    }
    .media-preview img,
    .media-preview video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .video-indicator {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 2rem;
      pointer-events: none;
    }
    .media-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .media-preview:hover .media-overlay {
      opacity: 1;
    }
    .media-overlay span {
      color: var(--accent-gold);
      font-family: var(--font-heading);
      font-weight: 600;
      font-size: 0.9rem;
      border: 1px solid var(--accent-gold);
      padding: 0.4rem 0.8rem;
      border-radius: 4px;
    }
    .media-meta {
      padding: 0.75rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(0,0,0,0.2);
      border-top: 1px solid var(--border-color);
    }
    .media-id {
      font-size: 0.8rem;
      color: var(--text-secondary);
      cursor: pointer;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      max-width: 120px;
    }
    .media-id:hover {
      color: var(--accent-gold);
      text-decoration: underline;
    }
    .delete-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      padding: 0.2rem;
      transition: transform 0.2s ease;
    }
    .delete-btn:hover {
      transform: scale(1.2);
    }
    .empty-gallery {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
    }
  `]
})
export class AdminMediaComponent implements OnInit {
  private mediaService = inject(MediaService);

  mediaFiles: MediaFile[] = [];
  isDragOver = false;
  uploading = false;

  ngOnInit(): void {
    this.loadMedia();
  }

  loadMedia(): void {
    this.mediaService.getAllMedia().subscribe({
      next: (files) => {
        this.mediaFiles = files.sort((a, b) => (b.id || 0) - (a.id || 0));
      },
      error: () => {
        this.mediaFiles = [
          { id: 1, identificador: 'corte-bob-jpg', filename: 'corte-bob.jpg', fileType: 'IMAGE', url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=400' },
          { id: 2, identificador: 'champus-hidratantes-png', filename: 'champus.png', fileType: 'IMAGE', url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=400' }
        ];
      }
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFilesList(files);
    }
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.uploadFilesList(files);
    }
  }

  uploadFilesList(files: FileList): void {
    this.uploading = true;
    let uploadedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const identificador = file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-');
      
      this.mediaService.uploadFile(file, identificador).subscribe({
        next: () => {
          uploadedCount++;
          if (uploadedCount === files.length) {
            this.uploading = false;
            this.loadMedia();
          }
        },
        error: (err) => {
          this.uploading = false;
          alert('Error al subir el archivo: ' + (err.error?.error || file.name));
        }
      });
    }
  }

  copyToClipboard(file: MediaFile): void {
    navigator.clipboard.writeText(file.url).then(() => {
      alert('¡URL copiada al portapapeles!');
    });
  }

  copyIdentificador(file: MediaFile): void {
    navigator.clipboard.writeText(file.identificador).then(() => {
      alert('¡Identificador de medio copiado al portapapeles!');
    });
  }

  deleteFile(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este archivo multimedia?')) {
      this.mediaService.deleteMedia(id).subscribe({
        next: () => {
          this.loadMedia();
        },
        error: (err) => {
          alert('Error al eliminar archivo: ' + (err.error?.error || 'error desconocido'));
        }
      });
    }
  }
}
