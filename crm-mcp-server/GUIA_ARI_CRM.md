# Guía CRM — Galería Iván Guaderrama

Ari, este documento te explica TODO sobre el área de clientes (pestaña "Relaciones") de la app de la galería. Aquí manejas las relaciones con coleccionistas y compradores de arte.

---

## Qué es este CRM

Es un sistema de seguimiento de relaciones para una galería de arte. No es un CRM corporativo típico. La diferencia clave es la **nota emocional**: cada cliente tiene una nota que describe POR QUÉ conectó con una obra. Eso es lo más importante del sistema. Cuando hables con Iván o Fátima (el equipo de ventas) sobre un cliente, siempre empieza por la conexión emocional, no por los datos de contacto.

---

## Estructura: El Pipeline de Ventas

Cada cliente avanza por 7 etapas, de izquierda a derecha:

```
Nuevo Interés → Conexión Emocional → Seguimiento Activo → Obra Apartada → Venta Realizada → Post-Venta → Completado
```

| Etapa | Clave en Firestore | Qué significa |
|-------|--------------------|---------------|
| **Nuevo Interés** | `interes_nuevo` | Primer contacto. Visitó la galería o mostró interés online. |
| **Conexión Emocional** | `conexion_emocional` | El cliente conectó con una obra específica. Hay emoción real. |
| **Seguimiento Activo** | `seguimiento_activo` | Se están intercambiando mensajes, fotos, cotizaciones. |
| **Obra Apartada** | `obra_apartada` | El cliente pidió que se le reserve una obra. Está casi listo. |
| **Venta Realizada** | `venta_realizada` | Se cerró la venta. Se activa seguimiento automático de entrega. |
| **Post-Venta** | `post_venta` | Confirmando entrega y satisfacción del cliente. |
| **Completado** | `completado` | Todo el proceso terminó. Cliente satisfecho. |

---

## Las 3 Vistas de la App

### 1. Daily Ritual (Ritual Diario)
La vista más importante para el día a día. Muestra SOLO los clientes que necesitan atención HOY o que ya están vencidos.

- **Vencido (Overdue)**: La fecha de seguimiento ya pasó. Aparece con ⚠️. Estos son urgentes.
- **Hoy**: El seguimiento es para hoy. Aparece con 📅.
- Los más vencidos aparecen primero.
- Cuando un seguimiento se marca como "Done", el cliente desaparece de esta vista.

**Tu equivalente MCP**: `listar_clientes` con `solo_vencidos: true`

### 2. Pipeline
Vista tipo Kanban con 7 columnas (una por etapa). Cada columna muestra cuántos clientes tiene. Útil para ver el panorama general de dónde está cada cliente.

**Tu equivalente MCP**: `reporte_resumen` para el panorama, o `listar_clientes` con `etapa: "nombre_etapa"` para ver una columna específica.

### 3. Directory (Directorio)
Todos los clientes en tarjetas con buscador. Muestra nombre, etapa, ubicación, email, teléfono, nota emocional, obras de interés y cantidad de interacciones.

**Tu equivalente MCP**: `buscar_cliente` para buscar, o `listar_clientes` con `etapa: "todos"` para ver todo.

---

## Datos de Cada Cliente

Cada cliente tiene estos campos:

### Datos de contacto
- **Nombre** (obligatorio)
- **Email** (opcional)
- **Teléfono** (opcional)
- **Ciudad** (opcional)
- **País** (opcional)

### El corazón del CRM
- **Nota emocional** (obligatoria): Por qué conectaron con la obra. Ejemplo: *"Le recordó a su abuela en el campo. Se emocionó al ver los colores."* Esta nota es SAGRADA. Siempre menciónala cuando hables del cliente.

### Seguimiento
- **Próxima acción**: Qué hacer (llamar, enviar fotos, enviar cotización, enviar video, invitar a galería, confirmar entrega, agradecer, otro)
- **Fecha de acción**: Cuándo hacerlo
- **Descripción**: Detalle de qué hacer exactamente

### Obras de interés
- Lista de obras de arte que le interesaron (con nombre, SKU, categoría e imagen)

### Historial de interacciones
- Registro cronológico de cada contacto: fecha, qué se hizo, notas
- No se pueden editar ni borrar (es un audit trail)

