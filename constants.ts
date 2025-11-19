
import { Product, ProductCategory, ShippingSettings, NumberedProduct, MiniWork } from './types';

// Placeholder SVG image as a Base64 data URL
const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTJlOGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjIwIiBmaWxsPSIjY2FkMWQ4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UHJvZHVjdCBJbWFnZTwvdGV4dD48L3N2Zz4=';

export const CATEGORIES: ProductCategory[] = ['ORIGINAL', 'LIMITED EDITION', 'MINI ORIGINAL', 'MINI ORIGINAL SPECIAL', 'METAL SCULPTURE', 'WALL SCULPTURE', 'GLASS SCULPTURE'];

export const CATEGORY_COLORS: Record<ProductCategory, string> = {
  'GLASS SCULPTURE': 'bg-blue-500 text-white',
  'ORIGINAL': 'bg-red-500 text-white',
  'METAL SCULPTURE': 'bg-yellow-400 text-gray-900',
  'WALL SCULPTURE': 'bg-indigo-500 text-white',
  'LIMITED EDITION': 'bg-gray-800 text-white',
  'MINI ORIGINAL': 'bg-teal-500 text-white',
  'MINI ORIGINAL SPECIAL': 'bg-purple-500 text-white',
};

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
    imagenUrl: placeholderImage,
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
    imagenUrl: placeholderImage,
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
        imageUrl: placeholderImage,
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
        imageUrl: placeholderImage,
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
  { id: 1, name: "Mini Abstracto #1", sku: "MINI-ABS-001", imageUrl: placeholderImage, archived: false },
  { id: 2, name: "Corazón Mini Rojo", sku: "MINI-COR-001", archived: false },
  { id: 3, name: "Mini Escultura de Pared", sku: "MINI-WALL-001", archived: false },
];
