¡Excelente! Como Arquitecto de Software Full-Stack, he completado el análisis del prototipo y del plan de producto. A continuación, presento los tres artefactos de desarrollo clave para guiar la expansión del proyecto con un backend de Firebase.

### **Análisis del Arquitecto (Razonamiento Interno)**

1.  **Análisis del Frontend:**
    *   **UI y Componentes:** El `index.html` confirma una aplicación React moderna que utiliza Tailwind CSS para el estilismo. El `index.tsx` es solo el punto de entrada, lo que implica que la lógica principal reside en un componente `<App />` (no proporcionado). La dependencia `@google/genai` en el `importmap` es la clave: confirma que el prototipo realiza llamadas a la API de Gemini **directamente desde el cliente**.
    *   **Manejo de Estado:** Es muy probable que se utilice `useState` para manejar el `prompt` del usuario y la lista de `resultados` generados por la IA. Esta lista de resultados es el candidato perfecto para ser persistida en el "Banco de Ideas".
    *   **Llamadas a API:** La llamada directa a Gemini desde el cliente es una **vulnerabilidad de seguridad crítica**. La clave de la API está expuesta en el navegador. La primera y más importante acción de la arquitectura backend será mover esta lógica a una Cloud Function.

2.  **Diseño de la Arquitectura Backend (Firebase):**
    *   **Autenticación (`Firebase Authentication`):** El "panel de control privado" requiere un sistema de inicio de sesión. Firebase Authentication con proveedor de Email/Contraseña es la solución estándar, segura y rápida de implementar.
    *   **Base de Datos (`Cloud Firestore`):** La naturaleza estructurada de los datos (obras, series, ideas) encaja perfectamente con el modelo de colecciones y documentos de Firestore.
        *   **Obras Únicas:** Una colección `artworks` donde cada documento es una obra. Se añadirá un campo `status` (`'active'`, `'archived'`, `'deleted'`) para gestionar la "Papelera y Archivo".
        *   **Obras Seriadas:** Este es un caso de relación uno-a-muchos. La mejor práctica es una colección `series` para los datos generales de la serie, y una **subcolección** `instances` dentro de cada documento de serie para gestionar las copias individuales.
        *   **Banco de Ideas:** Una colección simple `generatedNames` para almacenar cada nombre generado, junto con el prompt que lo creó para dar contexto.
    *   **Lógica de Servidor (`Cloud Functions`):** Son esenciales para la seguridad y para tareas complejas.
        *   **Función para Gemini:** Una **Función Callable** (`generateArtNames`) que será invocada desde el cliente. Esta función (y solo esta función) tendrá acceso seguro a la clave de la API de Gemini (almacenada en Secret Manager), realizará la llamada y guardará los resultados en Firestore. Estará protegida para que solo usuarios autenticados puedan invocarla.
        *   **Función de Carga Masiva:** Una **Función Callable** (`bulkUploadArtworks`) que recibirá la ruta de un archivo CSV/Excel subido a Storage, lo procesará en el servidor y creará los documentos en Firestore en un lote. Esto es más robusto y eficiente que hacer cientos de escrituras desde el cliente.
    *   **Almacenamiento de Archivos (`Cloud Storage`):** Ideal para las fotos de las obras y los archivos de carga masiva. Se configurarán reglas de seguridad para proteger el acceso.

---

## Artefacto 1: Product Requirements Document (PRD) Técnico

**Documento:** PRD - V2 - Galería - Backend
**Autor:** Arquitecto de Software Full-Stack
**Versión:** 1.0

### 1. Visión General y Objetivos

Este documento traduce el "Plan Sencillo" a requisitos técnicos específicos para construir un backend escalable en Firebase. El objetivo es centralizar la gestión del inventario de arte, asegurar la lógica de negocio y proteger los recursos (como las claves de API), sentando las bases para futuras funcionalidades.

### 2. Épicas y Requisitos Funcionales

