# 🔥 FASE 2: Setup Firebase Console - Guía Interactiva

**Proyecto:** Ivan Guaderrama Gallery
**Estado:** Listo para configurar servicios en Firebase Console

---

## ✅ Pre-requisitos (Ya completados)

- ✅ Proyecto Firebase creado: `ivan-guaderrama-gallery`
- ✅ Credenciales en `.env.local`
- ✅ Archivos de configuración creados
- ✅ Reglas de seguridad escritas
- ✅ Código frontend listo

---

## 📋 Checklist de FASE 2

- [ ] **Paso 1:** Habilitar Authentication (Email/Password)
- [ ] **Paso 2:** Crear Firestore Database
- [ ] **Paso 3:** Configurar Cloud Storage
- [ ] **Paso 4:** Autenticar Firebase CLI
- [ ] **Paso 5:** Desplegar Reglas de Seguridad
- [ ] **Paso 6:** Crear Usuario Admin Inicial
- [ ] **Paso 7:** Verificar Integración

---

## 🚀 PASO 1: Habilitar Authentication

### 1.1 Acceder a Firebase Console

1. Abre: https://console.firebase.google.com/
2. Selecciona el proyecto: **"ivan-guaderrama-gallery"**

### 1.2 Configurar Email/Password

1. En el menú lateral izquierdo, busca **"Build"** (🔨)
2. Click en **"Authentication"** (icono de llave 🔐)
3. Si es primera vez, click en botón **"Get started"**
4. Ve a la pestaña **"Sign-in method"** (en la parte superior)
5. En la lista de providers, busca **"Email/Password"**
6. Click sobre **"Email/Password"**
7. Verás un modal con dos toggles:
   - ✅ **Habilita el primer toggle** "Email/Password" (Enable)
   - ❌ **NO habilites** "Email link (passwordless sign-in)"
8. Click en **"Save"**

### ✅ Verificación

Deberías ver "Email/Password" con estado **"Enabled"** en la lista.

**Screenshot de referencia:**
```
Sign-in method
┌────────────────────────────────────┐
│ Email/Password          [Enabled] │ ← Debe decir Enabled
│ Google                  [Disabled]│
│ Anonymous               [Disabled]│
└────────────────────────────────────┘
```

---

## 🚀 PASO 2: Crear Firestore Database

### 2.1 Acceder a Firestore

1. En el mismo proyecto, en el menú lateral busca **"Build"**
2. Click en **"Firestore Database"** (icono de nube ☁️)
3. Click en botón **"Create database"**

### 2.2 Seleccionar Modo de Reglas

Verás dos opciones:

**✅ Selecciona: Production mode** (Recomendado)
- Más seguro
- Usaremos nuestras reglas custom (ya escritas)
- Click **"Next"**

⚠️ **NO selecciones "Test mode"** (expira en 30 días)

### 2.3 Seleccionar Ubicación (IMPORTANTE)

**Esta decisión es PERMANENTE - No se puede cambiar después**

**Opciones recomendadas:**

| Región | Ventajas | Desventajas |
|--------|----------|-------------|
| **us-central1** (Iowa) | ✅ Compatible con Cloud Functions free tier<br>✅ Mejor precio | ⚠️ Lejos de LATAM |
| **southamerica-east1** (São Paulo) | ✅ Más cercano a LATAM<br>✅ Menor latencia | ⚠️ No en free tier de Functions |
| **us-east1** (South Carolina) | ✅ Balance precio/ubicación | Neutral |

**Mi recomendación: `us-central1`**
- Mejor para free tier
- Latencia aceptable (~150-200ms desde LATAM)
- Podemos usar Cloud Functions gratis

1. Selecciona **"us-central1"** en el dropdown
2. Click **"Enable"**

### 2.4 Esperar Creación

⏳ Espera 1-2 minutos mientras Firebase crea la base de datos.

### ✅ Verificación

Deberías ver la interfaz de Firestore con:
- Panel de colecciones (vacío por ahora)
- Botón "Start collection"
- Mensaje "No documents to display"

