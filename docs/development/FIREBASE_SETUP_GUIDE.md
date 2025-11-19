# 🔥 Guía de Configuración Firebase Console

**Proyecto:** ivan-guaderrama-gallery  
**Estado:** Archivos de configuración creados ✅ | Firebase Console pendiente ⏳

---

## 📋 Resumen Ejecutivo

Todos los archivos de configuración de Firebase han sido creados:
- ✅ `firebase.json` - Configuración principal
- ✅ `.firebaserc` - ID del proyecto
- ✅ `firestore.rules` - Reglas de seguridad Firestore
- ✅ `storage.rules` - Reglas de seguridad Storage
- ✅ `firestore.indexes.json` - Índices para queries
- ✅ `.env.local` - Variables de entorno

**Falta:** Habilitar servicios en Firebase Console (requiere acceso web)

---

## 🎯 Paso 1: Habilitar Authentication

### 1.1 Acceder a Firebase Console
1. Ve a: https://console.firebase.google.com/
2. Selecciona proyecto: **"ivan-guaderrama-gallery"**

### 1.2 Configurar Email/Password Authentication
1. En el menú lateral izquierdo, click **"Authentication"** (ícono 🔐)
2. Si es primera vez, click botón **"Get started"**
3. Ve a la pestaña **"Sign-in method"**
4. En la lista de providers, busca **"Email/Password"**
5. Click en **"Email/Password"**
6. **Habilita** el toggle superior "Enable"
7. **NO habilites** "Email link (passwordless sign-in)" por ahora
8. Click **"Save"**

**✅ Resultado esperado:** Email/Password debe aparecer como "Enabled" en la lista

---

## 🎯 Paso 2: Crear Firestore Database

### 2.1 Acceder a Firestore
1. En el menú lateral, click **"Firestore Database"** (ícono ☁️)
2. Click botón **"Create database"**

### 2.2 Seleccionar Modo
Verás dos opciones:

**Opción A - Production mode (RECOMENDADO)**
- ✅ Más seguro
- ✅ Usaremos las reglas custom que ya creamos
- Click "Production mode" → "Next"

**Opción B - Test mode**
- ⚠️ Menos seguro
- ⚠️ Expira en 30 días
- Solo para prototyping rápido

### 2.3 Seleccionar Ubicación (Location)
**IMPORTANTE:** Esta decisión es PERMANENTE

**Recomendación:**
- **us-central1** (Iowa) - Compatible con Cloud Functions free tier
- O selecciona la región más cercana a tu audiencia principal

Opciones comunes:
- `us-central1` - Central USA (mejor para free tier)
- `us-east1` - East USA
- `us-west1` - West USA
- `southamerica-east1` - São Paulo (más cercano a LATAM)

Click **"Enable"**

⏳ Espera 1-2 minutos mientras Firebase crea la base de datos

**✅ Resultado esperado:** Verás la interfaz de Firestore con 0 colecciones

---

## 🎯 Paso 3: Configurar Cloud Storage

### 3.1 Acceder a Storage
1. En el menú lateral, click **"Storage"** (ícono 📦)
2. Click botón **"Get started"**

### 3.2 Configurar Reglas
Verás dos opciones:

**Opción A - Production mode (RECOMENDADO)**
- Usaremos las reglas custom en `storage.rules`
- Click "Production mode" → "Next"

**Opción B - Test mode**
- Solo para development temporal

### 3.3 Confirmar Ubicación
- Debe ser **la misma ubicación que Firestore**
- No puedes cambiarla después
- Click **"Done"**

**✅ Resultado esperado:** Verás el bucket vacío de Storage

---

## 🎯 Paso 4: Desplegar Reglas de Seguridad

### 4.1 Verificar Firebase CLI
```bash
# Verificar que Firebase CLI está instalado
firebase --version
# Debe mostrar: 14.25.1 o superior
```

### 4.2 Login a Firebase
```bash
# En Project IDX, usa:
firebase login --no-localhost

# Sigue las instrucciones en el navegador
# Copia el código de autorización
```

### 4.3 Desplegar Reglas de Firestore
```bash
firebase deploy --only firestore:rules
```

