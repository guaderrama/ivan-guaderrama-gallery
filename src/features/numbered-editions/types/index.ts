import type { ProductCategory } from '@/features/artwork-management/types';

export type EditionStatus = 'active' | 'archived' | 'deleted';
export type SeriesStatus = 'active' | 'archived' | 'deleted';

export interface Edition {
  id: string;
  name: string;
  sku: string;
  editionNumber: number;
  price: number;
  comments?: string;
  exhibitionLocation?: string;
  gallerySeller?: string;
  clientName?: string;
  salesInvoice?: string;
  status: EditionStatus;
  createdAt: string;
}

export interface NumberedProduct {
  id: string;
  seriesName: string;
  name?: string; // backward compat with existing Firestore data
  sku: string;
  category: ProductCategory;
  description: string;
  basePrice: number;
  imageUrl?: string;
  totalEditions: number;
  editions: Edition[];
  seriesStatus: SeriesStatus;
  createdAt: string;
}

export interface NewNumberedProductData {
  seriesName: string;
  sku: string;
  category: ProductCategory;
  description: string;
  basePrice: number;
  imageUrl?: string;
  totalEditions: number;
}

export interface NewEditionData {
  name: string;
  sku: string;
  editionNumber: number;
  price: number;
  comments?: string;
  exhibitionLocation?: string;
  gallerySeller?: string;
  clientName?: string;
  salesInvoice?: string;
}
