import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MediaFile } from '../models/media.model';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/media';

  getAllMedia(): Observable<MediaFile[]> {
    return this.http.get<MediaFile[]>(this.apiUrl);
  }

  getMediaById(id: number): Observable<MediaFile> {
    return this.http.get<MediaFile>(`${this.apiUrl}/${id}`);
  }

  uploadFile(file: File, identificador?: string): Observable<MediaFile> {
    const formData = new FormData();
    formData.append('file', file);
    if (identificador) {
      formData.append('identificador', identificador);
    }
    return this.http.post<MediaFile>(`${this.apiUrl}/upload`, formData);
  }

  deleteMedia(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
