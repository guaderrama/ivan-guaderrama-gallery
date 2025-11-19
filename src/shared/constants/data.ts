import type { Product, ShippingSettings } from '@/features/artwork-management/types';
import type { NumberedProduct } from '@/features/numbered-editions/types';
import type { MiniWork } from '@/features/mini-works/types';
import { PLACEHOLDER_IMAGE } from './index';

export const initialCatalog: Product[] = [
  {
    id: 1,
    nombre: "Abstract Metal Sculpture",
    descripcion: "A stunning centerpiece that plays with light and shadow. Made from recycled steel, it represents the fluidity of time.",
    detalles: "Hand-polished steel. Marble base.",
    precioUSD: 1200,
    medidas: "60cm x 20cm x 15cm",
    peso: 8.5,
    sku: "ESC-MET-001",
    imagenUrl: PLACEHOLDER_IMAGE,
    interactiva: false,
    medidasCaja: "70cm x 30cm x 25cm",
    costoEnvioUSA: 150,
    costoEnvioCanada: 200,
    category: "METAL SCULPTURE",
    vendido: true,
  },
  {
    id: 2,
    nombre: "Minimalist Oak Desk",
    descripcion: "Crafted from solid oak with clean lines, this desk brings a touch of Scandinavian design to any workspace, fostering focus and creativity.",
    detalles: "Solid oak wood, natural oil finish. Two soft-close drawers.",
    precioUSD: 850,
    medidas: "120cm x 60cm x 75cm",
    peso: 25,
    sku: "DSK-OAK-002",
    imagenUrl: PLACEHOLDER_IMAGE,
    interactiva: true,
    medidasCaja: "130cm x 70cm x 20cm",
    costoEnvioUSA: 250,
    costoEnvioCanada: 320,
    category: "ORIGINAL",
    vendido: false,
  },
];

export const initialShippingSettings: ShippingSettings = {
  costoGuiaUSA: 33,
  costoPorKiloUSA: 8,
  costoGuiaCanada: 55,
  costoPorKiloCanada: 12,
  tasaSeguro: 0.0125,
  divisorIVA: 1.16,
  divisorVolumetrico: 5000,
};

export const initialNumberedProducts: NumberedProduct[] = [
  {
    sku: "ESC-MET-001",
    name: "Abstract Metal Sculpture",
    imageUrl: PLACEHOLDER_IMAGE,
    totalEditions: 10,
    editions: [
      { id: "ESC-MET-001-1", editionNumber: 1, comments: "First of the series.", exhibitionLocation: "Alvaro Obregon Gallery", gallerySeller: "", clientName: "", salesInvoice: "" },
      { id: "ESC-MET-001-2", editionNumber: 2, comments: "On loan for photoshoot.", exhibitionLocation: "Studio A", gallerySeller: "", clientName: "", salesInvoice: "" },
      { id: "ESC-MET-001-3", editionNumber: 3, comments: "SOLD", exhibitionLocation: "Quivira", gallerySeller: "Quivira / Jonathan", clientName: "John Doe", salesInvoice: "QV-12345" },
      { id: "ESC-MET-001-4", editionNumber: 4, comments: "", exhibitionLocation: "Warehouse", gallerySeller: "", clientName: "", salesInvoice: "" },
      { id: "ESC-MET-001-5", editionNumber: 5, comments: "Minor scratch on base.", exhibitionLocation: "Alvaro Obregon Gallery", gallerySeller: "", clientName: "", salesInvoice: "" },
      { id: "ESC-MET-001-6", editionNumber: 6, comments: "SOLD", exhibitionLocation: "Art Basel", gallerySeller: "Art Basel / Maria", clientName: "Jane Smith", salesInvoice: "AB-67890" },
      { id: "ESC-MET-001-7", editionNumber: 7, comments: "", exhibitionLocation: "Warehouse", gallerySeller: "", clientName: "", salesInvoice: "" },
      { id: "ESC-MET-001-8", editionNumber: 8, comments: "", exhibitionLocation: "Warehouse", gallerySeller: "", clientName: "", salesInvoice: "" },
      { id: "ESC-MET-001-9", editionNumber: 9, comments: "", exhibitionLocation: "Warehouse", gallerySeller: "", clientName: "", salesInvoice: "" },
      { id: "ESC-MET-001-10", editionNumber: 10, comments: "Last of the series.", exhibitionLocation: "Alvaro Obregon Gallery", gallerySeller: "", clientName: "", salesInvoice: "" },
    ]
  },
  {
    sku: "DSK-OAK-002",
    name: "Minimalist Oak Desk",
    imageUrl: PLACEHOLDER_IMAGE,
    totalEditions: 5,
    editions: Array.from({ length: 5 }, (_, i) => ({
      id: `DSK-OAK-002-${i + 1}`,
      editionNumber: i + 1,
      comments: "",
      exhibitionLocation: "Warehouse",
      gallerySeller: "",
      clientName: "",
      salesInvoice: ""
    }))
  }
];

export const initialMiniWorks: MiniWork[] = [
  { id: 1, name: "Mini Abstracto #1", sku: "MINI-ABS-001", imageUrl: PLACEHOLDER_IMAGE, archived: false },
  { id: 2, name: "Corazón Mini Rojo", sku: "MINI-COR-001", archived: false },
  { id: 3, name: "Mini Escultura de Pared", sku: "MINI-WALL-001", archived: false },
];