---

## 🚀 PASO 3: Configurar Cloud Storage

### 3.1 Acceder a Storage

1. En el menú lateral, busca **"Build"**
2. Click en **"Storage"** (icono de carpeta 📦)
3. Click en botón **"Get started"**

### 3.2 Configurar Reglas

Verás dos opciones:

**✅ Selecciona: Production mode** (Recomendado)
- Usaremos nuestras reglas custom (ya escritas en `storage.rules`)
- Click **"Next"**

### 3.3 Confirmar Ubicación

⚠️ **IMPORTANTE:** Debe ser la MISMA ubicación que Firestore

- Debería aparecer pre-seleccionada: **us-central1**
- Si no, selecciona la misma que usaste para Firestore
- Click **"Done"**

### ✅ Verificación

Deberías ver:
- Bucket principal: `ivan-guaderrama-gallery.appspot.com`
- Panel de archivos (vacío)
- Botón "Upload file"

---

## 🚀 PASO 4: Autenticar Firebase CLI

Ahora vamos a conectar tu terminal local con Firebase para poder desplegar las reglas.

### 4.1 Verificar Firebase CLI

En tu terminal, ejecuta:

```bash
firebase --version
```

**Resultado esperado:** `14.25.1` o superior

### 4.2 Login en Firebase

**IMPORTANTE:** Usa el flag `--no-localhost` porque estás en Project IDX:

```bash
firebase login --no-localhost
```

**Proceso:**

1. El comando mostrará una URL y un código
2. **Copia la URL** y ábrela en tu navegador
3. **Inicia sesión** con la cuenta de Google que usaste para Firebase
4. **Autoriza** Firebase CLI
5. Te mostrará un código de autorización
6. **Copia el código** y pégalo en la terminal
7. Presiona Enter

### ✅ Verificación

Ejecuta:

```bash
firebase projects:list
```

Deberías ver tu proyecto `ivan-guaderrama-gallery` en la lista.

---

## 🚀 PASO 5: Desplegar Reglas de Seguridad

Ahora vamos a desplegar las reglas de seguridad que ya escribimos.

### 5.1 Verificar Archivos de Reglas

```bash
ls -la | grep -E "(firebase\.json|firestore\.rules|storage\.rules)"
```

**Deberías ver:**
- `firebase.json`
- `firestore.rules`
- `storage.rules`
- `firestore.indexes.json`

### 5.2 Desplegar Reglas de Firestore

```bash
firebase deploy --only firestore:rules
```

