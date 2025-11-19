¡Excelente! Actuando como un Arquitecto de Software Full-Stack de élite, he analizado el prototipo y el plan de producto. El código del frontend es un esqueleto básico, pero la inclusión de la dependencia `@google/genai` y el plan de producto me dan toda la información necesaria para diseñar una arquitectura robusta y escalable.

A continuación, presento mi análisis y los tres artefactos de desarrollo solicitados.

---

### **Paso 1 y 2: Análisis del Prototipo y Diseño de la Arquitectura (Proceso Mental del Arquitecto)**

1.  **Análisis del Frontend:**
    *   **Componentes y UI:** El `index.tsx` proporcionado es solo el punto de entrada que renderiza un componente `<App />`. El verdadero contenido de la UI no está visible, pero puedo inferirlo. Dado el contexto de una galería de arte y la mención de una "herramienta de inteligencia artificial" en el plan, el prototipo actual probablemente consiste en un componente `<App />` que contiene un campo de texto (input) para un prompt y un área para mostrar los nombres de obras de arte generados por la API de Gemini.
    *   **Manejo de Estado:** El estado de React (`useState`) seguramente se usa para manejar el prompt del usuario, el estado de carga (`isLoading`), y la lista de nombres generados. Estos nombres ("Banco de Ideas") son precisamente el tipo de datos que deben persistir en una base de datos.
    *   **Llamadas a API existentes:** El `importmap` en `index.html` importa directamente `@google/genai`. Esto significa que el prototipo actual realiza llamadas a la API de Gemini desde el navegador del cliente. **Esto es una vulnerabilidad de seguridad crítica**. La clave de la API está expuesta en el lado del cliente, lo cual es inaceptable para una aplicación en producción. Mi primera decisión arquitectónica es mover esta lógica a una Cloud Function.

2.  **Diseño de la Arquitectura Backend (Firebase):**
    *   **Autenticación (`Firebase Authentication`):** El requisito de un "panel de control privado" exige un sistema de autenticación. Firebase Authentication es la elección obvia y perfecta. Usaremos el proveedor de Email/Contraseña para el administrador.
    *   **Base de Datos (`Cloud Firestore`):** Necesitamos almacenar datos estructurados para las obras, las series y las ideas. Firestore (una base de datos NoSQL) es ideal por su flexibilidad, escalabilidad y capacidades en tiempo real.
        *   **Colección `artworks`:** Para las obras de arte únicas. Cada documento representará una obra con sus detalles (precio, dimensiones, etc.) y una URL a su imagen. Incluirá un campo `status` ('active', 'archived', 'deleted') para la función de papelera.
        *   **Colección `series`:** Para las obras seriadas. Un documento por serie (ej. "Impresiones de la Costa Azul").
        *   **Colección `prints`:** Para las piezas individuales de una serie. Cada documento representará una copia (ej. "Impresión #5 de 50"), con un campo `seriesId` para vincularlo a su serie principal, y su estado ('available', 'sold').
        *   **Colección `generatedNames`:** Para almacenar las ideas de nombres generadas por la IA.
    *   **Almacenamiento de Archivos (`Cloud Storage for Firebase`):** Las fotos de las obras de arte y los archivos de carga masiva (hojas de cálculo) deben almacenarse en un lugar seguro y accesible. Cloud Storage es la solución integrada para esto. Las imágenes se subirán aquí, y almacenaremos solo la URL de la imagen en los documentos de Firestore.
    *   **Lógica de Servidor (`Cloud Functions for Firebase`):** Este es el "cerebro" sin servidor de nuestro backend.
        *   **Función 1 (Invocable): `generateArtName`:** Esta función recibirá un prompt del cliente, y será la *única* que tenga acceso a la clave de la API de Gemini. Hará la llamada a la API de forma segura en el servidor y devolverá el resultado al cliente. Esto soluciona la vulnerabilidad de seguridad del prototipo.
        *   **Función 2 (Disparador de Storage): `processBulkUpload`:** Esta función se activará automáticamente cada vez que el administrador suba un archivo CSV o Excel a una carpeta específica en Cloud Storage. La función leerá el archivo, validará los datos y creará los documentos correspondientes en la colección `artworks` de Firestore. Esto proporciona una potente funcionalidad de carga masiva de manera eficiente.

