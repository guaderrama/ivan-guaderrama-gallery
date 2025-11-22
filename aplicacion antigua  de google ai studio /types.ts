
export const CATEGORIES = ['ORIGINAL', 'LIMITED EDITION', 'MINI ORIGINAL', 'MINI ORIGINAL SPECIAL', 'METAL SCULPTURE', 'WALL SCULPTURE', 'GLASS SCULPTURE'] as const;
export type ProductCategory = typeof CATEGORIES[number];

export interface Product {
  id: number;
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
}

export type NewProduct = Omit<Product, 'id'>;

export interface ShippingSettings {
    costoGuiaUSA: number;
    costoPorKiloUSA: number;
    costoGuiaCanada: number;
    costoPorKiloCanada: number;
    tasaSeguro: number;
    divisorIVA: number;
    divisorVolumetrico: number;
}

export interface Edition {
  id: string; // Composite key: e.g., `${productSku}-${editionNumber}`
  editionNumber: number;
  comments: string;
  exhibitionLocation: string;
  gallerySeller: string;
  clientName: string;
  salesInvoice: string;
}

export interface NumberedProduct {
  sku: string; // Using SKU as the product identifier
  name: string;
  imageUrl?: string;
  totalEditions: number;
  editions: Edition[];
}

export interface NewNumberedProductData {
    sku: string;
    name: string;
    imageUrl?: string;
    totalEditions: number;
}

export interface MiniWork {
  id: number;
  name: string;
  sku: string;
  imageUrl?: string;
  archived?: boolean;
}

export type NewMiniWork = Omit<MiniWork, 'id'>;
