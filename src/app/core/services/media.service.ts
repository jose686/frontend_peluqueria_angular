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
    return this.http.post<any>(`${this.apiUrl}/upload`, formData, { responseType: 'json' }).pipe(
      map((res) => this.normalizeMediaFile(res))
    );
  }

  list(): Observable<MediaFile[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map((res) => {
        const extractList = (response: any): any[] => Array.isArray(response) ? response : (response?.content || response?.data || []);
        const items = extractList(res);
        return items.map((item) => this.normalizeMediaFile(item));
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

  normalizeMediaFile(mediaResponse: any): MediaFile {
    let raw = (mediaResponse && typeof mediaResponse === 'object')
      ? (mediaResponse.data || mediaResponse.content || mediaResponse.result || mediaResponse.item || mediaResponse)
      : mediaResponse;

    if (Array.isArray(raw)) {
      raw = raw[0];
    }

    if (!raw || typeof raw !== 'object') {
      const now = new Date().toISOString();
      return { id: 0, filename: 'archivo', url: '', uploadedAt: now, fechaSubida: now };
    }
    const dateStr = raw.uploadedAt || raw.fechaSubida || new Date().toISOString();
    const rawUrl = raw.url || (raw.storedFilename ? `/api/media/${raw.storedFilename}` : '');
    return {
      ...raw,
      id: raw.id ?? 0,
      filename: raw.filename || raw.nombre || raw.storedFilename || 'archivo',
      storedFilename: raw.storedFilename || '',
      contentType: raw.contentType || raw.fileType || '',
      fechaSubida: dateStr,
      uploadedAt: dateStr,
      url: this.buildAbsoluteUrl(rawUrl)
    };
  }

  toMediaFile(mediaResponse: any): MediaFile {
    return this.normalizeMediaFile(mediaResponse);
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