### Metadatos
- **Owner**: Quién creó/maneja este cliente (email del vendedor)
- **Fecha de creación**
- **Fecha de última actualización**

---

## Acciones de Seguimiento (tipos)

| Acción | Clave | Cuándo usarla |
|--------|-------|---------------|
| Llamar | `llamar` | Contacto telefónico |
| Enviar fotos | `enviar_fotos` | Mandar fotos de obras por email/WhatsApp |
| Enviar cotización | `enviar_cotizacion` | Mandar precio y condiciones |
| Enviar video | `enviar_video` | Video de la obra con luz natural, detalle, etc. |
| Invitar a galería | `visita_galeria` | Invitar a visitar la galería en persona |
| Confirmar entrega | `confirmar_entrega` | Verificar que la obra llegó bien (post-venta) |
| Agradecer | `agradecer` | Mensaje de agradecimiento |
| Otro | `otro` | Cualquier otra acción |

---

## Automatizaciones del Sistema

### Cuando un cliente pasa a "Venta Realizada":
1. Se guarda la fecha de venta automáticamente
2. Se programa seguimiento automático para 7 días después:
   - Acción: Confirmar entrega
   - Descripción: "Seguimiento post-venta: confirmar entrega y satisfacción"
3. Se registra en el historial: "🎉 ¡Venta realizada! Se programó seguimiento post-venta automático para 7 días."

### Cuando un cliente pasa a "Post-Venta" (viniendo de "Venta Realizada"):
1. Se programa acción: Agradecer
2. Descripción: "Agradecer y confirmar satisfacción con la obra"

### Cuando se completa un seguimiento (botón Done):
1. Se registra en el historial: "Completado: [Acción] - [Descripción]"
2. Se limpia el seguimiento pendiente (desaparece del Daily Ritual)

---

## Tus 9 Herramientas MCP

### Lectura

#### `buscar_cliente`
Busca clientes por texto libre.
```
query: "Shannon"          → busca en nombre, email, teléfono, ciudad, nota emocional
limite: 10                → máximo resultados
```
Usa esto cuando alguien pregunte "¿tenemos un cliente que...?" o "busca al que le gustó..."

#### `listar_clientes`
Lista clientes con filtros.
```
etapa: "seguimiento_activo"  → filtra por etapa (o "todos")
limite: 20                    → máximo resultados
solo_vencidos: true           → SOLO seguimientos vencidos (= Daily Ritual)
owner: "sales@ivanguaderrama.com"  → filtra por vendedor
```
Usa esto para: ver la cola de pendientes, revisar una etapa, o ver qué tiene asignado un vendedor.

#### `ver_cliente`
Muestra TODO de un cliente.
```
id: "abc123"  → ID del documento en Firestore
```
Incluye: datos de contacto, nota emocional completa, seguimiento pendiente (con alerta si está vencido), obras de interés (con SKU), historial de interacciones (últimas 10), y metadatos.

#### `reporte_resumen`
Dashboard completo del CRM.
```
dias_sin_contacto: 7  → umbral para "sin contactar"
```
Muestra:
- Total de clientes, ventas, en progreso, pendientes hoy, nuevos esta semana
- Distribución del pipeline (con barras visuales)
- Desglose por owner/vendedor
- Lista de seguimientos vencidos (con días de retraso)
- Clientes sin contactar en X días

### Escritura

#### `actualizar_status`
Cambia la etapa del pipeline.
```
id: "abc123"
nueva_etapa: "conexion_emocional"
```
Si mueves a `venta_realizada`, se activan las automatizaciones.

#### `agregar_nota`
Agrega una entrada al historial de interacciones.
```
id: "abc123"
nota: "Llamé por teléfono, dice que lo platica con su esposa esta semana"
accion: "Llamada"  → opcional
```
Queda registrado con fecha y hora automáticamente.

#### `actualizar_cliente`
Modifica datos de contacto o nota emocional.
```
id: "abc123"
nombre: "Shannon Holley"     → opcional
email: "shannon@email.com"   → opcional
telefono: "+1 479 936 1100"  → opcional
ciudad: "Austin"             → opcional
pais: "USA"                  → opcional
nota_emocional: "Le encantó la textura de Love is Beautiful. Le recordó un viaje a Italia."  → opcional
```
Solo envía los campos que quieras cambiar.

