export interface MediaFile {
  id?: number;
  identificador: string;
  filename: string;
  fileType: 'IMAGE' | 'VIDEO' | string;
  url: string;
  fechaSubida?: string;
}
