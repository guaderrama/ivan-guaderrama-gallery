# Cloud Functions - Ivan Guaderrama Gallery

Serverless functions para securizar API calls y procesar tareas backend.

## 📁 Estructura

```
functions/
├── src/
│   └── index.ts           # Main functions file
├── lib/                   # Compiled JS (generado)
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md             # Esta documentación
```

---

## 🚀 Quick Start

### 1. Instalar Dependencias

```bash
cd functions
npm install
```

### 2. Build

```bash
npm run build
```

### 3. Test Localmente (Emulators)

```bash
# Desde la raíz del proyecto
firebase emulators:start
```

Abre: http://localhost:4000 (Firebase Emulator UI)

### 4. Deploy a Production

```bash
# Desde la raíz del proyecto
firebase deploy --only functions
```

---

## 📚 Functions Implementadas

### 1. `generateArtNames` (Callable)

Proxy seguro para Gemini API - Genera nombres artísticos.

**Seguridad:**
- ✅ Requiere autenticación
- ✅ Solo admins pueden llamar
- ✅ API key en Secret Manager (no expuesta)
- ✅ Rate limiting (Firebase default)

**Uso desde Frontend:**

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const generateNames = httpsCallable(functions, 'generateArtNames');

// Llamar función
const result = await generateNames({
  prompt: 'Abstract sculpture with organic forms',
  count: 5
});

console.log(result.data.names);
// ["Flowing Essence", "Organic Whispers", ...]
```

**Parámetros:**

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `prompt` | string | Sí | - | Descripción para generar nombres |
| `count` | number | No | 5 | Cantidad de nombres (1-20) |

**Respuesta:**

```typescript
{
  success: true,
  names: string[],      // Array de nombres generados
  count: number         // Cantidad generada
}
```

**Errores:**

| Código | Mensaje | Causa |
|--------|---------|-------|
| `unauthenticated` | User must be authenticated | No hay sesión activa |
| `permission-denied` | Only admins can generate art names | Usuario no es admin |
| `invalid-argument` | Prompt must be a non-empty string | Prompt vacío o inválido |
| `invalid-argument` | Count must be between 1 and 20 | Count fuera de rango |
| `failed-precondition` | Gemini API key not configured | API key no configurada |
| `internal` | Failed to generate art names | Error de Gemini API |

---

### 2. `processBulkArtUpload` (Callable)

Procesa archivos CSV para crear múltiples obras en batch.

**Seguridad:**
- ✅ Requiere autenticación
- ✅ Solo admins
- ✅ Valida datos del CSV
- ✅ Batch writes (500 por lote)

**Uso desde Frontend:**

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/shared/lib/firebase';

// 1. Upload CSV a Storage
const storageRef = ref(storage, `uploads/${userId}/artworks.csv`);
await uploadBytes(storageRef, csvFile);

// 2. Llamar función para procesar
const functions = getFunctions();
const processBulk = httpsCallable(functions, 'processBulkArtUpload');

const result = await processBulk({
  filePath: `uploads/${userId}/artworks.csv`
});

console.log(result.data);
// { success: true, total: 50, created: 48, errors: [...] }
```

**Formato CSV:**

```csv
nombre,descripcion,precioUSD,category,medidas,peso,sku
"Obra 1","Descripción 1",1500,ORIGINAL,"120x80",25,OBR-001
"Obra 2","Descripción 2",2000,METAL SCULPTURE,"80x60x40",30,ESC-001
```

**Campos requeridos:**
- `nombre`
- `precioUSD`
- `category`

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `filePath` | string | Sí | Ruta del CSV en Storage |

**Respuesta:**

```typescript
{
  success: true,
  total: number,        // Total de líneas en CSV
  created: number,      // Obras creadas exitosamente
  errors: string[]      // Errores encontrados
}
```

---

### 3. `onArtworkUpdate` (Trigger)

Background function que se ejecuta automáticamente cuando una obra cambia.

**Triggers:**
- onCreate - Nueva obra creada
- onUpdate - Obra modificada
- onDelete - Obra eliminada

**Acciones actuales:**
- ✅ Logging de cambios
- ⏳ Notificaciones (TODO)
- ⏳ Search indexing (TODO)
- ⏳ Analytics (TODO)

**No requiere llamada manual** - Se ejecuta automáticamente.

---

## 🔐 Configuración de API Keys

### Opción A: Firebase Config (Recomendado para producción)

```bash
# Configurar Gemini API Key
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"

# Ver configuración actual
firebase functions:config:get

# Deploy con nueva config
firebase deploy --only functions
```

### Opción B: Variables de Entorno (Solo para emulators)

Crea `functions/.env.local`:

```env
GEMINI_API_KEY=your-gemini-api-key-here
```

**IMPORTANTE:** NO commitear este archivo.

---

## 🧪 Testing Local con Emulators