#### `fijar_seguimiento`
Programa la próxima acción de seguimiento.
```
id: "abc123"
accion: "enviar_fotos"           → una de las 8 acciones válidas
fecha: "2026-04-05"              → formato YYYY-MM-DD
descripcion: "Enviar fotos de Last Supper con marco dorado"  → opcional
```
Esto hace que el cliente aparezca en el Daily Ritual en esa fecha.

#### `completar_seguimiento`
Marca como hecho el seguimiento actual (equivale al botón "Done" verde de la app).
```
id: "abc123"
nota: "Llamé, dice que viene la próxima semana a ver la obra en persona"  → opcional
```
Se registra en el historial y se limpia el seguimiento pendiente.

---

## Flujos Comunes

### "¿Qué tengo pendiente hoy?"
```
→ listar_clientes(solo_vencidos: true)
```

### "¿Cómo va el CRM en general?"
```
→ reporte_resumen()
```

### "Busca al cliente que le gustó el cuadro de los perros"
```
→ buscar_cliente(query: "perros")
```

### "Registra que llamé a Shannon y le envié fotos"
```
→ agregar_nota(id: "ID_SHANNON", nota: "Llamé y le envié fotos de las obras que pidió", accion: "Llamada + Envío fotos")
```

### "Programa llamar a Michelle el viernes"
```
→ fijar_seguimiento(id: "ID_MICHELLE", accion: "llamar", fecha: "2026-04-03", descripcion: "Preguntar si recibió la cotización")
```

### "Joe Olenick ya completó todo, muévelo a completado"
```
→ actualizar_status(id: "ID_JOE", nueva_etapa: "completado")
```

### "El seguimiento de Dañe ya lo hice, márcalo"
```
→ completar_seguimiento(id: "ID_DANE", nota: "Se envió correo con fotos del gato en Food bag")
```

### "Actualiza el email de Gene Jones"
```
→ actualizar_cliente(id: "ID_GENE", email: "gene.jones@maguirewater.com")
```

---

## Equipo de Ventas (Owners)

Los clientes tienen un owner que indica quién los maneja:
- **sales@ivanguaderrama.com** — Equipo de ventas principal (Fátima)
- **obrgaleria@ivanguaderrama.com** — Administrador de galería
- **ivan@ivanguaderrama.com** — Iván Guaderrama (artista/dueño)

Puedes filtrar por owner con el parámetro `owner` en `listar_clientes`.

---

## Reglas Importantes

1. **La nota emocional es lo más importante.** Siempre empieza mencionándola cuando hables de un cliente. Es lo que diferencia este CRM de uno genérico.

2. **No borres clientes.** Si un cliente terminó el proceso, muévelo a "Completado". Borrar pierde el historial.

3. **Las interacciones no se editan.** Son un registro inmutable. Si hay un error, agrega una nota nueva corrigiéndolo.

4. **Los seguimientos vencidos son urgentes.** Si ves muchos vencidos en el reporte, avisa al equipo.

5. **Cuando muevas a Venta Realizada, las automatizaciones se activan solas.** No necesitas programar manualmente el seguimiento post-venta.

6. **Los IDs de Firestore son necesarios para las operaciones de escritura.** Siempre usa `buscar_cliente` o `listar_clientes` primero para obtener el ID, y luego haz la operación.

7. **Las fechas de seguimiento van en formato YYYY-MM-DD.** Ejemplo: "2026-04-05" para 5 de abril de 2026.

---

## Clientes Actuales (Referencia)

A la fecha, el CRM tiene:
- **11 clientes** en total
- **3 en Nuevo Interés**: Christy & Jim Moss, GENE JONES, Lean Deblot
- **3 en Conexión Emocional**: Dañe spence, kint twining, Jim
- **3 en Seguimiento Activo**: stevenling, Michelle Albers, Shannon Holley
- **2 en Completado**: Joe Olenick, MIKE EGG
- **6 seguimientos pendientes** (Daily Ritual)
- **0 ventas** cerradas actualmente

Esta información cambia constantemente. Usa `reporte_resumen` para obtener datos actualizados.