**Resultado esperado:**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/ivan-guaderrama-gallery/overview
```

### 5.3 Desplegar Reglas de Storage

```bash
firebase deploy --only storage:rules
```

**Resultado esperado:**
```
✔  Deploy complete!
```

### 5.4 Desplegar Índices de Firestore

```bash
firebase deploy --only firestore:indexes
```

**Resultado esperado:**
```
✔  Deploy complete!
```

### ✅ Verificación en Console

1. Ve a Firestore Database → Rules
2. Deberías ver tu archivo `firestore.rules` desplegado
3. Ve a Storage → Rules
4. Deberías ver tu archivo `storage.rules` desplegado

---

## 🚀 PASO 6: Crear Usuario Admin Inicial

Ahora vamos a crear el primer usuario administrador.

### 6.1 Opción A: Crear desde App (Recomendado)

1. **Inicia el dev server** si no está corriendo:
   ```bash
   npm run dev
   ```

2. **Abre la app** en tu navegador: http://localhost:3000

3. **En el componente que uses**, integrará el login form:
   - Email: `admin@ivanguaderrama.com` (o el que prefieras)
   - Password: `Admin123!` (mínimo 6 caracteres)
   - Click "Sign Up"

4. **Copia el UID** que aparecerá en la consola del navegador (F12)

### 6.2 Opción B: Crear desde Firebase Console

1. Ve a Authentication → Users
2. Click **"Add user"**
3. Email: `admin@ivanguaderrama.com`
4. Password: `Admin123!`
5. Click **"Add user"**
6. **Copia el UID** del usuario recién creado

### 6.3 Asignar Role Admin en Firestore

1. Ve a **Firestore Database**
2. Click **"Start collection"** (o "+ Start collection")
3. **Collection ID:** `users`
4. Click "Next"
5. **Document ID:** Pega el UID que copiaste
6. **Agregar campos:**
   - Field: `uid` (string) → Valor: [el mismo UID]
   - Field: `email` (string) → Valor: `admin@ivanguaderrama.com`
   - Field: `role` (string) → Valor: `admin`
   - Field: `createdAt` (timestamp) → Click "Add field" → Selecciona tipo "timestamp" → Automático
   - Field: `updatedAt` (timestamp) → Click "Add field" → Selecciona tipo "timestamp" → Automático
7. Click **"Save"**

### ✅ Verificación

1. Logout si estás logueado
2. Login con las credenciales admin
3. En la consola del navegador (F12), ejecuta:
   ```javascript
   // Debería mostrar role: 'admin'
   console.log(firebase.auth().currentUser);
   ```

---

## 🚀 PASO 7: Verificar Integración Completa

### 7.1 Test de Conexión Firebase

```bash
npm run dev
```

Abre http://localhost:3000 y verifica:

1. **NO debe haber errores de Firebase** en la consola (F12)
2. Si hay login form, intenta login
3. Verifica que no aparezca: `Firebase: Error (auth/project-not-found)`

### 7.2 Test de Firestore

En la consola del navegador (F12):

```javascript
// Test simple de Firestore
import { collection, addDoc } from 'firebase/firestore';
import { db } from './src/shared/lib/firebase';

// Crear un documento de prueba
const testDoc = await addDoc(collection(db, 'test'), {
  message: 'Hello from frontend!',
  timestamp: new Date()
});

console.log('Test document created:', testDoc.id);
```

Verifica en Firestore Console que apareció la collection `test`.

### 7.3 Test de Authentication

```javascript
// En la consola del navegador
import { auth } from './src/shared/lib/firebase';

console.log('Current user:', auth.currentUser);
console.log('Is signed in:', !!auth.currentUser);
```

---

## ✅ Checklist Final

Marca cada item cuando lo completes:

- [ ] ✅ Authentication habilitado (Email/Password)
- [ ] ✅ Firestore Database creado (us-central1)
- [ ] ✅ Cloud Storage configurado
- [ ] ✅ Firebase CLI autenticado
- [ ] ✅ Reglas Firestore desplegadas
- [ ] ✅ Reglas Storage desplegadas
- [ ] ✅ Índices Firestore desplegados
- [ ] ✅ Usuario admin creado
- [ ] ✅ Role admin asignado en Firestore
- [ ] ✅ App corre sin errores de Firebase
- [ ] ✅ Login funciona correctamente

---

## 🎉 ¡FASE 2 COMPLETADA!

Si todos los checkboxes están marcados, has completado exitosamente la configuración de Firebase Console.

**Siguiente paso:** FASE 5 - Cloud Functions

---

## 🐛 Troubleshooting

### Error: "Firebase CLI not authenticated"

```bash
firebase logout
firebase login --no-localhost
```

### Error: "Permission denied" al desplegar reglas

Verifica que la cuenta logueada en Firebase CLI sea la misma que es owner del proyecto.

```bash
firebase login:list
```

### Error: "Project not found"

Verifica que `.firebaserc` tenga el project ID correcto:

```bash
cat .firebaserc
```

Debe mostrar:
```json
{
  "projects": {
    "default": "ivan-guaderrama-gallery"
  }
}
```

### Usuario no puede login después de crearlo

1. Verifica en Authentication → Users que el usuario existe
2. Verifica que el password tenga mínimo 6 caracteres
3. Revisa errores en la consola del navegador (F12)

---

**Última actualización:** 2025-11-19
**Creado por:** Claude (Bucle Agéntico)
