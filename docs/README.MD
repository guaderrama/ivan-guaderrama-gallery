# 📚 Documentación del Proyecto - Ivan Guaderrama Art Gallery

## 🎯 Propósito

Esta carpeta contiene la documentación técnica completa para la expansión del backend. Los documentos fueron generados por un Arquitecto de Software para migrar un prototipo inseguro a una solución robusta en Firebase.

---

## 📋 Los documentos principales

### 1️⃣ 01-PLAN_DE_DESARROLLO_PRD.md (LEER PRIMERO)

**Rol:** Product Manager + Arquitecto  
**Qué contiene:**
- ✅ Visión general y perfiles de usuario (Admin, Visitante)
- ✅ Características Backend [B.1-B.8] y Frontend [F.1-F.7]
- ✅ Flujo de usuario principal
- ✅ Definición de Épicas
- ✅ Arquitectura técnica visual
- ✅ Modelo de datos Firestore
- ✅ Backlog priorizado

**Por qué leerlo primero:** Define el "qué" y el "por qué" del proyecto. Contexto completo del negocio y necesidades de seguridad.

---

### 2️⃣ 02-ARQUITECTURA_TECNICA.md (LEER SEGUNDO)

**Rol:** Arquitecto de Software  
**Qué contiene:**
- ✅ Servicios Firebase recomendados (Auth, Firestore, Functions, Storage, Hosting)
- ✅ Modelo de datos JSON con ejemplos completos:
  - Colección `artworks` (obras únicas + series)
  - Subcolección `pieces` (instancias numeradas)
  - Colección `generatedNames` (banco de ideas IA)
  - Colección `users` (roles admin)
- ✅ 3 Cloud Functions detalladas:
  1. `generateArtNames` (Callable - proxy Gemini)
  2. `processBulkArtUpload` (Storage trigger - CSV masivo)
  3. `onArtworkUpdate` (Firestore trigger - consistencia)
- ✅ Reglas de seguridad Firestore (código completo)

**Por qué leerlo segundo:** Es la fuente de verdad técnica. Define estructura de base de datos y cómo resolver problemas del PRD.

⚠️ **Nota sobre nomenclatura:** Este documento usa `pieces` para la subcolección. **USAR SIEMPRE `pieces`** como estándar.

---

### 3️⃣ 03-LISTA_DE_TAREAS.md (LEER TERCERO)

**Rol:** Tech Lead  
**Qué contiene:**
- ✅ Análisis del prototipo actual
- ✅ Diagrama ASCII de arquitectura completa
- ✅ Checklist Backend (5 secciones):
  1. Configuración Firebase
  2. Base de datos Firestore
  3. Autenticación
  4. Cloud Functions
  5. Cloud Storage
- ✅ Checklist Frontend (5 secciones):
  1. Integración Firebase
  2. Refactorización seguridad
  3. Auth y rutas protegidas
  4. Panel administración
  5. Galería pública
- ✅ Análisis vulnerabilidades código actual

**Por qué leerlo tercero:** Convierte arquitectura en pasos concretos de implementación.

---

## 🔄 Orden de lectura para Claude

### FASE 1: Configuración y Estándares
1. `@CLAUDE.md` - Principios de desarrollo
2. `@.claude/INDEX.md` - Sistema de configuración
3. `@.claude/docs/ARCHITECTURE.md` - Arquitectura Feature-First
4. `@.claude/docs/WORKFLOW.md` - Proceso PLAN → DIFFS → VERIFY

### FASE 2: Requisitos del Backend
5. `@docs/requirements/01-PLAN_DE_DESARROLLO_PRD.md` - PRD maestro
6. `@docs/requirements/02-ARQUITECTURA_TECNICA.md` - Diseño técnico
7. `@docs/requirements/03-LISTA_DE_TAREAS.md` - Tareas accionables

### FASE 3: Código Existente
8. Analizar `@types.ts` - Tipos actuales
9. Analizar `@constants.ts` - Constantes
10. Revisar `@components/` - Componentes principales
11. Revisar `@services/geminiService.ts` - Servicio IA actual

---

## 💡 Información técnica clave

### Problema crítico:
El prototipo actual expone la **API Key de Gemini** en el cliente (index.html, importmap). Llamada directa a `@google/genai` desde navegador = **vulnerabilidad crítica**.

**Solución:** Mover lógica a Cloud Function proxy segura.

---

### Servicios Firebase necesarios:
1. **Authentication** - Email/Password admin
2. **Firestore** - Base de datos NoSQL
3. **Functions** - Lógica serverless (3 funciones)
4. **Storage** - Imágenes y CSV
5. **Hosting** - Deploy frontend

---

### Colecciones Firestore:
- **`artworks`** - Obras únicas y seriadas (`type: "unique" | "series"`)
  - **`pieces` (subcolección)** - Instancias numeradas ("5/50")
- **`generatedNames`** - Banco ideas IA (`name`, `promptUsed`, `isUsed`)
- **`users`** - Roles admin (`role: "admin"`)

---

### Cloud Functions:

#### 1. `generateArtNames` (HTTPS Callable)
- **Trigger:** Invocación directa cliente
- **Propósito:** Proxy seguro Gemini API
- **Flujo:**
  1. Cliente invoca con `prompt`
  2. Function valida usuario autenticado
  3. Llama Gemini con API key segura (Secret Manager)
  4. Guarda en `generatedNames`
  5. Retorna nombres
- **Seguridad:** Solo usuarios autenticados

#### 2. `processBulkArtUpload` (Storage Trigger)
- **Trigger:** Archivo CSV en `/uploads/artworks/`
- **Propósito:** Carga masiva desde CSV
- **Flujo:**
  1. CSV sube a Storage
  2. Function parsea archivo (papaparse)
  3. Valida datos
  4. Batch Write a Firestore
  5. Notifica resultado
- **Validación:** Chequeo formato CSV

#### 3. `onArtworkUpdate` (Firestore Trigger)
- **Trigger:** Update en `pieces/{pieceId}`
- **Propósito:** Consistencia estado serie
- **Flujo:**
  1. Pieza cambia a "sold"
  2. Recuenta piezas disponibles
  3. Si 0 disponibles, serie → "sold"

---

### Reglas de Seguridad:
- **Lectura pública:** Solo `status == 'active'`
- **Escritura admin:** Solo `role == 'admin'`
- **Banco ideas:** Privado (solo admin)
- **Helper:** `isAdmin()` valida rol en `users/{uid}`

📄 **Código en:** ARQUITECTURA_TECNICA.md sección 4

---

## 🎯 Objetivo final

Transformar prototipo inseguro en **aplicación Full-Stack segura**:

✅ Backend Firebase completo  
✅ Autenticación segura panel admin  
✅ Panel admin protegido (rutas privadas)  
✅ Galería pública tiempo real  
✅ Integración Gemini AI segura (sin exponer keys)  
✅ Carga masiva CSV  
✅ Soft-delete (campo `status`)

---

## ⚠️ Notas importantes

- ✅ Documentos en **español**
- ✅ Generados por Arquitecto Full-Stack profesional
- ✅ Decisiones arquitectónicas justificadas
- ⚠️ **Nomenclatura:** Usar **`pieces`** como estándar (no `prints` ni `instances`)
- ✅ Claude debe seguir estas especificaciones exactas
- ✅ **Prioridad máxima:** Refactorizar seguridad (eliminar Gemini del cliente)