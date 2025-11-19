export interface Edition {
  id: string;
  editionNumber: number;
  comments: string;
  exhibitionLocation: string;
  gallerySeller: string;
  clientName: string;
  salesInvoice: string;
}

export interface NumberedProduct {
  sku: string;
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
