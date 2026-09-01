import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MediaFile } from '../models/media-file.model';

interface MediaFileResponse extends Omit<MediaFile, 'uploadedAt'> {
  fechaSubida?: string;
  uploadedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl.replace(/\/api\/v1$/, '/api/media');

  upload(file: File): Observable<MediaFile> {
    return this.uploadFile(file);
  }

  uploadFile(file: File, identificador?: string): Observable<MediaFile> {
    const formData = new FormData();
    formData.append('file', file);
    if (identificador) {
      formData.append('identificador', identificador);
    }
    return this.http.post<MediaFileResponse>(`${this.apiUrl}/upload`, formData, { responseType: 'json' }).pipe(
      map((media) => this.toMediaFile(media))
    );
  }

  list(): Observable<MediaFile[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map((res) => {
        const extractList = (response: any): any[] => Array.isArray(response) ? response : (response?.content || response?.data || []);
        const items = extractList(res);
        return items.map((item) => this.toMediaFile(item));
      })
    );
  }

  getMediaFiles(): Observable<MediaFile[]> {
    return this.list();
  }

  getAllMedia(): Observable<MediaFile[]> {
    return this.list();
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  deleteMedia(id: number): Observable<void> {
    return this.delete(id);
  }

  private toMediaFile(media: any): MediaFile {
    if (!media) {
      const now = new Date().toISOString();
      return { id: 0, filename: 'archivo', url: '', uploadedAt: now, fechaSubida: now };
    }
    const dateStr = media.uploadedAt || media.fechaSubida || new Date().toISOString();
    const rawUrl = media.url || (media.storedFilename ? `/api/media/${media.storedFilename}` : '');
    return {
      ...media,
      id: media.id ?? 0,
      filename: media.filename || media.nombre || 'archivo',
      storedFilename: media.storedFilename || '',
      contentType: media.contentType || media.fileType || '',
      fechaSubida: dateStr,
      uploadedAt: dateStr,
      url: this.buildAbsoluteUrl(rawUrl)
    };
  }

  private buildAbsoluteUrl(rawUrl?: string): string {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
    let base = window.location.origin;
    if (environment.apiUrl && (environment.apiUrl.startsWith('http://') || environment.apiUrl.startsWith('https://'))) {
      try {
        base = new URL(environment.apiUrl).origin;
      } catch {
        base = window.location.origin;
      }
    }
    return new URL(rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`, base).toString();
  }
}
