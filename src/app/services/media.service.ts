import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { MediaFile } from '../models/media.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl.replace(/\/api\/v1$/, '/api/media');

  getAllMedia(): Observable<MediaFile[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => {
        const extractList = (response: any): any[] => Array.isArray(response) ? response : (response?.content || response?.data || []);
        const items = extractList(res);
        return items.map(file => this.withAbsoluteUrl(file));
      })
    );
  }

  getMediaFiles(): Observable<MediaFile[]> {
    return this.getAllMedia();
  }

  list(): Observable<MediaFile[]> {
    return this.getAllMedia();
  }

  getMediaById(id: number): Observable<MediaFile> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map(file => this.normalizeMediaFile(file)));
  }

  uploadFile(file: File, identificador?: string): Observable<MediaFile> {
    const formData = new FormData();
    formData.append('file', file);
    if (identificador) {
      formData.append('identificador', identificador);
    }
    return this.http.post<any>(`${this.apiUrl}/upload`, formData, { responseType: 'json' }).pipe(map(res => this.normalizeMediaFile(res)));
  }

  upload(file: File): Observable<MediaFile> {
    return this.uploadFile(file);
  }

  deleteMedia(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  delete(id: number): Observable<any> {
    return this.deleteMedia(id);
  }

  normalizeMediaFile(res: any): MediaFile {
    let file = (res && typeof res === 'object')
      ? (res.data || res.content || res.result || res.item || res)
      : res;

    if (Array.isArray(file)) {
      file = file[0];
    }

    if (!file || typeof file !== 'object') {
      return { id: 0, identificador: '', filename: 'archivo', fileType: 'IMAGE', url: '', fechaSubida: new Date().toISOString() };
    }
    const dateStr = file.fechaSubida || file.uploadedAt || new Date().toISOString();
    const rawUrl = file.url || (file.storedFilename ? `/api/media/${file.storedFilename}` : '');
    return {
      ...file,
      id: file.id ?? 0,
      identificador: file.identificador || '',
      filename: file.filename || file.nombre || file.storedFilename || 'archivo',
      storedFilename: file.storedFilename || '',
      contentType: file.contentType || file.fileType || '',
      fileType: file.fileType || 'IMAGE',
      fechaSubida: dateStr,
      url: this.buildAbsoluteUrl(rawUrl)
    };
  }

  private withAbsoluteUrl(res: any): MediaFile {
    return this.normalizeMediaFile(res);
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