| Épica | ID | Requisito Funcional | Criterios de Aceptación |
| :--- | :-: | :--- | :--- |
| **Gestión de Autenticación** | AUTH-01 | **Portal de Administrador Seguro:** El sistema debe proveer una interfaz de inicio de sesión para los administradores. | - Solo los usuarios con credenciales válidas (email/contraseña) pueden acceder al panel de control.<br>- Las rutas del panel de administrador deben estar protegidas contra acceso no autorizado. |
| **Gestión de Obras** | ART-01 | **CRUD de Obras Únicas:** El administrador debe poder crear, leer, actualizar y archivar/eliminar obras de arte únicas a través de un formulario. | - El formulario debe contener campos para: nombre, imagen, precio, categoría, medidas, peso, costos de envío.<br>- La "eliminación" debe ser un borrado lógico (soft-delete), cambiando el estado de la obra a `deleted`. |
| | ART-02 | **Carga Masiva de Obras Únicas:** El administrador debe poder subir un archivo (CSV) para crear múltiples obras de arte en una sola operación. | - La UI debe permitir seleccionar y subir un archivo CSV a Firebase Storage.<br>- Una Cloud Function debe procesar el archivo, validar los datos y crear los documentos correspondientes en Firestore. |
| | ART-03 | **CRUD de Obras Seriadas:** El administrador debe poder gestionar series de obras y sus instancias individuales. | - Se debe poder crear una "Serie" con sus datos generales (nombre, foto).<br>- Dentro de una serie, se deben poder gestionar sus "Instancias" (marcar como vendida, registrar comprador, ubicación). |
| **Integración con IA** | GENAI-01 | **Generador de Nombres Seguro:** La funcionalidad de generación de nombres con IA debe operar a través del backend para proteger la clave de la API. | - El cliente ya no llamará directamente a la API de Gemini.<br>- El cliente invocará una Cloud Function autenticada, pasándole el prompt.<br>- La Cloud Function ejecutará la llamada a la API y devolverá el resultado. |
| | GENAI-02 | **Persistencia de Ideas (Banco de Ideas):** Los nombres generados por la IA deben ser guardados automáticamente en la base de datos. | - Cada vez que la Cloud Function `generateArtNames` se ejecuta con éxito, los nombres resultantes se guardan como nuevos documentos en la colección `generatedNames` de Firestore. |
| **Visualización Pública** | VIEW-01 | **Galería en Tiempo Real:** La galería pública debe mostrar la información de las obras directamente desde Firestore. | - La web pública leerá las colecciones `artworks` y `series` para mostrar el catálogo.<br>- Cualquier cambio realizado en el panel de administrador (ej. cambio de precio) se reflejará en tiempo real en la web pública. |

---

## Artefacto 2: Diagrama de Arquitectura Técnica

```text
+------------------------------------------------------------------------------------------------+
|                               Cliente (Navegador Web - React App)                              |
|                                                                                                |
|    +-----------------------------+                 +----------------------------------------+  |
|    |       Galería Pública       |                 | Panel de Administrador (Ruta Protegida)|  |
|    |      (Lectura Anónima)      |                 |       (Requiere Autenticación)         |  |
|    +-----------------------------+                 +----------------------------------------+  |
|    | - Visualiza Obras Únicas    |                 | - Login/Logout UI (Firebase SDK Auth)  |  |
|    | - Visualiza Obras Seriadas  |                 | - Formulario CRUD Obras (Firestore)    |  |
|    |                             |                 | - Formulario CRUD Series (Firestore)   |  |
|    |                             |                 | - UI Carga Masiva (Sube a Storage)     |  |
|    |                             |                 | - UI Generador Nombres (Cloud Func)    |  |
+----+-------------+---------------+-----------------+----------+-------------------------+------+
     |             |                                            |                         |
     | Real-time   | HTTPS                                      | HTTPS                   |
     | (onSnapshot)| (Callable Functions)                       | (CRUD, Uploads)         |
     |             |                                            |                         |
+----+-------------v--------------------------------------------v-------------------------v------+
|                          Backend (Plataforma Firebase)                                         |
|                                                                                                |
|    +-----------------------------+   +---------------------------+   +--------------------+    |
|    |   Firebase Authentication   |   |      Cloud Functions      |   |   Cloud Firestore  |    |
|    |-----------------------------|   |---------------------------|   |--------------------|    |
|    | - Proveedor Email/Pass      |   | o generateArtNames        |   | /artworks          |    |
|    | - Reglas de Acceso          |   |   - Valida Auth           |   | { name, price... } |    |
|    +-----------------------------+   |   - Llama a Gemini API    |   |                    |    |
|                                      |   - Escribe en Firestore  |   | /series            |    |
|    +-----------------------------+   |                           |   | { seriesName... }  |    |
|    |       Cloud Storage         |   | o bulkUploadArtworks      |   |  /instances        |    |
|    |-----------------------------|   |   - Valida Auth           |   |  { instanceNum... }|    |
|    | - /art-images/ (público)    |   |   - Lee de Storage        |   |                    |    |
|    | - /uploads/ (privado)       |   |   - Procesa CSV           |   | /generatedNames    |    |
|    +-----------------------------+   |   - Escribe en Firestore  |   | { name, prompt... }|    |
|                                      +---------------------------+   +--------------------+    |
|                                         (SDK de Servidor)                                      |
+---------------------------------------------+--------------------------------------------------+
                                              |
                                              v
+------------------------------------------------------------------------------------------------+
|                                    Servicios Externos                                          |
|                                                                                                |
|        +-----------------------------+                 +------------------------------------+  |
|        |      Google Gemini API      |                 |        Google Secret Manager       |  |
|        | (Llamada desde Cloud Func)  |                 | (Almacena segura la clave Gemini)  |  |
|        +-----------------------------+                 +------------------------------------+  |
|                                                                                                |
+------------------------------------------------------------------------------------------------+
```

---

## Artefacto 3: Lista de Tareas de Desarrollo (Actionable Task List)

**Rol:** Tech Lead
**Tarea:** Basado en el PRD y la arquitectura, aquí está la lista de tareas de desarrollo accionable para el equipo.

### Tareas de Backend (Firebase)

