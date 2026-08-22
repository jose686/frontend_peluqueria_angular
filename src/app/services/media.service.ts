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
  private backendUrl = environment.apiUrl.replace(/\/api\/v1$/, '');

  getAllMedia(): Observable<MediaFile[]> {
    return this.http.get<MediaFile[]>(this.apiUrl).pipe(map(files => files.map(file => this.withAbsoluteUrl(file))));
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

  deleteMedia(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  private withAbsoluteUrl(file: MediaFile): MediaFile {
    return { ...file, url: new URL(file.url, `${this.backendUrl}/`).toString() };
  }
}
