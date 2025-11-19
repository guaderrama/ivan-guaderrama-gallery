# 🚀 FASE 5: Deployment Guide - Cloud Functions

**Proyecto:** Ivan Guaderrama Gallery
**Estado:** Functions implementadas, listas para deploy

---

## ✅ Lo que ya está listo

- ✅ 3 Cloud Functions implementadas
- ✅ TypeScript configurado
- ✅ package.json con scripts
- ✅ Error handling completo
- ✅ Documentación completa
- ✅ Emulators configurados

---

## 📋 Checklist de Deployment

### Prerequisitos (Ya completados)

- [x] Firebase CLI autenticado
- [x] Proyecto Firebase configurado
- [x] Functions code escrito
- [x] TypeScript configurado

### Pasos para Deploy

- [ ] **Paso 1:** Instalar dependencias
- [ ] **Paso 2:** Configurar Gemini API Key
- [ ] **Paso 3:** Build functions
- [ ] **Paso 4:** Deploy a Firebase
- [ ] **Paso 5:** Verificar deployment
- [ ] **Paso 6:** Testear en producción

---

## 🚀 PASO 1: Instalar Dependencias

```bash
cd functions
npm install
```

**Dependencias instaladas:**
- `firebase-admin` - Firebase Admin SDK
- `firebase-functions` - Functions SDK
- `@google/generative-ai` - Gemini API

**Tiempo:** ~2 minutos

---

## 🔑 PASO 2: Configurar Gemini API Key

### Opción A: Firebase Config (Recomendado)

```bash
# Configura tu API key de Gemini
firebase functions:config:set gemini.api_key="TU_GEMINI_API_KEY_AQUI"

# Verifica que se guardó
firebase functions:config:get
```

**¿Dónde conseguir Gemini API Key?**
1. Ve a: https://makersuite.google.com/app/apikey
2. Crea un API key
3. Cópiala

### Opción B: Variable de Entorno (Solo para testing local)

Crea `functions/.env.local`:

```env
GEMINI_API_KEY=tu-api-key-aqui
```

---

## 🏗️ PASO 3: Build Functions

```bash
# Desde /functions
npm run build

# O desde raíz
npm --prefix functions run build
```

**Resultado esperado:**
```
> functions@1.0.0 build
> tsc

✓ Compiled successfully
```

Verifica que se creó `functions/lib/index.js`.

---

## 🚀 PASO 4: Deploy a Firebase

### Deploy Completo

```bash
# Desde raíz del proyecto
firebase deploy --only functions
```

**Proceso:**
1. Build automático (via predeploy)
2. Upload de functions
3. Deployment a Cloud Functions
4. URLs generadas

**Resultado esperado:**
```
✔  functions: Finished running predeploy script.
i  functions: ensuring required API cloudfunctions.googleapis.com is enabled...
✔  functions: required API cloudfunctions.googleapis.com is enabled
i  functions: preparing functions directory for uploading...
i  functions: packaged functions (X KB) for uploading
✔  functions: functions folder uploaded successfully
i  functions: creating Node.js 20 function generateArtNames...
✔  functions[generateArtNames]: Successful create operation.
i  functions: creating Node.js 20 function processBulkArtUpload...
✔  functions[processBulkArtUpload]: Successful create operation.
i  functions: creating Node.js 20 function onArtworkUpdate...
✔  functions[onArtworkUpdate]: Successful create operation.

✔  Deploy complete!

Functions:
  generateArtNames: https://us-central1-ivan-guaderrama-gallery.cloudfunctions.net/generateArtNames
  processBulkArtUpload: https://us-central1-ivan-guaderrama-gallery.cloudfunctions.net/processBulkArtUpload
```

**Tiempo:** 3-5 minutos

### Deploy Solo una Function

```bash
firebase deploy --only functions:generateArtNames
```

---

## ✅ PASO 5: Verificar Deployment

### Ver Functions Desplegadas

```bash
firebase functions:list
```

**Resultado esperado:**
```
┌─────────────────────────┬──────────────┬─────────┐
│ Name                    │ Type         │ State   │
├─────────────────────────┼──────────────┼─────────┤
│ generateArtNames        │ callable     │ ACTIVE  │
│ processBulkArtUpload    │ callable     │ ACTIVE  │
│ onArtworkUpdate         │ firestore    │ ACTIVE  │
└─────────────────────────┴──────────────┴─────────┘
```

### Ver en Firebase Console

1. Ve a: https://console.firebase.google.com/
2. Selecciona proyecto: ivan-guaderrama-gallery
3. Build → Functions
4. Deberías ver las 3 functions listadas

---

