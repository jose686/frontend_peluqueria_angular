import { MediaFile } from './media.model';
import { Category } from './category.model';

export interface CatalogItem {
  id?: number;
  nombre: string;
  slug?: string;
  descripcion?: string;
  precio: number;
  tipo: 'SERVICIO' | 'PRODUCTO' | string;
  duracionMinutos?: number;
  stock?: number;
  portada?: MediaFile;
  categoria: Category;
  activo: boolean;
}

export interface CatalogItemRequest {
  nombre: string;
  slug?: string;
  descripcion?: string;
  precio: number;
  tipo: 'SERVICIO' | 'PRODUCTO' | string;
  duracionMinutos?: number | null;
  stock?: number | null;
  portadaId?: number | null;
  categoriaId: number | null;
  activo?: boolean;
}

export interface ServiceItemDto {
  id: string; // UUID
  nombre: string;
  precio: number;
  duracionMinutos: number;
}

export interface ServiceItemRequest {
  nombre: string;
  precio: number;
  duracionMinutos: number;
}
