import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MediaFile } from '../models/media-file.model';

interface MediaFileResponse extends Omit<MediaFile, 'uploadedAt'> {
  fechaSubida?: string;
}

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl.replace(/\/api\/v1$/, '/api/media');
  private readonly backendUrl = environment.apiUrl.replace(/\/api\/v1$/, '');

  upload(file: File): Observable<MediaFile> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<MediaFileResponse>(`${this.apiUrl}/upload`, formData).pipe(
      map((media) => this.toMediaFile(media))
    );
  }

  list(): Observable<MediaFile[]> {
    return this.http.get<MediaFileResponse[]>(this.apiUrl).pipe(
      map((mediaFiles) => mediaFiles.map((media) => this.toMediaFile(media)))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private toMediaFile(media: MediaFileResponse): MediaFile {
    return {
      ...media,
      uploadedAt: media.fechaSubida ?? '',
      url: new URL(media.url, `${this.backendUrl}/`).toString()
    };
  }
}
