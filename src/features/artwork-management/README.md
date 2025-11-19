# Artwork Management Feature

Sistema completo de gestión de obras de arte con integración Firebase Firestore.

## 📁 Estructura

```
artwork-management/
├── components/          # UI Components
│   ├── ProductCard.tsx
│   ├── ProductDetailModal.tsx
│   └── ProductFormModal.tsx
├── hooks/              # Custom React Hooks
│   ├── useArtworks.ts  # Hook principal para CRUD
│   └── index.ts
├── services/           # Firebase Services
│   ├── artworkService.ts  # Firestore operations
│   └── index.ts
├── types/              # TypeScript Types
│   └── index.ts
└── README.md          # Esta documentación
```

---

## 🚀 Quick Start

### 1. Usar el Hook (Recomendado)

```tsx
import { useArtworks } from '@/features/artwork-management/hooks';

function ArtworksList() {
  const {
    artworks,
    loading,
    error,
    createArtwork,
    updateArtwork,
    deleteArtwork
  } = useArtworks();

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {artworks.map(art => (
        <div key={art.id}>{art.nombre}</div>
      ))}
    </div>
  );
}
```

### 2. Usar el Service directamente

```tsx
import { artworkService } from '@/features/artwork-management/services';

// Crear obra
const artworkId = await artworkService.createArtwork({
  nombre: "Obra Nueva",
  descripcion: "Descripción...",
  precioUSD: 1500,
  category: "ORIGINAL",
  // ... otros campos
});

// Actualizar obra
await artworkService.updateArtwork(artworkId, {
  precioUSD: 2000,
});

// Eliminar (soft delete)
await artworkService.deleteArtwork(artworkId);
```

---

## 📚 API Reference

### `useArtworks(options?)`

Hook personalizado para gestionar obras de arte.

#### Opciones

```typescript
interface UseArtworksOptions {
  status?: 'active' | 'archived' | 'deleted' | 'all'; // Default: 'active'
  realtime?: boolean;  // Default: true
}
```

#### Retorna

```typescript
interface UseArtworksReturn {
  artworks: Product[];
  loading: boolean;
  error: string | null;
  createArtwork: (artwork: NewProduct) => Promise<string | null>;
  updateArtwork: (id: string | number, artwork: Partial<Product>) => Promise<boolean>;
  deleteArtwork: (id: string | number) => Promise<boolean>;
  archiveArtwork: (id: string | number) => Promise<boolean>;
  restoreArtwork: (id: string | number) => Promise<boolean>;
  refresh: () => Promise<void>;
}
```

#### Ejemplos

**Real-time subscription (default):**
```tsx
const { artworks, loading } = useArtworks();
// Actualiza automáticamente cuando cambia Firestore
```

**One-time fetch:**
```tsx
const { artworks, loading, refresh } = useArtworks({ realtime: false });
// Requiere refresh() manual
```

**Filtrar por status:**
```tsx
// Solo activas
const { artworks } = useArtworks({ status: 'active' });

// Archivadas
const { artworks } = useArtworks({ status: 'archived' });

// Todas
const { artworks } = useArtworks({ status: 'all' });
```

---

### `artworkService`

Servicio de bajo nivel para operaciones Firestore directas.

#### Métodos

##### Create

```typescript
createArtwork(artwork: NewProduct): Promise<string>
```

Crea una nueva obra en Firestore.

```tsx
const id = await artworkService.createArtwork({
  nombre: "Escultura Abstracta",
  descripcion: "Escultura moderna...",
  precioUSD: 3500,
  medidas: "120x80x40 cm",
  peso: 25,
  sku: "ESC-001",
  category: "METAL SCULPTURE",
  interactiva: false,
  medidasCaja: "130x90x50 cm",
  costoEnvioUSA: 450,
  costoEnvioCanada: 550,
});
```

##### Read

```typescript
// Por ID
getArtworkById(id: string | number): Promise<Product | null>

// Activas
getActiveArtworks(): Promise<Product[]>

// Todas
getAllArtworks(): Promise<Product[]>

// Por status
getArtworksByStatus(status: ArtworkStatus): Promise<Product[]>
```

```tsx
// Una obra
const artwork = await artworkService.getArtworkById("abc123");

// Solo activas
const active = await artworkService.getActiveArtworks();

// Archivadas
const archived = await artworkService.getArtworksByStatus('archived');
```

##### Update

```typescript
updateArtwork(id: string | number, artwork: Partial<Product>): Promise<void>
```

```tsx
await artworkService.updateArtwork("abc123", {
  precioUSD: 4000,
  descripcion: "Nueva descripción...",
});
```

##### Delete & Archive

```typescript
// Soft delete (status = 'deleted')
deleteArtwork(id: string | number): Promise<void>

// Archive (status = 'archived')
archiveArtwork(id: string | number): Promise<void>

// Restore (status = 'active')
restoreArtwork(id: string | number): Promise<void>
```

```tsx
// Eliminar
await artworkService.deleteArtwork("abc123");

// Archivar
await artworkService.archiveArtwork("abc123");

// Restaurar
await artworkService.restoreArtwork("abc123");
```

##### Real-time Subscriptions

```typescript
// Activas
subscribeToActiveArtworks(callback: (artworks: Product[]) => void): () => void

// Todas
subscribeToAllArtworks(callback: (artworks: Product[]) => void): () => void

// Por status
subscribeToArtworksByStatus(
  status: ArtworkStatus,
  callback: (artworks: Product[]) => void
): () => void
```

