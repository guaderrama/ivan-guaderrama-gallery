export const CATEGORIES = [
  'ORIGINAL',
  'LIMITED EDITION',
  'MINI ORIGINAL',
  'MINI ORIGINAL SPECIAL',
  'METAL SCULPTURE',
  'WALL SCULPTURE',
  'GLASS SCULPTURE'
] as const;

export type ProductCategory = typeof CATEGORIES[number];

export type ArtworkStatus = 'active' | 'archived' | 'deleted';

export interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  detalles: string;
  precioUSD: number;
  medidas: string;
  peso: number;
  sku: string;
  imagenUrl?: string;
  interactiva: boolean;
  medidasCaja: string;
  costoEnvioUSA: number;
  costoEnvioCanada: number;
  category: ProductCategory;
  vendido?: boolean;
  galeria?: boolean;
  bodega?: boolean;
  // Firebase fields
  status?: ArtworkStatus;
  createdAt?: Date | { seconds: number; nanoseconds: number };
  updatedAt?: Date | { seconds: number; nanoseconds: number };
}

export type NewProduct = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

export interface FirestoreProduct extends Omit<Product, 'id'> {
  status: ArtworkStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingSettings {
  costoGuiaUSA: number;
  costoPorKiloUSA: number;
  costoGuiaCanada: number;
  costoPorKiloCanada: number;
  tasaSeguro: number;
  divisorIVA: number;
  divisorVolumetrico: number;
}
