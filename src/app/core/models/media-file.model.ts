export interface MediaFile {
  id: number;
  identificador?: string;
  filename: string;
  storedFilename?: string;
  contentType?: string;
  size?: number;
  fileType?: string;
  url: string;
  uploadedAt: string;
  fechaSubida?: string;
}