```tsx
import { useEffect, useState } from 'react';

function MyComponent() {
  const [artworks, setArtworks] = useState<Product[]>([]);

  useEffect(() => {
    // Subscribe
    const unsubscribe = artworkService.subscribeToActiveArtworks((data) => {
      setArtworks(data);
    });

    // Cleanup
    return () => unsubscribe();
  }, []);

  return <div>{artworks.length} obras</div>;
}
```

---

## 🔐 Firestore Schema

### Collection: `artworks`

```typescript
{
  // Campos originales
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

  // Campos Firebase
  status: 'active' | 'archived' | 'deleted';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Índices necesarios

Estos índices se configuran automáticamente desde `firestore.indexes.json`:

1. **status + createdAt** (DESC) - Para listar activas por fecha
2. **status + category + createdAt** (DESC) - Para filtrar por categoría

---

## 🎯 Patrones de Uso Comunes

### Galería Pública (Real-time)

```tsx
function PublicGallery() {
  const { artworks, loading } = useArtworks({ status: 'active' });

  if (loading) return <Loader />;

  return (
    <div className="grid grid-cols-3 gap-4">
      {artworks.map(art => (
        <ProductCard key={art.id} product={art} />
      ))}
    </div>
  );
}
```

### Panel Admin (CRUD completo)

```tsx
function AdminPanel() {
  const {
    artworks,
    createArtwork,
    updateArtwork,
    deleteArtwork,
    archiveArtwork,
  } = useArtworks({ status: 'all' });

  const handleCreate = async (data: NewProduct) => {
    const id = await createArtwork(data);
    if (id) {
      console.log('Created artwork:', id);
    }
  };

  const handleArchive = async (id: number) => {
    const success = await archiveArtwork(id);
    if (success) {
      console.log('Archived!');
    }
  };

  return (
    <div>
      <button onClick={() => handleCreate(newArtData)}>
        Create
      </button>
      {artworks.map(art => (
        <div key={art.id}>
          {art.nombre}
          <button onClick={() => handleArchive(art.id)}>
            Archive
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Papelera (Archived & Deleted)

```tsx
function Trash() {
  const { artworks: deleted } = useArtworks({ status: 'deleted' });
  const { artworks: archived } = useArtworks({ status: 'archived' });
  const { restoreArtwork } = useArtworks();

  return (
    <div>
      <h2>Archivadas ({archived.length})</h2>
      {archived.map(art => (
        <div key={art.id}>
          {art.nombre}
          <button onClick={() => restoreArtwork(art.id)}>
            Restore
          </button>
        </div>
      ))}

      <h2>Eliminadas ({deleted.length})</h2>
      {deleted.map(art => (
        <div key={art.id}>
          {art.nombre}
          <button onClick={() => restoreArtwork(art.id)}>
            Restore
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔒 Reglas de Seguridad

Las reglas están definidas en `firestore.rules`:

```javascript
// Lectura pública de obras activas
allow read: if resource.data.status == 'active' || isAdmin();

// Escritura solo para admins
allow create, update, delete: if isAdmin();
```

---

## ⚠️ Notas Importantes

### 1. Status Field (Soft Delete)

Nunca eliminamos documentos de Firestore. Usamos el campo `status`:

- `'active'` - Visible públicamente
- `'archived'` - Oculta, pero recuperable
- `'deleted'` - En papelera, recuperable

### 2. Timestamps

Firestore maneja automáticamente:
- `createdAt` - Al crear
- `updatedAt` - Al actualizar

### 3. ID Compatibility

El servicio mantiene compatibilidad con IDs numéricos del localStorage:

```tsx
// Firestore usa string IDs
const firestoreId = "abc123xyz";

// Pero el servicio acepta ambos
await artworkService.updateArtwork("abc123xyz", {...});
await artworkService.updateArtwork(12345, {...});  // También funciona
```

### 4. Real-time Performance

Las subscripciones real-time son eficientes, pero considera:

```tsx
// ✅ GOOD: Una subscription por vista
const { artworks } = useArtworks();

// ❌ BAD: Múltiples subscriptions innecesarias
const { artworks: active } = useArtworks({ status: 'active' });
const { artworks: archived } = useArtworks({ status: 'archived' });
const { artworks: deleted } = useArtworks({ status: 'deleted' });
```

---

## 🚧 Migración desde localStorage

El servicio está listo para reemplazar localStorage:

```tsx
// ANTES (localStorage)
const [catalog, setCatalog] = useState<Product[]>(initialCatalog);

const handleAddProduct = (newProduct: NewProduct) => {
  const product = { id: Date.now(), ...newProduct };
  setCatalog(prev => [product, ...prev]);
};

// DESPUÉS (Firestore)
const { artworks, createArtwork } = useArtworks();

const handleAddProduct = async (newProduct: NewProduct) => {
  await createArtwork(newProduct);
  // Estado se actualiza automáticamente vía subscription
};
```

---

## 📖 Siguientes Pasos

1. **Habilitar Firestore** en Firebase Console
2. **Desplegar reglas** de seguridad
3. **Migrar App.tsx** para usar `useArtworks`
4. **Implementar autenticación** (FASE 4)
5. **Testing end-to-end**

---

## 🐛 Troubleshooting

### Error: "Missing or insufficient permissions"

**Causa:** Reglas de Firestore no desplegadas

**Solución:**
```bash
firebase deploy --only firestore:rules
```

### Error: "Firebase not initialized"

**Causa:** `.env.local` no configurado

**Solución:**
Verifica que todas las variables `VITE_FIREBASE_*` estén configuradas.

### Subscription no actualiza

**Causa:** Query requiere índice compuesto

**Solución:**
```bash
firebase deploy --only firestore:indexes
```

---

**Última actualización:** 2025-11-19
**Estado:** ✅ Implementado y listo para usar
