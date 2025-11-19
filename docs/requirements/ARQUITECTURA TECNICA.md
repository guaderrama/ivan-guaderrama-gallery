¡Excelente! Como Arquitecto de Software Full-Stack, he analizado a fondo el prototipo y el plan de producto. El prototipo actual, aunque funcional, tiene una debilidad crítica: expone la lógica y las claves de la API de Gemini en el cliente. El plan de producto es claro y sienta las bases para un sistema de gestión de inventario robusto y seguro.

Mi diseño se centrará en mover la lógica de negocio sensible al backend, estructurar los datos para escalabilidad y rendimiento, y utilizar el ecosistema de Firebase para ofrecer una solución completa, segura y eficiente.

Aquí está el artefacto de **Arquitectura Técnica Detallada**.

---

## Arquitectura Técnica para la Expansión con Firebase

Este documento detalla la arquitectura de backend propuesta utilizando el ecosistema de Firebase para transformar el prototipo de galería de arte en una aplicación web completa y escalable con un panel de administración seguro.

### 1. Servicios de Firebase Recomendados

| Servicio | Justificación |
| :--- | :--- |
| **Firebase Authentication** | **Para qué:** Gestionar el acceso seguro al panel de administración. Se propone un inicio con login de Email/Contraseña para el administrador. <br><br> **Por qué:** Es fundamental para cumplir el requisito de un "panel de control privado y seguro". Separa por completo las capacidades de un administrador de las de un visitante público, y es la base de nuestras reglas de seguridad. |
| **Cloud Firestore** | **Para qué:** Será nuestra base de datos principal NoSQL para almacenar toda la información del catálogo de arte, las series, las piezas individuales y el banco de ideas. <br><br> **Por qué:** Su naturaleza en tiempo real permite que los cambios en el panel de administración se reflejen "automáticamente en la galería online", como pide el plan. Su modelo de datos flexible es perfecto para la estructura de las obras de arte y sus variantes. |
| **Cloud Functions for Firebase** | **Para qué:** Servirá como nuestro backend serverless para ejecutar lógica de negocio segura y tareas pesadas. <br><br> **Por qué:** Es crucial para dos cosas: 1) **Seguridad:** Moveremos las llamadas a la API de Gemini aquí para proteger la clave de API. 2) **Procesamiento:** La "carga masiva de obras mediante un archivo" es una tarea que no debe ejecutarse en el navegador del cliente. Una Cloud Function puede procesar el archivo de forma segura y eficiente. |
| **Cloud Storage for Firebase** | **Para qué:** Almacenar todos los activos multimedia, principalmente las "fotos" de cada obra de arte. <br><br> **Por qué:** Es la solución nativa de Firebase para almacenar archivos de usuario. Se integra perfectamente con Firestore (guardaremos la URL de la imagen en el documento de la obra) y tiene su propio sistema de reglas de seguridad para controlar quién puede subir o ver imágenes. |
| **Firebase Hosting** | **Para qué:** Desplegar y servir el frontend de React (la galería pública y el panel de administración). <br><br> **Por qué:** Ofrece un despliegue rápido, un CDN global para un rendimiento excelente y se integra de forma nativa con el resto de los servicios de Firebase, simplificando la configuración y el mantenimiento. |

### 2. Modelo de Datos de Firestore

Proponemos una estructura de colecciones que separa lógicamente las entidades de datos, permitiendo consultas eficientes y reglas de seguridad claras.

**Colección Principal: `artworks`**

Almacena la información de cada obra de arte, ya sea única o una serie.

*   **Ruta:** `artworks/{artworkId}`
*   **Documento de Ejemplo (Obra Única):**

```json
{
  "name": "Sueño Cósmico I",
  "type": "unique", // 'unique' o 'series'
  "category": "Pintura Abstracta",
  "price": 2500.00,
  "currency": "USD",
  "imageUrl": "gs://your-project.appspot.com/artworks/cosmic_dream_1.jpg",
  "dimensions": {
    "height_cm": 120,
    "width_cm": 80,
    "depth_cm": 4
  },
  "weight_kg": 7.5,
  "shippingCost": 150.00,
  "status": "active", // 'active', 'sold', 'archived', 'deleted'
  "createdAt": "2023-10-27T10:00:00Z",
  "updatedAt": "2023-10-27T10:00:00Z"
}
```

*   **Documento de Ejemplo (Obra Seriada):**

```json
{
  "name": "Caminante Nocturno (Edición Limitada)",
  "type": "series", // 'unique' o 'series'
  "category": "Impresión Giclée",
  "seriesSize": 50, // Número total de piezas en la serie
  "imageUrl": "gs://your-project.appspot.com/artworks/night_walker_series.jpg",
  "status": "active", // La serie está activa si al menos una pieza está disponible
  "createdAt": "2023-10-26T15:00:00Z",
  "updatedAt": "2023-10-26T15:00:00Z"
}
```

