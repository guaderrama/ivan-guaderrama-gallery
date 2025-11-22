# 🚀 Deploy Fácil - Firebase Console (SIN TERMINAL)

## ✅ Paso 1: Descargar la Carpeta `dist`

La carpeta con todos los archivos compilados está lista:
```
/home/user/ai/dist/
```

**Descarga esta carpeta completa a tu computadora.**

En Google IDX/Cloud Workspace:
1. Click derecho en la carpeta `dist`
2. Selecciona "Download" o "Descargar"
3. Se descargará como `dist.zip`
4. Descomprime el archivo ZIP

---

## ✅ Paso 2: Abrir Firebase Console

1. Ve a: **https://console.firebase.google.com/project/ivan-guaderrama-gallery/hosting**

2. Deberías ver algo así:
   ```
   Hosting
   ├── ivan-guaderrama-gallery (tu sitio)
   └── [Botón: Add another site]
   ```

---

## ✅ Paso 3: Deploy Manual (Drag & Drop)

### Opción A: Si ves "Get started with Hosting"
1. Click en **"Get started"**
2. Sigue el wizard hasta llegar a la pantalla de deploy
3. **Arrastra la carpeta `dist` descomprimida** a la zona indicada
4. Espera que suba todos los archivos
5. Click en **"Deploy"**

### Opción B: Si ya tienes deploys anteriores
1. En la lista de deploys, busca el botón **"Deploy to live channel"**
2. Selecciona **"Drag and drop"**
3. **Arrastra la carpeta `dist` descomprimida**
4. Click en **"Deploy"**

### Opción C: Usando Firebase CLI Web
1. Busca el ícono de 3 puntos (⋮) junto a tu sitio
2. Click en **"Manage site"**
3. Ve a la pestaña **"Release history"**
4. Click en **"Create new release"**
5. **Arrastra la carpeta `dist`**
6. Click en **"Upload"** y luego **"Deploy"**

---

## ✅ Paso 4: Verificar el Deploy

Después del deploy, verás:
```
✅ Deploy complete!
Your site is live at: https://ivan-guaderrama-gallery.web.app
```

1. **Espera 1-2 minutos** para que se propague
2. **Limpia caché del navegador**: `Ctrl + Shift + R`
3. **Abre tu sitio**
4. **Prueba crear una obra con imagen**

---

## 🎯 Archivos Incluidos en `dist`

La carpeta contiene:
- ✅ index.html
- ✅ assets/index-BIFL0ADi.js ← **CÓDIGO NUEVO con Firebase Storage**
- ✅ assets/GenerateNameModal-C0aU7W5S.js
- ✅ assets/ArtworkSimulator-BlZUzeam.js
- ✅ assets/index-CHxrVzz6.js

El archivo `index-BIFL0ADi.js` contiene toda la lógica actualizada de Firebase Storage.

---

## 🔍 Cómo Verificar que el Deploy Nuevo está Activo

### Método 1: Ver el Hash del Bundle
1. Abre tu sitio
2. Presiona **F12** → pestaña **Network**
3. Recarga la página
4. Busca el archivo que comienza con `index-` y termina en `.js`
5. **Debe ser**: `index-BIFL0ADi.js`
6. **NO debe ser**: `index-CfPyhIFR.js` (versión vieja)

### Método 2: Probar la Funcionalidad
1. Login en tu sitio
2. Click en "Agregar Obra"
3. Sube una imagen
4. Si **NO** ves el error "longer than 1048487 bytes" → ✅ Deploy exitoso

---

## ⚡ Ventajas de este Método

- ✅ No necesitas terminal
- ✅ No necesitas Firebase CLI
- ✅ No necesitas configurar secrets
- ✅ Visual y fácil (drag & drop)
- ✅ Instantáneo (2-3 minutos)

---

## 📞 Si Necesitas Ayuda

Si no encuentras la opción de drag & drop en Firebase Console:
1. Toma un screenshot de tu pantalla en Firebase Console
2. Envíamelo y te guío exactamente

---

**La carpeta `dist` está lista. Solo necesitas descargarla y arrastrarla a Firebase Console.**