### 1. Iniciar Emulators

```bash
# Desde raíz del proyecto
firebase emulators:start
```

Servicios disponibles:
- Functions: http://localhost:5001
- Firestore: http://localhost:8080
- Storage: http://localhost:9199
- Emulator UI: http://localhost:4000

### 2. Probar generateArtNames

En la consola del navegador (con app corriendo):

```javascript
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

// Conectar a emulator
const functions = getFunctions();
connectFunctionsEmulator(functions, 'localhost', 5001);

// Llamar función
const generateNames = httpsCallable(functions, 'generateArtNames');
const result = await generateNames({
  prompt: 'Modern sculpture',
  count: 3
});

console.log(result.data);
```

### 3. Ver Logs

```bash
# En otra terminal
firebase functions:log
```

---

## 🚀 Deployment

### Deploy Solo Functions

```bash
firebase deploy --only functions
```

### Deploy Function Específica

```bash
firebase deploy --only functions:generateArtNames
```

### Deploy Todo

```bash
firebase deploy
```

### Ver Logs de Producción

```bash
firebase functions:log
```

### Delete Function

```bash
firebase functions:delete functionName
```

---

## 💰 Costos y Límites

### Firebase Functions Pricing (Free Tier)

| Recurso | Free Tier | Después |
|---------|-----------|---------|
| Invocations | 2M/mes | $0.40 por 1M |
| Compute time | 400K GB-sec/mes | $0.0000025 por GB-sec |
| Networking | 5GB egress/mes | $0.12 per GB |

### Gemini API Pricing

| Modelo | Free Tier | Pricing |
|--------|-----------|---------|
| gemini-pro | 60 requests/min | Gratis hasta cierto límite |

**Estimado para galería:**
- ~100 generaciones de nombres/mes
- ~10 bulk uploads/mes
- **Costo estimado:** $0 (dentro de free tier)

---

## 🎯 Best Practices

### 1. Error Handling

```typescript
try {
  const result = await generateNames({ prompt, count });
  console.log(result.data.names);
} catch (error: any) {
  if (error.code === 'permission-denied') {
    alert('Only admins can generate names');
  } else if (error.code === 'unauthenticated') {
    // Redirect to login
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### 2. Loading States

```typescript
const [loading, setLoading] = useState(false);

const handleGenerate = async () => {
  setLoading(true);
  try {
    const result = await generateNames({ prompt, count });
    setNames(result.data.names);
  } finally {
    setLoading(false);
  }
};
```

### 3. Rate Limiting Cliente

```typescript
// Debounce para evitar llamadas excesivas
import { debounce } from 'lodash';

const debouncedGenerate = debounce(async (prompt: string) => {
  const result = await generateNames({ prompt, count: 5 });
  setNames(result.data.names);
}, 500);
```

---

## 🔧 Troubleshooting

### Error: "Gemini API key not configured"

```bash
firebase functions:config:set gemini.api_key="YOUR_KEY"
firebase deploy --only functions
```

### Error: "CORS error" en emulator

Asegúrate de conectar correctamente:

```typescript
import { connectFunctionsEmulator } from 'firebase/functions';

const functions = getFunctions();
if (process.env.NODE_ENV === 'development') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
```

### Functions no se despliegan

```bash
# Build manual primero
cd functions
npm run build

# Verificar errores
cat lib/index.js
```

### Ver logs detallados

```bash
firebase functions:log --only generateArtNames
```

---

## 📖 Integración con Frontend

### Setup en App

```typescript
// src/shared/lib/firebase.ts
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

export const functions = getFunctions(app);

// Solo en development
if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
```

### Service Layer

```typescript
// src/features/ai-naming/services/aiService.ts
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/shared/lib/firebase';

export const aiService = {
  async generateArtNames(prompt: string, count: number = 5): Promise<string[]> {
    const callable = httpsCallable(functions, 'generateArtNames');
    const result = await callable({ prompt, count });
    return result.data.names;
  },
};
```

### Component Usage

```typescript
import { aiService } from '@/features/ai-naming/services';

function GenerateNamesButton() {
  const [names, setNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const generated = await aiService.generateArtNames('Abstract art', 5);
      setNames(generated);
    } catch (error) {
      console.error('Error generating names:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Names'}
      </button>
      <ul>
        {names.map(name => <li key={name}>{name}</li>)}
      </ul>
    </div>
  );
}
```

---

## 🔒 Security Checklist

- [x] API keys nunca expuestas en frontend
- [x] Autenticación requerida para todas las funciones
- [x] Role-based access (solo admins)
- [x] Input validation
- [x] Error handling robusto
- [x] Rate limiting (Firebase default)
- [ ] Logging de accesos (TODO)
- [ ] Monitoring de uso (TODO)

---

**Última actualización:** 2025-11-19
**Estado:** ✅ Implementado y listo para deploy