## 🧪 PASO 6: Testear en Producción

### Test 1: generateArtNames

En la consola del navegador (F12) con tu app corriendo:

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const generateNames = httpsCallable(functions, 'generateArtNames');

// IMPORTANTE: Debes estar logueado como admin
const result = await generateNames({
  prompt: 'Modern abstract sculpture',
  count: 3
});

console.log(result.data);
// { success: true, names: [...], count: 3 }
```

**Errores comunes:**

| Error | Causa | Solución |
|-------|-------|----------|
| `unauthenticated` | No estás logueado | Login primero |
| `permission-denied` | No eres admin | Verifica role en Firestore |
| `failed-precondition` | API key no configurada | Paso 2 |

### Test 2: Verificar Logs

```bash
firebase functions:log
```

Deberías ver logs de la invocación.

---

## 📊 Monitoreo

### Ver Logs en Tiempo Real

```bash
firebase functions:log --follow
```

### Ver Métricas

En Firebase Console → Functions → Selecciona function → Pestaña "Metrics"

Verás:
- Invocations
- Execution time
- Memory usage
- Errors

---

## 🔧 Actualizar Functions

Si haces cambios en el código:

```bash
# 1. Build
cd functions && npm run build

# 2. Deploy
cd .. && firebase deploy --only functions

# O en un solo comando
firebase deploy --only functions
```

---

## 💡 Comandos Útiles

```bash
# Ver configuración actual
firebase functions:config:get

# Ver lista de functions
firebase functions:list

# Ver logs
firebase functions:log

# Ver logs de una function específica
firebase functions:log --only generateArtNames

# Delete una function
firebase functions:delete functionName

# Test local con emulators
firebase emulators:start --only functions
```

---

## 🐛 Troubleshooting

### Error: "Build failed"

```bash
cd functions
npm run build
# Ver errores de TypeScript
```

### Error: "API not enabled"

```bash
# Habilitar Cloud Functions API
gcloud services enable cloudfunctions.googleapis.com
```

### Error: "Insufficient permissions"

Verifica que tu cuenta tiene permisos de Editor o Owner en el proyecto Firebase.

### Functions no aparecen después de deploy

1. Espera 2-3 minutos (puede tardar)
2. Verifica logs: `firebase functions:log`
3. Revisa Firebase Console

### CORS errors

Las callable functions manejan CORS automáticamente. Si tienes problemas:

```typescript
// En frontend, asegúrate de usar getFunctions del SDK
import { getFunctions } from 'firebase/functions';
const functions = getFunctions();
```

---

## 🔒 Security Checklist Post-Deploy

- [ ] Gemini API key configurada y no expuesta
- [ ] Functions requieren autenticación
- [ ] Role checks funcionando (solo admins)
- [ ] Error messages no exponen información sensible
- [ ] Logs no contienen datos sensibles

---

## 📈 Next Steps

Una vez desplegadas las functions:

### 1. Integrar en Frontend

Actualiza los componentes existentes para usar las functions:

**`GenerateNameModal.tsx`** debe cambiar de:
```typescript
// ❌ ANTES: Llamada directa a Gemini
import { GoogleGenerativeAI } from '@google/genai';
const genAI = new GoogleGenerativeAI(apiKey); // API key expuesta!
```

A:
```typescript
// ✅ DESPUÉS: Via Cloud Function
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/shared/lib/firebase';

const generateNames = httpsCallable(functions, 'generateArtNames');
const result = await generateNames({ prompt, count });
```

### 2. Remover Gemini del Cliente

```bash
# Remover dependencia insegura
npm uninstall @google/genai

# Remover del .env.local
# VITE_GEMINI_API_KEY=... (ya no se usa)
```

### 3. Testing Completo

- [ ] Test generateArtNames con diferentes prompts
- [ ] Test bulk upload con CSV real
- [ ] Verificar que solo admins pueden llamar
- [ ] Verificar que triggers funcionan

---

## 🎉 Deployment Completo

Cuando hayas completado todos los pasos:

```bash
✅ Functions desplegadas
✅ Gemini API key configurada
✅ Testing exitoso
✅ Frontend actualizado
✅ Seguridad verificada
```

**¡FASE 5 COMPLETADA!**

---

**Siguiente:** Actualizar frontend para usar las functions (FASE 6)

---

## 📞 Soporte

### Documentación

- **Functions README:** `functions/README.md`
- **Firebase Docs:** https://firebase.google.com/docs/functions

### Comandos de ayuda

```bash
firebase functions:help
firebase deploy --help
firebase functions:config:help
```

---

**Última actualización:** 2025-11-19
**Estado:** ✅ Listo para deployment