---

## Artefacto 1: Documento de Requisitos del Producto (PRD)

*   **Rol:** Product Manager
*   **Documento:** PRD - Galería de Arte "IVAN GUADERRAMA" v2.0

### **1. Resumen**
Este documento describe la expansión del prototipo de la galería de arte "IVAN GUADERRAMA" a una aplicación web full-stack. El objetivo es transformar la herramienta de generación de ideas en una plataforma completa de gestión de inventario (CMS) para el administrador de la galería, asegurando que la información de las obras sea centralizada, segura y se actualice en tiempo real en la galería pública.

### **2. Perfil de Usuario**
*   **Administrador de la Galería (Usuario Principal):** El artista o su manager. Necesita una interfaz sencilla y segura para añadir, actualizar y organizar todo el inventario de arte, tanto piezas únicas como ediciones limitadas. No es un usuario técnico.
*   **Visitante / Cliente Potencial (Usuario Secundario):** El público que visita la web. Necesita ver un catálogo de arte preciso y actualizado, con toda la información relevante para realizar una compra.

### **3. Lista de Características**

#### **Backend**
*   **[B.1] Autenticación de Administrador:** Un sistema seguro de inicio de sesión (email/contraseña) para acceder al panel de control.
*   **[B.2] Base de Datos de Obras Únicas:** Almacenamiento centralizado para cada obra con sus atributos (nombre, foto, precio, categoría, medidas, peso, costos de envío).
*   **[B.3] Base de Datos de Obras Seriadas:** Sistema para gestionar series de obras (ej. impresiones) y llevar un registro individual de cada pieza (ej. #5/100, estado de venta, comprador).
*   **[B.4] Almacenamiento de Imágenes:** Un repositorio seguro para las imágenes de alta resolución de las obras.
*   **[B.5] API Segura para IA:** Un endpoint en el servidor que se encargue de las llamadas a la IA de Gemini para generar nombres, protegiendo las claves de API.
*   **[B.6] Persistencia de Ideas de IA:** Guardar automáticamente las sugerencias de nombres generadas en una base de datos para consulta futura.
*   **[B.7] Lógica de Carga Masiva:** Capacidad de procesar un archivo (CSV/Excel) para añadir múltiples obras al inventario de una sola vez.
*   **[B.8] Sistema de Archivo/Papelera:** Implementar un borrado lógico (soft-delete) para que las obras puedan ser archivadas o movidas a una papelera en lugar de ser eliminadas permanentemente.

#### **Frontend**
*   **[F.1] Página de Inicio de Sesión:** Una página de acceso exclusiva para el administrador.
*   **[F.2] Panel de Control (Dashboard):** La interfaz principal para el administrador, con acceso a todas las funciones de gestión.
*   **[F.3] CRUD para Obras Únicas:** Formularios para crear, ver, editar y archivar/eliminar obras de arte únicas.
*   **[F.4] CRUD para Obras Seriadas:** Formularios e interfaces para gestionar series y el estado de sus piezas individuales.
*   **[F.5] Interfaz de Carga Masiva:** Un componente para que el administrador pueda subir el archivo de inventario.
*   **[F.6] Galería Pública Dinámica:** La página que ven los visitantes, que leerá y mostrará en tiempo real la información de las obras desde la base de datos.
*   **[F.7] Refactorización de la Herramienta de IA:** Modificar la herramienta existente para que llame a nuestra nueva API segura ([B.5]) en lugar de a Gemini directamente.

### **4. Flujo de Usuario Principal (Administrador)**
1.  **Acceso:** El administrador navega a `/admin` y se le presenta la página de inicio de sesión [F.1]. Introduce sus credenciales.
2.  **Autenticación:** El sistema valida las credenciales [B.1]. Si son correctas, se le redirige al Panel de Control [F.2].
3.  **Gestión:** Desde el panel, el administrador selecciona "Añadir Nueva Obra Única". Se abre un formulario [F.3].
4.  **Creación:** Rellena los detalles de la obra (nombre, precio, etc.) y sube una imagen. La imagen se guarda en el sistema de almacenamiento [B.4] y los datos de la obra en la base de datos [B.2].
5.  **Visualización Pública:** Inmediatamente después de guardar, un visitante que recargue la galería pública [F.6] verá la nueva obra de arte listada con toda su información.

---

## Artefacto 2: Arquitectura Técnica

### **1. Visión General**
Se implementará una arquitectura serverless basada en la plataforma Google Firebase. El frontend será una Single-Page Application (SPA) en React que se comunicará con los servicios de Firebase para autenticación, almacenamiento de datos y ejecución de lógica de negocio.

```mermaid
[Cliente (React SPA)] <--> [Firebase Platform] <--> [APIs Externas (Google Gemini)]
                            |
                            +-- Firebase Authentication (Login)
                            +-- Cloud Firestore (Datos de obras)
                            +-- Cloud Storage (Imágenes, CSVs)
                            +-- Cloud Functions (Lógica segura, proxy de API)
```

### **2. Selección de Servicios Firebase**
*   **Firebase Authentication:** Para gestionar la identidad del administrador (Email/Password). Proporciona la seguridad necesaria para el panel de control.
*   **Cloud Firestore (Base de Datos NoSQL):** Elegido por su modelo de datos flexible, ideal para catálogos de arte, y sus capacidades de consulta en tiempo real, que permiten que la galería pública se actualice instantáneamente.
*   **Cloud Storage for Firebase:** Para el almacenamiento de los binarios (imágenes de obras, archivos de carga masiva). Se integra perfectamente con Firestore y Cloud Functions.
*   **Cloud Functions for Firebase:** Para ejecutar código backend sin gestionar servidores. Esencial para:
    1.  **Seguridad:** Encapsular la clave de la API de Gemini.
    2.  **Procesamiento Asíncrono:** Gestionar la carga masiva de archivos sin bloquear la interfaz de usuario.

### **3. Modelo de Datos (Colecciones en Firestore)**

```plaintext
// Colección para Obras de Arte Únicas
artworks/
    {artworkId}/
        name: "Título de la Obra"
        description: "Descripción detallada..."
        imageUrl: "gs://bucket-name/path/to/image.jpg"
        price: 2500.00
        currency: "EUR"
        category: "Óleo sobre lienzo"
        dimensions: { width: 100, height: 80, unit: "cm" }
        weight: { value: 5, unit: "kg" }
        shippingCosts: 150.00
        status: "active" | "archived" | "deleted" // Para soft-delete
        createdAt: Timestamp
        updatedAt: Timestamp

// Colección para las Series de Obras
series/
    {seriesId}/
        name: "Nombre de la Serie"
        description: "Descripción de la serie..."
        totalPrints: 100
        imageUrl: "gs://bucket-name/path/to/main_image.jpg"

// Colección para las Impresiones/Piezas individuales de una serie
prints/
    {printId}/
        seriesId: "{seriesId}" // Foreign Key a la colección 'series'
        printNumber: 5
        status: "available" | "sold"
        location: "Almacén Principal"
        ownerInfo: "Datos del comprador (opcional)"

// Colección para las ideas generadas por la IA
generatedNames/
    {nameId}/
        prompt: "Arte abstracto sobre la soledad"
        name: "El Eco Silencioso"
        createdAt: Timestamp
```

### **4. Definición de Cloud Functions**

1.  **`generateArtName` (HTTPS Callable Function)**
    *   **Trigger:** Llamada directa desde el cliente React.
    *   **Autenticación:** Requiere que el usuario esté autenticado.
    *   **Lógica:**
        1.  Recibe un `prompt` (string) como argumento.
        2.  Utiliza la clave de API de Gemini (almacenada de forma segura en las variables de entorno de la función) para llamar a la API.
        3.  Recibe las sugerencias de nombres.
        4.  Guarda cada sugerencia como un nuevo documento en la colección `generatedNames`.
        5.  Devuelve la lista de sugerencias al cliente.

2.  **`processBulkUpload` (Cloud Storage Trigger)**
    *   **Trigger:** Creación de un nuevo archivo en la ruta `uploads/artworks/{userId}/{fileName}` de Cloud Storage.
    *   **Lógica:**
        1.  Se activa cuando el administrador sube un archivo.
        2.  Descarga y parsea el archivo (ej. usando una librería como `csv-parser`).
        3.  Itera sobre cada fila del archivo.
        4.  Valida los datos de cada fila.
        5.  Crea un nuevo documento en la colección `artworks` para cada fila válida.
        6.  (Opcional) Envía una notificación por correo electrónico al administrador al finalizar o si ocurren errores.

### **5. Seguridad (Firestore Security Rules)**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cualquiera puede leer las obras activas, pero no escribir.
    match /artworks/{artworkId} {
      allow read: if resource.data.status == 'active';
      allow write: if request.auth != null; // Solo usuarios autenticados (admin)
    }
    // Las series y las impresiones siguen una lógica similar.
    match /series/{seriesId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /prints/{printId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    // Solo el admin puede leer y escribir en el banco de ideas.
    match /generatedNames/{nameId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Artefacto 3: Lista de Tareas (Backlog Priorizado)

### **Épica 1: Fundamentos del Backend y Autenticación**
*   [ ] **Tarea 1.1:** Configurar un nuevo proyecto de Firebase (Authentication, Firestore, Storage, Functions).
*   [ ] **Tarea 1.2:** Implementar el flujo de inicio de sesión con Email/Contraseña en el frontend.
*   [ ] **Tarea 1.3:** Crear una ruta protegida `/admin` que solo sea accesible para usuarios autenticados.
*   [ ] **Tarea 1.4:** Definir las reglas de seguridad iniciales de Firestore para restringir la escritura a usuarios autenticados.

### **Épica 2: Gestión de Obras de Arte Únicas (CRUD)**
*   [ ] **Tarea 2.1:** Diseñar y construir el formulario "Añadir/Editar Obra" en el panel de administración.
*   [ ] **Tarea 2.2:** Integrar la subida de imágenes a Cloud Storage desde el formulario.
*   [ ] **Tarea 2.3:** Crear la lógica para guardar/actualizar documentos en la colección `artworks` de Firestore.
*   [ ] **Tarea 2.4:** Construir la tabla/vista de lista en el panel de admin para mostrar todas las obras.
*   [ ] **Tarea 2.5:** Implementar la funcionalidad de archivar/borrar (soft-delete) cambiando el campo `status`.
*   [ ] **Tarea 2.6:** Crear el componente de la galería pública que lee y muestra las obras con `status == 'active'`.

### **Épica 3: Integración Segura con IA de Gemini**
*   [ ] **Tarea 3.1:** Desarrollar y desplegar la Cloud Function `generateArtName`.
*   [ ] **Tarea 3.2:** Configurar de forma segura la clave de API de Gemini en las variables de entorno de la función.
*   [ ] **Tarea 3.3:** Refactorizar el componente de IA del frontend para que llame a la nueva Cloud Function en lugar de la SDK de cliente.
*   [ ] **Tarea 3.4:** Crear una nueva sección en el panel de admin para visualizar el "Banco de Ideas" desde la colección `generatedNames`.

### **Épica 4: Gestión de Obras Seriadas**
*   [ ] **Tarea 4.1:** Modelar e implementar las interfaces CRUD para la colección `series`.
*   [ ] **Tarea 4.2:** En la vista de detalle de una serie, implementar la interfaz para gestionar las `prints` individuales (marcar como vendida, etc.).

### **Épica 5: Funcionalidad de Carga Masiva**
*   [ ] **Tarea 5.1:** Desarrollar y desplegar la Cloud Function `processBulkUpload` con la lógica de parseo de CSV.
*   [ ] **Tarea 5.2:** Construir el componente de UI en el panel de admin para subir el archivo a Cloud Storage.
*   [ ] **Tarea 5.3:** Proporcionar feedback al usuario (ej. "Carga en progreso...", "Carga completada con 50 obras añadidas").