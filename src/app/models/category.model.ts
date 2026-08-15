export interface Category {
  id?: number;
  nombre: string;
  slug?: string;
  tipo: 'SERVICIO' | 'PRODUCTO' | 'BLOG' | string;
}
