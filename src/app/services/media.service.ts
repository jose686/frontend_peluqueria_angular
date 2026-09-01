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
    return this.http.get<MediaFile[]>(this.apiUrl).pipe(map(files => files.map(file => this.withAbsoluteUrl(file))));
  }

  getMediaFiles(): Observable<MediaFile[]> {
    return this.getAllMedia();
  }

  list(): Observable<MediaFile[]> {
    return this.getAllMedia();
  }

  getMediaById(id: number): Observable<MediaFile> {
    return this.http.get<MediaFile>(`${this.apiUrl}/${id}`).pipe(map(file => this.withAbsoluteUrl(file)));
  }

  uploadFile(file: File, identificador?: string): Observable<MediaFile> {
    const formData = new FormData();
    formData.append('file', file);
    if (identificador) {
      formData.append('identificador', identificador);
    }
    return this.http.post<MediaFile>(`${this.apiUrl}/upload`, formData).pipe(map(file => this.withAbsoluteUrl(file)));
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

  private withAbsoluteUrl(file: MediaFile): MediaFile {
    return { ...file, url: this.buildAbsoluteUrl(file.url) };
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