**✅ Resultado esperado:**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/ivan-guaderrama-gallery/overview
```

### 4.4 Desplegar Reglas de Storage
```bash
firebase deploy --only storage:rules
```

### 4.5 Desplegar Índices de Firestore
```bash
firebase deploy --only firestore:indexes
```

---

## 🎯 Paso 5: Crear Usuario Admin Inicial

### 5.1 Vía Firebase Console (Método Manual)
1. Ve a **Authentication** → **Users**
2. Click **"Add user"**
3. Email: `tu-email@ejemplo.com`
4. Password: `TuPasswordSeguro123!`
5. Click **"Add user"**

### 5.2 Agregar Role Admin en Firestore
1. Ve a **Firestore Database**
2. Click **"Start collection"**
3. Collection ID: `users`
4. Click "Next"
5. Document ID: `[el UID del usuario que creaste]`
   - Copia el UID desde Authentication → Users
6. Agrega campos:
   - `email` (string): `tu-email@ejemplo.com`
   - `role` (string): `admin`
   - `createdAt` (timestamp): [auto]
7. Click **"Save"**

---

## 🎯 Paso 6: Verificar Configuración

### 6.1 Test de Conexión
```bash
# Verificar que .env.local tiene las credenciales
cat .env.local | grep VITE_FIREBASE

# Reiniciar dev server
npm run dev
```

### 6.2 Verificar en Navegador
1. Abre: http://localhost:3000
2. Abre DevTools (F12) → Console
3. **NO debe haber errores de Firebase**

**✅ Errores comunes:**
- `Firebase: Error (auth/project-not-found)` → Verifica .env.local
- `Missing or insufficient permissions` → Despliega las reglas
- `CORS error` → Verifica que el dominio está autorizado en Firebase

---

## 📊 Estado de los Servicios Configurados

### Reglas de Seguridad Firestore
**Archivo:** `firestore.rules`

**Permisos configurados:**
- ✅ **Galería pública:** Cualquiera puede ver obras con `status: 'active'`
- ✅ **Admin CRUD:** Solo admins pueden crear/editar/eliminar
- ✅ **Soft-delete:** Obras archivadas (`status: 'archived'`) solo visibles para admins
- ✅ **Ediciones numeradas:** Subcollection `artworks/{id}/pieces`
- ✅ **IA Naming:** Collection `generatedNames` (solo admins)

### Reglas de Seguridad Storage
**Archivo:** `storage.rules`

**Permisos configurados:**
- ✅ **Imágenes públicas:** Cualquiera puede VER `artworks/**`
- ✅ **Upload admin:** Solo admins pueden SUBIR a `artworks/**`
- ✅ **Temp folder:** Usuarios autenticados pueden subir a `temp/{userId}/`

### Índices Firestore
**Archivo:** `firestore.indexes.json`

**Queries optimizados:**
1. `artworks` por `status` + `category` + `createdAt` (DESC)
2. `artworks` por `status` + `createdAt` (DESC)
3. `pieces` (collection group) por `seriesId` + `editionNumber`

---

## 🚀 Próximos Pasos (Después de Setup)

Una vez completados los pasos anteriores:

1. **FASE 3:** Implementar servicios Frontend
   - Migrar `artworkService` de localStorage a Firestore
   - Implementar `editionsService`
   - Implementar `miniWorksService`

2. **FASE 4:** Implementar autenticación
   - Crear `AuthContext` y `useAuth` hook
   - Componentes Login/Logout
   - Proteger rutas de admin

3. **FASE 5:** Cloud Functions
   - Proxy seguro para Gemini API
   - Procesamiento de bulk uploads
   - Triggers automáticos

---

## ❓ Troubleshooting

### "Cannot find module 'firebase/app'"
```bash
npm install firebase@^10.13.0
```

### "Missing or insufficient permissions"
```bash
# Verificar que las reglas se desplegaron
firebase deploy --only firestore:rules storage:rules

# Ver logs de errores
firebase functions:log
```

### "Auth domain not authorized"
1. Ve a Authentication → Settings → Authorized domains
2. Agrega: `localhost`, `127.0.0.1`, tu dominio de producción

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa Firebase Console → Project Settings
2. Verifica que el proyecto ID coincide: `ivan-guaderrama-gallery`
3. Asegúrate que las credenciales en `.env.local` son correctas
4. Revisa la consola del navegador (F12) para errores específicos

---

**Última actualización:** 2025-11-19  
**Creado por:** Claude (Bucle Agéntico)