**Subcolección: `pieces`**

Anidada dentro de un documento de `artworks` de tipo `series`, para registrar cada pieza individual.

*   **Ruta:** `artworks/{artworkId}/pieces/{pieceId}`
*   **Documento de Ejemplo:**

```json
{
  "serialNumber": "5/50",
  "status": "available", // 'available', 'sold'
  "price": 350.00, // El precio puede ser por pieza
  "currency": "USD",
  "location": "Galería Principal",
  "buyerInfo": null // O { "name": "John Doe", "email": "j.doe@example.com" }
}
```

**Colección: `generatedNames`**

Para el "Banco de Ideas".

*   **Ruta:** `generatedNames/{nameId}`
*   **Documento de Ejemplo:**

```json
{
  "name": "El Eco del Silencio",
  "promptUsed": "Un nombre poético para un paisaje desértico al amanecer.",
  "isUsed": false, // Para marcar si ya se ha asignado a una obra
  "createdAt": "2023-10-27T11:30:00Z"
}
```

**Colección: `users`**

Para gestionar los roles de los usuarios (en este caso, administradores).

*   **Ruta:** `users/{userId}` (el `{userId}` es el UID de Firebase Auth)
*   **Documento de Ejemplo:**

```json
{
  "email": "admin@ivanguaderrama.com",
  "role": "admin",
  "createdAt": "2023-10-27T09:00:00Z"
}
```

### 3. Cloud Functions Clave

Estas son las funciones de backend esenciales para la lógica y seguridad de la aplicación.

1.  **`generateArtNames`**
    *   **Trigger:** HTTPS Callable Function (`onCall`).
    *   **Propósito:** Actúa como un proxy seguro a la API de Gemini. El frontend llama a esta función en lugar de a la API directamente.
    *   **Lógica de Ejecución:**
        1.  Verifica que el usuario que la llama sea un administrador autenticado.
        2.  Recibe un `prompt` como argumento.
        3.  Llama a la API de Gemini usando la clave de API almacenada de forma segura en las variables de entorno de la función.
        4.  Guarda las sugerencias de nombres recibidas en la colección `generatedNames` de Firestore.
        5.  Devuelve la lista de nombres al cliente.

2.  **`processBulkArtUpload`**
    *   **Trigger:** Cloud Storage (`onObjectFinalized`). Se activa cuando un administrador sube un archivo CSV/Excel a una carpeta específica en Cloud Storage (ej: `/uploads/artworks/`).
    *   **Propósito:** Procesa la carga masiva de obras de arte.
    *   **Lógica de Ejecución:**
        1.  Descarga el archivo subido.
        2.  Utiliza una librería para parsear el contenido del archivo (ej. `papaparse` para CSV).
        3.  Itera sobre cada fila del archivo.
        4.  Para cada fila, crea y valida un nuevo documento en la colección `artworks`.
        5.  (Opcional) Envía una notificación por email al administrador indicando el éxito o los errores del proceso.
        6.  Mueve el archivo procesado a otra carpeta (ej: `/processed/`) para evitar su reprocesamiento.

3.  **`onArtworkUpdate`** (Mantenimiento de Estado)
    *   **Trigger:** Cloud Firestore (`onUpdate`). Se activa cuando se actualiza un documento en la subcolección `artworks/{artworkId}/pieces`.
    *   **Propósito:** Mantener la consistencia del estado de la obra seriada principal.
    *   **Lógica de Ejecución:**
        1.  Tras la actualización de una pieza (ej. `status` cambia a `sold`), la función se dispara.
        2.  Recuenta cuántas piezas de la serie siguen `available`.
        3.  Si no quedan piezas disponibles, actualiza el `status` del documento padre en `artworks` a `sold`.

### 4. Reglas de Seguridad (Boceto)

Este es un boceto inicial para proteger los datos en Firestore. La premisa es: lectura pública para la galería, escritura restringida a administradores.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función de ayuda para verificar si un usuario es administrador
    function isAdmin() {
      return exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Artworks: Cualquiera puede ver las obras activas, solo los admins pueden modificar
    match /artworks/{artworkId} {
      allow read: if resource.data.status == 'active'; // Galería pública
      allow get: if isAdmin(); // Permite al admin leer obras no activas
      allow write: if isAdmin(); // Crear, actualizar, eliminar

      // Pieces de una serie: solo los admins pueden acceder
      match /pieces/{pieceId} {
        allow read, write: if isAdmin();
      }
    }

    // Banco de Ideas: Totalmente privado para administradores
    match /generatedNames/{nameId} {
      allow read, write: if isAdmin();
    }

    // Roles de usuario: Un usuario solo puede leer su propio rol, solo un admin puede crear/modificar roles
    match /users/{userId} {
      allow get: if request.auth.uid == userId; // Leer su propio perfil
      allow list, write: if isAdmin(); // Admins pueden gestionar usuarios
    }
  }
}
```