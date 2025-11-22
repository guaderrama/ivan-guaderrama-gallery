# 🧪 Guía de Prueba: Integración Firebase Storage para Imágenes

## ✅ Cambios Implementados

### Archivos Modificados:
1. **[ProductForm.tsx](src/features/artwork-management/components/ProductForm.tsx:7)** - Integración con Firebase Storage
2. **[storageService.ts](src/shared/services/storageService.ts)** - Servicio de carga a Firebase Storage
3. **[firebase.json](firebase.json:7)** - Configuración del sitio de hosting

### ¿Qué se Corrigió?

**ANTES (Problema):**
```typescript
// Imágenes se convertían a base64
reader.readAsDataURL(file);
setProductData({ ...prev, imagenUrl: result }); // ❌ base64 string ~2.7MB
```
- Base64 aumenta tamaño en ~33%
- Imagen de 2MB → ~2.7MB en base64
- Firestore límite: 1MB por campo
- **Error**: `The value of property 'imagenUrl' is longer than 1048487 bytes`

**DESPUÉS (Solución):**
```typescript
// Imágenes se suben a Firebase Storage
const downloadURL = await storageService.uploadImage(file, filename);
setProductData({ ...prev, imagenUrl: downloadURL }); // ✅ URL ~150 bytes
```
- Imagen se sube a Firebase Storage
- Solo URL se guarda en Firestore (~150 bytes)
- Sin límite de tamaño de imagen (hasta 2MB por validación)

---

## 🔧 Configuración Verificada

### ✅ Firebase Storage Configurado
- **Storage Bucket**: `ivan-guaderrama-gallery.firebasestorage.app`
- **Reglas de Seguridad**: [storage.rules](storage.rules:13)
  - Lectura pública para galería
  - Solo admins pueden subir/modificar/eliminar

### ✅ Variables de Entorno
```bash
VITE_FIREBASE_STORAGE_BUCKET=ivan-guaderrama-gallery.firebasestorage.app ✓
```

### ✅ Servidor de Desarrollo
```bash
➜  Local:   http://localhost:3000/
➜  Network: http://10.88.0.3:3000/
```

---

## 📝 Pasos para Probar Manualmente con Chrome DevTools

### **1. Abrir la Aplicación**

```bash
# El servidor ya está corriendo en:
http://localhost:3000/
```

1. Abre Chrome
2. Navega a `http://localhost:3000/`
3. Presiona **F12** para abrir DevTools
4. Ve a la pestaña **Console**

---

### **2. Login (si no estás autenticado)**

```
Email: arturoguaderrama@gmail.com
Password: Unodus3$
```

✅ **Verificar**: Debes ver el dashboard con el botón "Agregar Obra"

---

### **3. Abrir Formulario de Nueva Obra**

1. Click en **"Agregar Obra"**
2. Verifica que el modal se abre correctamente

---

### **4. Llenar Campos del Formulario**

```
Nombre: Prueba Firebase Storage
SKU: TEST-STORAGE-[timestamp aleatorio]
Precio: 5000
Descripción: Prueba de integración con Firebase Storage
Dimensiones: 100x80x5
```

---

### **5. 🎯 PRUEBA CRÍTICA: Subir Imagen**

1. Click en **"Subir Imagen"**
2. Selecciona una imagen (máx 2MB)

**En DevTools Console, buscar:**

```javascript
// ✅ ESPERADO: Mensajes de carga
"Error uploading image: ..." // SI hay error
// O ningún error si todo está bien
```

**En la UI, verificar:**

- ✅ Botón cambia a **"Subiendo..."** mientras sube
- ✅ Botón se deshabilita durante carga
- ✅ Aparece preview de la imagen
- ✅ Botón cambia a **"Cambiar Imagen"** cuando termina
- ❌ NO debe aparecer error

---

### **6. Guardar la Obra**

1. Click en **"Guardar Producto"**
2. Esperar 2-3 segundos

**Verificar en Console:**

```javascript
// ❌ NO DEBE APARECER:
"Error updating artwork: FirebaseError: The value of property 'imagenUrl' is longer than 1048487 bytes"
"Error de conexión"
"Failed to update artwork"

// ✅ ESPERADO:
// Sin errores, o mensaje de éxito
```

**Verificar en UI:**

- ✅ Modal se cierra
- ✅ Obra aparece en el catálogo
- ✅ Imagen se muestra correctamente
- ❌ NO aparece mensaje "Error de conexión"

---

### **7. Verificar en Firebase Console**