- [ ] **1. Configuración del Proyecto Firebase:**
    - [ ] Crear un nuevo proyecto en la consola de Firebase.
    - [ ] Configurar el entorno local con Firebase CLI (`firebase-tools`).
    - [ ] Inicializar Firestore, Cloud Functions, Storage y Authentication en el proyecto.
- [ ] **2. Configuración de la Base de Datos (Firestore):**
    - [ ] Definir y modelar las colecciones: `artworks`, `series` (con subcolección `instances`), y `generatedNames`.
    - [ ] Escribir y desplegar las Reglas de Seguridad de Firestore para:
        - Permitir lectura pública para `artworks` y `series`.
        - Requerir autenticación para escribir/modificar cualquier colección.
- [ ] **3. Implementación de Autenticación:**
    - [ ] Habilitar el proveedor de "Email y Contraseña" en Firebase Authentication.
- [ ] **4. Desarrollo de Cloud Functions (Node.js/TypeScript):**
    - [ ] **Función `generateArtNames` (Callable):**
        - [ ] Inicializar el proyecto de Cloud Functions.
        - [ ] Implementar la lógica para recibir un `prompt`.
        - [ ] Añadir un chequeo de autenticación para asegurar que solo usuarios logueados puedan llamarla.
        - [ ] Integrar el SDK de Google AI y configurar el acceso a la clave de API a través de Secret Manager.
        - [ ] Realizar la llamada a la API de Gemini.
        - [ ] Guardar los resultados generados en la colección `generatedNames`.
        - [ ] Devolver los resultados al cliente.
    - [ ] **Función `bulkUploadArtworks` (Callable):**
        - [ ] Implementar la lógica para recibir una ruta de archivo en Cloud Storage.
        - [ ] Añadir chequeo de autenticación.
        - [ ] Usar el SDK de Admin para leer y parsear el archivo CSV desde Storage.
        - [ ] Implementar un `batch write` para crear eficientemente los documentos en la colección `artworks`.
        - [ ] Añadir manejo de errores y validación de datos del CSV.
- [ ] **5. Configuración de Cloud Storage:**
    - [ ] Escribir y desplegar las Reglas de Seguridad de Storage para:
        - Permitir lectura pública de imágenes en un bucket `art-images/`.
        - Permitir escritura autenticada en un bucket `uploads/` (solo el usuario puede subir a su propia carpeta).

### Tareas de Frontend (React)

- [ ] **1. Integración de Firebase:**
    - [ ] Instalar el SDK de Firebase (`npm install firebase`).
    - [ ] Crear un archivo de configuración (`firebaseConfig.ts`) con las claves del proyecto y exportar las instancias de los servicios (auth, firestore, functions, storage).
- [ ] **2. Refactorización Crítica de Seguridad:**
    - [ ] **Eliminar la llamada directa a Gemini:**
        - Remover la dependencia `@google/genai` del `importmap` y del código.
        - Modificar el componente del generador de nombres para que, en lugar de llamar a Gemini, invoque la Cloud Function `generateArtNames` usando el SDK de Firebase.
- [ ] **3. Flujo de Autenticación y Rutas Protegidas:**
    - [ ] Crear componentes para el formulario de Login y la lógica de Logout.
    - [ ] Implementar un hook o contexto global (`useAuth`) para gestionar el estado de autenticación del usuario en toda la app.
    - [ ] Configurar un enrutador (ej. React Router) para crear rutas protegidas para el panel de administración.
- [ ] **4. Construcción del Panel de Administración:**
    - [ ] **Módulo de Obras Únicas (CRUD):**
        - [ ] Crear una vista de tabla/lista que lea y muestre datos de la colección `artworks`.
        - [ ] Construir un formulario (crear/editar) para escribir/actualizar documentos en `artworks`.
        - [ ] Implementar la lógica de los botones "Archivar" y "Eliminar" (que actualizan el campo `status`).
        - [ ] Integrar la subida de imágenes a Cloud Storage al crear/editar una obra.
    - [ ] **Módulo de Obras Seriadas (CRUD):**
        - [ ] Crear una vista para listar las `series`.
        - [ ] Crear una vista de detalle para una serie que liste sus `instances` desde la subcolección.
        - [ ] Implementar formularios para crear/editar series y para actualizar el estado de las instancias.
    - [ ] **Módulo de Carga Masiva:**
        - [ ] Crear un componente de UI con un `<input type="file">`.
        - [ ] Al seleccionar un archivo, subirlo a la ruta `uploads/{userId}/{fileName}` en Cloud Storage.
        - [ ] Tras una subida exitosa, invocar la Cloud Function `bulkUploadArtworks` con la ruta del archivo.
        - [ ] Mostrar feedback al usuario (progreso, éxito, error).
    - [ ] **Módulo Banco de Ideas:**
        - [ ] Crear una vista simple que lea y muestre en tiempo real la colección `generatedNames`.
- [ ] **5. Actualización de la Galería Pública:**
    - [ ] Modificar los componentes de la galería para que obtengan los datos de las obras desde Firestore en tiempo real usando `onSnapshot`.
    - [ ] Asegurarse de que solo se muestren las obras con `status: 'active'`.