import { User } from './user.model';
import { MediaFile } from './media.model';
import { Category } from './category.model';

export interface BlogPost {
  id?: number;
  titulo: string;
  slug?: string;
  contenidoHtml: string;
  resumen?: string;
  portada?: MediaFile;
  autor?: User;
  categoria: Category;
  estado: 'BORRADOR' | 'PUBLICADO' | string;
  fechaPublicacion?: string;
}

export interface BlogPostRequest {
  titulo: string;
  slug?: string;
  contenidoHtml: string;
  resumen?: string;
  portadaId?: number | null;
  categoriaId: number;
  estado: 'BORRADOR' | 'PUBLICADO' | string;
}