**Firestore:**
1. Abre [Firebase Console](https://console.firebase.google.com/)
2. Proyecto: `ivan-guaderrama-gallery`
3. Ve a **Firestore Database** → `artworks`
4. Busca la obra recién creada
5. Verifica el campo `imagenUrl`

```javascript
// ✅ ESPERADO (URL de Storage):
imagenUrl: "https://firebasestorage.googleapis.com/v0/b/ivan-guaderrama-gallery.firebasestorage.app/o/artworks%2F1732294837234-abc123.png?alt=media&token=..."

// ❌ NO DEBE SER (base64):
imagenUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
```

**Storage:**
1. Ve a **Storage** en Firebase Console
2. Navega a la carpeta `artworks/`
3. Verifica que la imagen se subió correctamente
4. Nombre del archivo debe ser: `[timestamp]-[random].[extensión]`
   - Ejemplo: `1732294837234-abc123.png`

---

## 🧪 Casos de Prueba

### ✅ Caso 1: Imagen Normal (< 2MB)
- **Acción**: Subir imagen PNG de 500KB
- **Esperado**:
  - Se sube correctamente
  - URL se guarda en Firestore
  - Imagen visible en Storage

### ✅ Caso 2: Imagen Grande (> 2MB)
- **Acción**: Subir imagen de 3MB
- **Esperado**:
  - Error: "La imagen es muy grande. El límite es 2MB."
  - No se sube a Storage
  - No se guarda la obra

### ✅ Caso 3: Archivo No Válido
- **Acción**: Intentar subir PDF o archivo no-imagen
- **Esperado**:
  - Error: "El archivo debe ser una imagen."
  - No se sube a Storage

### ✅ Caso 4: Guardar sin Imagen
- **Acción**: Llenar campos pero NO subir imagen
- **Esperado**:
  - Obra se guarda correctamente
  - `imagenUrl` queda vacío o undefined
  - No hay errores

---

## 🔍 Debugging con Chrome DevTools

### Network Tab
1. Abre **DevTools** → **Network**
2. Filtra por `firebasestorage.googleapis.com`
3. Al subir imagen, debes ver:

```
POST https://firebasestorage.googleapis.com/v0/b/ivan-guaderrama-gallery.firebasestorage.app/o/artworks%2F...
Status: 200 OK
```

### Console Tab
Busca logs relacionados con:
- `"Error uploading image:"`
- `"FirebaseError"`
- `"Failed to update artwork"`

### Application Tab
1. Ve a **Application** → **Storage** → **Local Storage**
2. Verifica que las credenciales de Firebase estén activas

---

## 📊 Criterios de Éxito

### ✅ Prueba EXITOSA si:
1. Imagen se sube sin errores
2. Botón muestra "Subiendo..." durante carga
3. Botón cambia a "Cambiar Imagen" al terminar
4. Obra se guarda correctamente en Firestore
5. `imagenUrl` contiene URL de Storage (no base64)
6. Imagen aparece en Storage Console
7. NO aparece error "longer than 1048487 bytes"

### ❌ Prueba FALLA si:
1. Error en console al subir imagen
2. Error "Error de conexión" al guardar
3. `imagenUrl` contiene base64 en vez de URL
4. Imagen NO aparece en Storage

---

## 🚀 Deployment

Una vez que las pruebas pasen, hacer deploy:

```bash
# 1. Build
npm run build

# 2. Deploy Storage Rules
firebase deploy --only storage

# 3. Deploy Hosting
firebase deploy --only hosting
```

---

## 📸 Screenshots Recomendados

Durante la prueba, toma screenshots de:

1. **DevTools Console** antes de subir imagen
2. **Botón "Subiendo..."** durante carga
3. **Botón "Cambiar Imagen"** después de carga
4. **DevTools Console** después de guardar (sin errores)
5. **Firebase Firestore** mostrando el `imagenUrl` con URL
6. **Firebase Storage** mostrando la imagen subida
7. **Catálogo** con la obra nueva y su imagen

---

## 🔗 Referencias

- **Código modificado**: [ProductForm.tsx:106-144](src/features/artwork-management/components/ProductForm.tsx#L106-L144)
- **Storage Service**: [storageService.ts](src/shared/services/storageService.ts)
- **Storage Rules**: [storage.rules:13](storage.rules#L13)
- **Firebase Config**: [firebase.ts:23](src/shared/lib/firebase.ts#L23)

---

**Última actualización**: 2025-11-22
**Servidor corriendo**: http://localhost:3000/
