# 🔧 INSTRUCCIONES: Probar con Localhost

## ⚠️ IMPORTANTE: Verifica la URL

Mira la barra de direcciones de Chrome. ¿Qué URL ves?

### ❌ Si ves esto (INCORRECTO):
```
https://ivan-guaderrama-gallery.web.app
```
o
```
https://ivan-guaderrama-gallery.firebaseapp.com
```

**Esto NO funcionará** porque es la versión desplegada (vieja).

---

### ✅ Si ves esto (CORRECTO):
```
http://localhost:3000
```

**Esto SÍ funcionará** porque es el servidor local (nuevo).

---

## 📋 Pasos para Usar Localhost:

### 1. **Abre una NUEVA pestaña en Chrome**

### 2. **Escribe en la barra de direcciones**:
```
http://localhost:3000
```

### 3. **Presiona Enter**

### 4. **Verifica que cargó**:
Deberías ver la página de login o el dashboard (si ya estás logueado).

### 5. **Abre DevTools**:
- Presiona **F12**
- Ve a la pestaña **Console**

### 6. **Verifica que estás en localhost**:
En la consola, escribe:
```javascript
window.location.href
```

Debe responder:
```
"http://localhost:3000/"
```

### 7. **Limpia la consola**:
Click en el ícono 🚫 (Clear console)

---

## 🧪 Prueba de Carga de Imagen:

### 1. **Click en "Agregar Obra"**

### 2. **Llena los campos**:
- Nombre: TEST STORAGE LOCAL
- SKU: TEST-001
- Precio: 1000
- Dimensiones: 50x50x5

### 3. **Click en "Subir Imagen"**

### 4. **Selecciona cualquier imagen**

### 5. **MIRA LA CONSOLA** - Deberías ver:
```
🖼️ [IMAGE UPLOAD] Starting image upload process...
📁 [IMAGE UPLOAD] File details: {name: "...", size: ..., type: "image/...", sizeInMB: "...MB"}
✅ [IMAGE UPLOAD] File size OK
🔄 [IMAGE UPLOAD] Creating preview...
✅ [IMAGE UPLOAD] Preview created
📤 [IMAGE UPLOAD] Uploading to Firebase Storage: artworks/...
✅ [IMAGE UPLOAD] Upload successful! URL: https://firebasestorage.googleapis.com/...
✅ [IMAGE UPLOAD] URL saved to product data
✅ [IMAGE UPLOAD] Process complete!
```

### 6. **Click en "Guardar Producto"**

### 7. **MIRA LA CONSOLA** - Deberías ver:
```
💾 [SAVE] Form submitted
📦 [SAVE] Product data: {...}
🖼️ [SAVE] Image URL type: string
🖼️ [SAVE] Image URL length: 200-300 (aproximadamente)
🖼️ [SAVE] Image URL preview: https://firebasestorage.googleapis.com...
✅ [SAVE] Validation passed
➕ [SAVE] Adding new product...
✅ [SAVE] Save process initiated
```

---

## ❌ Si NO ves estos logs:

### Opción 1: No estás en localhost
- Verifica la URL
- Debe ser `http://localhost:3000`
- NO debe ser `https://...firebaseapp.com`

### Opción 2: Caché del navegador
- Presiona **Ctrl + Shift + R** (Windows/Linux)
- O **Cmd + Shift + R** (Mac)
- Esto recarga ignorando caché

### Opción 3: DevTools no está en la pestaña correcta
- Asegúrate de estar en la pestaña **Console**
- No en **Elements**, **Network**, etc.

---

## 📸 Si sigue sin funcionar:

Envíame un screenshot mostrando:
1. **La barra de direcciones** (para ver la URL)
2. **La consola de DevTools** (pestaña Console)
3. **Cualquier error en rojo**

---

**El servidor local está corriendo en: http://localhost:3000/**
