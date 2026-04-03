import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";

// ─── Firebase Init ─────────────────────────────────────────
function initFirebase() {
  if (getApps().length > 0) return getFirestore();

  const projectId = process.env.FIREBASE_PROJECT_ID || "ivan-guaderrama-gallery";

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(serviceAccount), projectId });
  } else {
    initializeApp({ projectId });
  }

  return getFirestore();
}

const db = initFirebase();
const COLLECTION = "relationships";

// ─── Constants ─────────────────────────────────────────────

const VALID_STAGES = [
  "interes_nuevo",
  "conexion_emocional",
  "seguimiento_activo",
  "obra_apartada",
  "venta_realizada",
  "post_venta",
  "completado",
] as const;

const VALID_ACTIONS = [
  "llamar",
  "enviar_fotos",
  "enviar_cotizacion",
  "enviar_video",
  "visita_galeria",
  "confirmar_entrega",
  "agradecer",
  "otro",
] as const;

const STAGE_LABELS: Record<string, string> = {
  interes_nuevo: "Nuevo Interés",
  conexion_emocional: "Conexión Emocional",
  seguimiento_activo: "Seguimiento Activo",
  obra_apartada: "Obra Apartada",
  venta_realizada: "Venta Realizada",
  post_venta: "Post-Venta",
  completado: "Completado",
};

const ACTION_LABELS: Record<string, string> = {
  llamar: "Llamar",
  enviar_fotos: "Enviar fotos",
  enviar_cotizacion: "Enviar cotización",
  enviar_video: "Enviar video",
  visita_galeria: "Visita a galería",
  confirmar_entrega: "Confirmar entrega",
  agradecer: "Agradecer",
  otro: "Otro",
};

// ─── Helpers ───────────────────────────────────────────────

function tsToDate(ts: unknown): Date | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts instanceof Date) return ts;
  return null;
}

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });
}

function daysSince(d: Date | null): number {
  if (!d) return -1;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

interface ClientDoc {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  stage: string;
  emotionalNote: string;
  nextAction: string;
  nextActionDescription: string;
  nextActionDate: Date | null;
  interestedArtworks: Array<{ id: string; nombre: string; sku: string; category: string; imageUrl?: string }>;
  interactions: Array<{ id: string; date: Date | null; note: string; actionTaken: string }>;
  createdAt: Date | null;
  updatedAt: Date | null;
  createdBy: string;
  createdByName: string;
  dealValue: number;
  source: string;
  tags: string[];
  lastContactedAt: Date | null;
}

function parseDoc(docSnap: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot): ClientDoc {
  const d = docSnap.data() || {};
  return {
    id: docSnap.id,
    name: d.name || "",
    email: d.email || "",
    phone: d.phone || "",
    city: d.city || "",
    country: d.country || "",
    stage: d.stage || "interes_nuevo",
    emotionalNote: d.emotionalNote || "",
    nextAction: d.nextAction || "",
    nextActionDescription: d.nextActionDescription || "",
    nextActionDate: tsToDate(d.nextActionDate),
    interestedArtworks: (d.interestedArtworks || []).map((a: Record<string, unknown>) => ({
      id: (a.id as string) || "",
      nombre: (a.nombre as string) || "",
      sku: (a.sku as string) || "",
      category: (a.category as string) || "",
      imageUrl: (a.imageUrl as string) || "",
    })),
    interactions: (d.interactions || []).map((i: Record<string, unknown>) => ({
      id: (i.id as string) || "",
      date: tsToDate(i.date),
      note: (i.note as string) || "",
      actionTaken: (i.actionTaken as string) || "",
    })),
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.updatedAt),
    createdBy: d.createdBy || "",
    createdByName: d.createdByName || "",
    dealValue: d.dealValue || 0,
    source: d.source || "",
    tags: d.tags || [],
    lastContactedAt: tsToDate(d.lastContactedAt),
  };
}

// ─── Formatters ────────────────────────────────────────────

function formatClientBrief(c: ClientDoc): string {
  const stage = STAGE_LABELS[c.stage] || c.stage;
  const location = [c.city, c.country].filter(Boolean).join(", ");
  const artCount = c.interestedArtworks.length;
  const interCount = c.interactions.length;

  let line = `• ${c.name}  |  ${stage}`;
  if (c.dealValue > 0) line += `  |  $${c.dealValue.toLocaleString()}`;
  if (c.createdByName) line += `  |  👤 ${c.createdByName}`;
  if (location) line += `\n  📍 ${location}`;
  if (c.source) line += `  (via ${c.source})`;
  if (c.tags.length > 0) line += `\n  🏷️ ${c.tags.join(", ")}`;

  const contacts: string[] = [];
  if (c.email) contacts.push(`✉️ ${c.email}`);
  if (c.phone) contacts.push(`📞 ${c.phone}`);
  if (contacts.length > 0) line += `\n  ${contacts.join("  |  ")}`;

  if (c.emotionalNote) {
    const note = c.emotionalNote.length > 80 ? c.emotionalNote.substring(0, 80) + "..." : c.emotionalNote;
    line += `\n  💚 "${note}"`;
  }

  if (c.nextAction) {
    const action = ACTION_LABELS[c.nextAction] || c.nextAction;
    const date = formatDate(c.nextActionDate);
    const isOverdue = c.nextActionDate && c.nextActionDate < new Date();
    line += `\n  📅 ${action}: ${c.nextActionDescription || "—"} (${date})${isOverdue ? " ⚠️ VENCIDO" : ""}`;
  }

  if (artCount > 0) {
    const names = c.interestedArtworks.map(a => a.nombre).slice(0, 3).join(", ");
    line += `\n  🎨 ${artCount} obra(s): ${names}`;
  }

  line += `\n  💬 ${interCount} interacción(es)`;

  return line;
}

function formatClientDetail(c: ClientDoc): string {
  const stage = STAGE_LABELS[c.stage] || c.stage;
  const location = [c.city, c.country].filter(Boolean).join(", ");
  const isOverdue = c.nextActionDate && c.nextActionDate < new Date();

  let text = `
═══════════════════════════════════════
  ${c.name.toUpperCase()}
═══════════════════════════════════════
ID:          ${c.id}
Etapa:       ${stage}
Email:       ${c.email || "—"}
Teléfono:    ${c.phone || "—"}
Ubicación:   ${location || "—"}
Valor:       ${c.dealValue > 0 ? `$${c.dealValue.toLocaleString()}` : "—"}
Fuente:      ${c.source || "—"}
Tags:        ${c.tags.length > 0 ? c.tags.join(", ") : "—"}
Owner:       ${c.createdByName || "—"}
Últ. contacto: ${formatDate(c.lastContactedAt)}${c.lastContactedAt ? ` (hace ${daysSince(c.lastContactedAt)} días)` : ""}
Creado:      ${formatDate(c.createdAt)}
Actualizado: ${formatDate(c.updatedAt)}

💚 Nota Emocional:
"${c.emotionalNote || "Sin nota"}"
`.trim();

  // Follow-up section
  if (c.nextAction) {
    const action = ACTION_LABELS[c.nextAction] || c.nextAction;
    text += `\n\n📅 Próximo Seguimiento:${isOverdue ? " ⚠️ VENCIDO" : ""}`;
    text += `\n  Acción:  ${action}`;
    text += `\n  Fecha:   ${formatDate(c.nextActionDate)}`;
    text += `\n  Detalle: ${c.nextActionDescription || "—"}`;
    if (isOverdue) {
      text += `\n  ⏰ Días de retraso: ${daysSince(c.nextActionDate)}`;
    }
  } else {
    text += `\n\n📅 Sin seguimiento programado.`;
  }

  // Artworks
  if (c.interestedArtworks.length > 0) {
    text += `\n\n🎨 Obras de Interés (${c.interestedArtworks.length}):`;
    for (const art of c.interestedArtworks) {
      text += `\n  • ${art.nombre} (SKU: ${art.sku}, Cat: ${art.category})`;
    }
  } else {
    text += `\n\n🎨 Sin obras de interés vinculadas.`;
  }

  // Interactions history
  if (c.interactions.length > 0) {
    text += `\n\n📋 Historial de Interacciones (${c.interactions.length}):`;
    const sorted = [...c.interactions].sort((a, b) => {
      const da = a.date?.getTime() || 0;
      const db = b.date?.getTime() || 0;
      return db - da;
    });
    const recent = sorted.slice(0, 10);
    for (const i of recent) {
      const action = i.actionTaken ? `[${i.actionTaken}] ` : "";
      text += `\n  ${formatDate(i.date)} — ${action}${i.note}`;
    }
    if (c.interactions.length > 10) {
      text += `\n  ... y ${c.interactions.length - 10} interacciones anteriores`;
    }
  } else {
    text += `\n\n📋 Sin historial de interacciones.`;
  }

  return text;
}

// ─── MCP Server ────────────────────────────────────────────

const server = new McpServer({
  name: "crm-galeria",
  version: "1.0.0",
});

// ═══════════════════════════════════════════════════════════
// TOOL 1: buscar_cliente
// ═══════════════════════════════════════════════════════════
server.tool(
  "buscar_cliente",
  "Busca clientes por nombre, email o teléfono. Muestra datos completos de contacto, nota emocional, seguimiento y obras de interés.",
  {
    query: z.string().describe("Texto a buscar (nombre, email o teléfono)"),
    limite: z.number().min(1).max(50).default(10).describe("Máximo de resultados"),
  },
  async ({ query, limite }) => {
    try {
      const snap = await db.collection(COLLECTION).orderBy("name").get();
      const q = query.toLowerCase();

      const matches = snap.docs
        .map(parseDoc)
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            c.city.toLowerCase().includes(q) ||
            c.emotionalNote.toLowerCase().includes(q)
        )
        .slice(0, limite);

      if (matches.length === 0) {
        return { content: [{ type: "text" as const, text: `No se encontraron clientes con "${query}".` }] };
      }

      const header = `🔍 ${matches.length} resultado(s) para "${query}":\n\n`;
      const list = matches.map(formatClientBrief).join("\n\n");

      return { content: [{ type: "text" as const, text: header + list }] };
    } catch (err) {
      return { content: [{ type: "text" as const, text: `Error buscando clientes: ${err}` }], isError: true };
    }
  }
);

// ═══════════════════════════════════════════════════════════
// TOOL 2: listar_clientes
// ═══════════════════════════════════════════════════════════
server.tool(
  "listar_clientes",
  "Lista clientes con filtros por etapa del pipeline. Puede mostrar solo los vencidos (equivalente al Daily Ritual de la app).",
  {
    etapa: z
      .enum([...VALID_STAGES, "todos"])
      .default("todos")
      .describe("Filtrar por etapa: interes_nuevo, conexion_emocional, seguimiento_activo, obra_apartada, venta_realizada, post_venta, completado, o todos"),
    limite: z.number().min(1).max(100).default(20).describe("Máximo de resultados"),
    solo_vencidos: z.boolean().default(false).describe("true = solo clientes con seguimiento vencido (Daily Ritual)"),
    owner: z.string().optional().describe("Filtrar por email del owner/creador"),
  },
  async ({ etapa, limite, solo_vencidos, owner }) => {
    try {
      let q: FirebaseFirestore.Query = db.collection(COLLECTION).orderBy("updatedAt", "desc");

      if (etapa !== "todos") {
        q = q.where("stage", "==", etapa);
      }

      const snap = await q.limit(200).get();
      let clients = snap.docs.map(parseDoc);

      if (solo_vencidos) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        clients = clients.filter((c) => c.nextActionDate && c.nextActionDate < today);
      }

      if (owner) {
        const ownerLower = owner.toLowerCase();
        clients = clients.filter((c) => c.createdByName.toLowerCase().includes(ownerLower));
      }

      clients = clients.slice(0, limite);

      if (clients.length === 0) {
        const label = etapa === "todos" ? "todas las etapas" : STAGE_LABELS[etapa] || etapa;
        return {
          content: [{ type: "text" as const, text: `No hay clientes en ${label}${solo_vencidos ? " con seguimiento vencido" : ""}.` }],
        };
      }

      const label = etapa === "todos" ? "Todos" : STAGE_LABELS[etapa] || etapa;
      const header = `📋 ${clients.length} cliente(s) — ${label}${solo_vencidos ? " (⚠️ vencidos)" : ""}${owner ? ` — Owner: ${owner}` : ""}:\n\n`;
      const list = clients.map(formatClientBrief).join("\n\n");

      return { content: [{ type: "text" as const, text: header + list }] };
    } catch (err) {
      return { content: [{ type: "text" as const, text: `Error listando clientes: ${err}` }], isError: true };
    }
  }
);

// ═══════════════════════════════════════════════════════════
// TOOL 3: ver_cliente
// ═══════════════════════════════════════════════════════════
server.tool(
  "ver_cliente",
  "Muestra el detalle COMPLETO de un cliente: datos de contacto, nota emocional, seguimiento pendiente (con alerta si está vencido), obras de interés vinculadas, e historial completo de interacciones.",
  {
    id: z.string().describe("ID del documento del cliente en Firestore"),
  },
  async ({ id }) => {
    try {
      const docSnap = await db.collection(COLLECTION).doc(id).get();

      if (!docSnap.exists) {
        return { content: [{ type: "text" as const, text: `Cliente con ID "${id}" no encontrado.` }] };
      }

      const client = parseDoc(docSnap);
      return { content: [{ type: "text" as const, text: formatClientDetail(client) }] };
    } catch (err) {
      return { content: [{ type: "text" as const, text: `Error obteniendo cliente: ${err}` }], isError: true };
    }
  }
);

// ═══════════════════════════════════════════════════════════
// TOOL 4: actualizar_status
// ═══════════════════════════════════════════════════════════
server.tool(
  "actualizar_status",
  "Cambia la etapa del pipeline de un cliente. Si se mueve a 'venta_realizada', se registra automáticamente la fecha de venta.",
  {
    id: z.string().describe("ID del cliente"),
    nueva_etapa: z.enum(VALID_STAGES).describe("Nueva etapa del pipeline"),
  },
  async ({ id, nueva_etapa }) => {
    try {
      const docRef = db.collection(COLLECTION).doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return { content: [{ type: "text" as const, text: `Cliente con ID "${id}" no encontrado.` }] };
      }

      const data = docSnap.data()!;
      const prev = data.stage || "desconocido";
      const updates: Record<string, unknown> = {
        stage: nueva_etapa,
        updatedAt: Timestamp.now(),
      };

      if (nueva_etapa === "venta_realizada") {
        updates.saleDate = Timestamp.now();
      }

      await docRef.update(updates);

      const prevLabel = STAGE_LABELS[prev] || prev;
      const newLabel = STAGE_LABELS[nueva_etapa] || nueva_etapa;

      return {
        content: [{ type: "text" as const, text: `✅ "${data.name}" actualizado:\n   ${prevLabel} → ${newLabel}` }],
      };
    } catch (err) {
      return { content: [{ type: "text" as const, text: `Error actualizando status: ${err}` }], isError: true };
    }
  }
);

// ═══════════════════════════════════════════════════════════
// TOOL 5: agregar_nota
// ═══════════════════════════════════════════════════════════
server.tool(
  "agregar_nota",
  "Agrega una nota de seguimiento al historial de interacciones de un cliente. Se registra con fecha, hora y acción realizada.",
  {
    id: z.string().describe("ID del cliente"),
    nota: z.string().describe("Texto de la nota o seguimiento"),
    accion: z.string().optional().describe("Tipo de acción realizada (ej: Llamada, Email, Visita, WhatsApp)"),
  },
  async ({ id, nota, accion }) => {
    try {
      const docRef = db.collection(COLLECTION).doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return { content: [{ type: "text" as const, text: `Cliente con ID "${id}" no encontrado.` }] };
      }

      const newInteraction = {
        id: Date.now().toString(),
        date: Timestamp.now(),
        note: nota,
        actionTaken: accion || "",
      };

      await docRef.update({
        interactions: FieldValue.arrayUnion(newInteraction),
        updatedAt: Timestamp.now(),
      });

      const name = docSnap.data()?.name || "Cliente";

      return {
        content: [{ type: "text" as const, text: `✅ Nota agregada a "${name}":\n   "${nota}"${accion ? `\n   Acción: ${accion}` : ""}` }],
      };
    } catch (err) {
      return { content: [{ type: "text" as const, text: `Error agregando nota: ${err}` }], isError: true };
    }
  }
);

// ═══════════════════════════════════════════════════════════
// TOOL 6: actualizar_cliente
// ═══════════════════════════════════════════════════════════
server.tool(
  "actualizar_cliente",
  "Actualiza los datos de contacto de un cliente: nombre, email, teléfono, ciudad, país o nota emocional. Solo envía los campos que quieras cambiar.",
  {
    id: z.string().describe("ID del cliente"),
    nombre: z.string().optional().describe("Nuevo nombre del cliente"),
    email: z.string().optional().describe("Nuevo email"),
    telefono: z.string().optional().describe("Nuevo teléfono"),
    ciudad: z.string().optional().describe("Nueva ciudad"),
    pais: z.string().optional().describe("Nuevo país"),
    nota_emocional: z.string().optional().describe("Nueva nota emocional (el corazón del CRM: por qué conectaron con la obra)"),
    valor: z.number().optional().describe("Nuevo valor estimado de la venta en USD"),
    fuente: z.string().optional().describe("Nuevo origen del contacto"),
    tags: z.array(z.string()).optional().describe("Reemplazar tags del cliente (array completo)"),
  },
  async ({ id, nombre, email, telefono, ciudad, pais, nota_emocional, valor, fuente, tags }) => {
    try {
      const docRef = db.collection(COLLECTION).doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return { content: [{ type: "text" as const, text: `Cliente con ID "${id}" no encontrado.` }] };
      }

      const updates: Record<string, unknown> = { updatedAt: Timestamp.now() };
      const changes: string[] = [];

      if (nombre !== undefined) { updates.name = nombre; changes.push(`Nombre → ${nombre}`); }
      if (email !== undefined) { updates.email = email; changes.push(`Email → ${email}`); }
      if (telefono !== undefined) { updates.phone = telefono; changes.push(`Teléfono → ${telefono}`); }
      if (ciudad !== undefined) { updates.city = ciudad; changes.push(`Ciudad → ${ciudad}`); }
      if (pais !== undefined) { updates.country = pais; changes.push(`País → ${pais}`); }
      if (nota_emocional !== undefined) { updates.emotionalNote = nota_emocional; changes.push(`Nota emocional → "${nota_emocional}"`); }
      if (valor !== undefined) { updates.dealValue = valor; changes.push(`Valor → $${valor.toLocaleString()}`); }
      if (fuente !== undefined) { updates.source = fuente; changes.push(`Fuente → ${fuente}`); }
      if (tags !== undefined) { updates.tags = tags; changes.push(`Tags → [${tags.join(", ")}]`); }

      if (changes.length === 0) {
        return { content: [{ type: "text" as const, text: "No se proporcionaron campos para actualizar." }] };
      }

      await docRef.update(updates);

      const name = docSnap.data()?.name || "Cliente";
      return {
        content: [{ type: "text" as const, text: `✅ "${name}" actualizado:\n${changes.map(c => `   • ${c}`).join("\n")}` }],
      };
    } catch (err) {
      return { content: [{ type: "text" as const, text: `Error actualizando cliente: ${err}` }], isError: true };
    }
  }
);

// ═══════════════════════════════════════════════════════════
// TOOL 7: fijar_seguimiento
// ═══════════════════════════════════════════════════════════
server.tool(
  "fijar_seguimiento",
  "Programa o actualiza el próximo seguimiento de un cliente: qué acción hacer, cuándo, y una descripción. Esto es lo que aparece en el Daily Ritual de la app.",
  {
    id: z.string().describe("ID del cliente"),
    accion: z.enum(VALID_ACTIONS).describe("Tipo de acción: llamar, enviar_fotos, enviar_cotizacion, enviar_video, visita_galeria, confirmar_entrega, agradecer, otro"),
    fecha: z.string().describe("Fecha del seguimiento en formato YYYY-MM-DD"),
    descripcion: z.string().optional().describe("Descripción detallada de qué hacer"),
  },
  async ({ id, accion, fecha, descripcion }) => {
    try {
      const docRef = db.collection(COLLECTION).doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return { content: [{ type: "text" as const, text: `Cliente con ID "${id}" no encontrado.` }] };
      }

      const parsedDate = new Date(fecha + "T00:00:00");
      if (isNaN(parsedDate.getTime())) {
        return { content: [{ type: "text" as const, text: `Fecha inválida: "${fecha}". Usa formato YYYY-MM-DD.` }] };
      }

      await docRef.update({
        nextAction: accion,
        nextActionDate: Timestamp.fromDate(parsedDate),
        nextActionDescription: descripcion || "",
        updatedAt: Timestamp.now(),
      });

      const name = docSnap.data()?.name || "Cliente";
      const actionLabel = ACTION_LABELS[accion] || accion;

      return {
        content: [{
          type: "text" as const,
          text: `✅ Seguimiento programado para "${name}":\n   📅 ${actionLabel} — ${formatDate(parsedDate)}\n   ${descripcion || "Sin descripción adicional"}`,
        }],
      };
    } catch (err) {
      return { content: [{ type: "text" as const, text: `Error fijando seguimiento: ${err}` }], isError: true };
    }
  }
);

// ═══════════════════════════════════════════════════════════
// TOOL 8: completar_seguimiento
// ═══════════════════════════════════════════════════════════
server.tool(
  "completar_seguimiento",
  "Marca como completado el seguimiento actual de un cliente. Registra la acción en el historial y limpia el seguimiento pendiente. Equivalente al botón 'Done' de la app.",
  {
    id: z.string().describe("ID del cliente"),
    nota: z.string().optional().describe("Nota sobre cómo fue el seguimiento (se agrega al historial)"),
  },
  async ({ id, nota }) => {
    try {
      const docRef = db.collection(COLLECTION).doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return { content: [{ type: "text" as const, text: `Cliente con ID "${id}" no encontrado.` }] };
      }

      const data = docSnap.data()!;

      if (!data.nextAction) {
        return { content: [{ type: "text" as const, text: `"${data.name}" no tiene seguimiento pendiente.` }] };
      }

      const actionLabel = ACTION_LABELS[data.nextAction] || data.nextAction;
      const completionNote = nota || `Completado: ${actionLabel}${data.nextActionDescription ? ` - ${data.nextActionDescription}` : ""}`;

      const newInteraction = {
        id: Date.now().toString(),
        date: Timestamp.now(),
        note: completionNote,
        actionTaken: actionLabel,
      };

      await docRef.update({
        nextAction: FieldValue.delete(),
        nextActionDescription: "",
        nextActionDate: FieldValue.delete(),
        interactions: FieldValue.arrayUnion(newInteraction),
        updatedAt: Timestamp.now(),
      });

      return {
        content: [{
          type: "text" as const,
          text: `✅ Seguimiento completado para "${data.name}":\n   Acción: ${actionLabel}\n   Nota: "${completionNote}"`,
        }],
      };
    } catch (err) {
      return { content: [{ type: "text" as const, text: `Error completando seguimiento: ${err}` }], isError: true };
    }
  }
);

// ═══════════════════════════════════════════════════════════
// TOOL 9: reporte_resumen
// ═══════════════════════════════════════════════════════════
server.tool(
  "reporte_resumen",
  "Genera un reporte completo del CRM: total de clientes, distribución por etapa del pipeline (con barras visuales), seguimientos vencidos con días de retraso, clientes nuevos de la semana, y clientes sin contactar.",
  {
    dias_sin_contacto: z.number().min(1).default(7).describe("Días sin actualización para marcar como 'sin contactar'"),
  },
  async ({ dias_sin_contacto }) => {
    try {
      const snap = await db.collection(COLLECTION).get();
      const clients = snap.docs.map(parseDoc);
      const total = clients.length;

      if (total === 0) {
        return { content: [{ type: "text" as const, text: "El CRM está vacío. No hay clientes registrados." }] };
      }

      // Count by stage
      const byStage: Record<string, number> = {};
      for (const c of clients) {
        byStage[c.stage] = (byStage[c.stage] || 0) + 1;
      }

      // Overdue follow-ups
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const overdue = clients.filter((c) => c.nextActionDate && c.nextActionDate < today);

      // Pending today
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const pendingToday = clients.filter((c) => {
        if (!c.nextActionDate) return false;
        return c.nextActionDate >= today && c.nextActionDate < tomorrow;
      });

      // New this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const newThisWeek = clients.filter((c) => c.createdAt && c.createdAt > weekAgo);

      // No contact in X days
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - dias_sin_contacto);
      const noContact = clients.filter(
        (c) => c.updatedAt && c.updatedAt < threshold && c.stage !== "completado"
      );

      // Sales
      const sales = clients.filter(
        (c) => c.stage === "venta_realizada" || c.stage === "post_venta" || c.stage === "completado"
      );

      // In progress (active pipeline)
      const inProgress = clients.filter(
        (c) => c.stage !== "completado" && c.stage !== "venta_realizada" && c.stage !== "post_venta"
      );

      // Count by owner
      const byOwner: Record<string, number> = {};
      for (const c of clients) {
        const owner = c.createdByName || "Sin asignar";
        byOwner[owner] = (byOwner[owner] || 0) + 1;
      }

      let text = `
📊 RESUMEN DEL CRM
═══════════════════════════════════════
Total clientes:    ${total}
Ventas cerradas:   ${sales.length}
En progreso:       ${inProgress.length}
Pendientes hoy:    ${pendingToday.length}
Nuevos (7 días):   ${newThisWeek.length}
Vencidos:          ${overdue.length}

📈 PIPELINE:`;

      for (const stage of VALID_STAGES) {
        const count = byStage[stage] || 0;
        const label = STAGE_LABELS[stage] || stage;
        const bar = "█".repeat(Math.min(count * 2, 20));
        text += `\n  ${label.padEnd(22)} ${String(count).padStart(3)}  ${bar}`;
      }

      // Owners
      text += `\n\n👥 POR OWNER:`;
      for (const [owner, count] of Object.entries(byOwner).sort((a, b) => b[1] - a[1])) {
        text += `\n  ${owner.padEnd(35)} ${count}`;
      }

      // Overdue
      if (overdue.length > 0) {
        text += `\n\n⚠️ SEGUIMIENTOS VENCIDOS (${overdue.length}):`;
        const sorted = overdue.sort((a, b) => {
          const da = a.nextActionDate?.getTime() || 0;
          const db = b.nextActionDate?.getTime() || 0;
          return da - db;
        });
        for (const c of sorted.slice(0, 15)) {
          const action = c.nextAction ? ACTION_LABELS[c.nextAction] || c.nextAction : "Pendiente";
          const days = daysSince(c.nextActionDate);
          text += `\n  • ${c.name} — ${action} (${days} días de retraso)`;
          if (c.nextActionDescription) text += `\n    "${c.nextActionDescription}"`;
        }
        if (overdue.length > 15) text += `\n  ... y ${overdue.length - 15} más`;
      } else {
        text += `\n\n✅ No hay seguimientos vencidos.`;
      }

      // No contact
      if (noContact.length > 0) {
        text += `\n\n😴 SIN CONTACTO (>${dias_sin_contacto} días): ${noContact.length}`;
        for (const c of noContact.slice(0, 10)) {
          const days = daysSince(c.updatedAt);
          const stage = STAGE_LABELS[c.stage] || c.stage;
          text += `\n  • ${c.name} — ${stage} — ${days} días sin actualizar`;
        }
        if (noContact.length > 10) text += `\n  ... y ${noContact.length - 10} más`;
      }

      return { content: [{ type: "text" as const, text: text.trim() }] };
    } catch (err) {
      return { content: [{ type: "text" as const, text: `Error generando reporte: ${err}` }], isError: true };
    }
  }
);

// ═══════════════════════════════════════════════════════════
// TOOL 10: crear_cliente
// ═══════════════════════════════════════════════════════════
server.tool(
  "crear_cliente",
  "Crea un nuevo cliente en el CRM. Campos obligatorios: nombre y nota emocional. El resto es opcional. Retorna el ID del nuevo cliente.",
  {
    nombre: z.string().describe("Nombre del cliente (obligatorio)"),
    nota_emocional: z.string().describe("Nota emocional: por qué conectó con la obra (obligatorio)"),
    email: z.string().optional().describe("Email del cliente"),
    telefono: z.string().optional().describe("Teléfono del cliente"),
    ciudad: z.string().optional().describe("Ciudad"),
    pais: z.string().optional().describe("País"),
    etapa: z.enum(VALID_STAGES).default("interes_nuevo").describe("Etapa inicial del pipeline"),
    valor: z.number().optional().describe("Valor estimado de la venta en USD"),
    fuente: z.string().optional().describe("Origen del contacto (Gallery Visit, Instagram, Referral, Art Fair, Website, Other)"),
    tags: z.array(z.string()).optional().describe("Etiquetas para segmentar (ej: VIP, Coleccionista)"),
    accion: z.enum(VALID_ACTIONS).optional().describe("Próxima acción de seguimiento"),
    fecha_accion: z.string().optional().describe("Fecha del seguimiento en formato YYYY-MM-DD"),
    descripcion_accion: z.string().optional().describe("Descripción de la acción"),
  },
  async ({ nombre, nota_emocional, email, telefono, ciudad, pais, etapa, valor, fuente, tags, accion, fecha_accion, descripcion_accion }) => {
    try {
      const docData: Record<string, unknown> = {
        name: nombre,
        emotionalNote: nota_emocional,
        email: email || "",
        phone: telefono || "",
        city: ciudad || "",
        country: pais || "",
        stage: etapa,
        dealValue: valor || 0,
        source: fuente || "",
        tags: tags || [],
        nextActionDescription: descripcion_accion || "",
        interestedArtworks: [],
        interactions: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      if (accion) docData.nextAction = accion;
      if (fecha_accion) {
        const parsed = new Date(fecha_accion + "T00:00:00");
        if (!isNaN(parsed.getTime())) docData.nextActionDate = Timestamp.fromDate(parsed);
      }

      const docRef = await db.collection(COLLECTION).add(docData);

      return {
        content: [{
          type: "text" as const,
          text: `✅ Cliente "${nombre}" creado con éxito.\n   ID: ${docRef.id}\n   Etapa: ${STAGE_LABELS[etapa] || etapa}${valor ? `\n   Valor: $${valor.toLocaleString()}` : ""}${accion ? `\n   Próxima acción: ${ACTION_LABELS[accion] || accion} (${fecha_accion || "sin fecha"})` : ""}`,
        }],
      };
    } catch (err) {
      return { content: [{ type: "text" as const, text: `Error creando cliente: ${err}` }], isError: true };
    }
  }
);

// ═══════════════════════════════════════════════════════════
// TOOL 11: eliminar_cliente
// ═══════════════════════════════════════════════════════════
server.tool(
  "eliminar_cliente",
  "Elimina un cliente del CRM de forma permanente. Usa con precaución — se recomienda mover a 'completado' en vez de borrar.",
  {
    id: z.string().describe("ID del cliente a eliminar"),
    confirmar: z.boolean().describe("Debe ser true para confirmar la eliminación"),
  },
  async ({ id, confirmar }) => {
    try {
      if (!confirmar) {
        return { content: [{ type: "text" as const, text: "Eliminación cancelada. Envía confirmar=true para proceder.\n💡 Tip: Considera mover al cliente a etapa 'completado' en vez de borrar." }] };
      }

      const docRef = db.collection(COLLECTION).doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return { content: [{ type: "text" as const, text: `Cliente con ID "${id}" no encontrado.` }] };
      }

      const name = docSnap.data()?.name || "Cliente";
      await docRef.delete();

      return {
        content: [{ type: "text" as const, text: `🗑️ Cliente "${name}" eliminado permanentemente.` }],
      };
    } catch (err) {
      return { content: [{ type: "text" as const, text: `Error eliminando cliente: ${err}` }], isError: true };
    }
  }
);

// ═══════════════════════════════════════════════════════════
// TOOL 12: ritual_diario
// ═══════════════════════════════════════════════════════════
server.tool(
  "ritual_diario",
  "Muestra exactamente lo que ve el usuario en la vista Daily Ritual: follow-ups vencidos y pendientes para hoy, ordenados por urgencia. Incluye prioridad #1 con nota emocional.",
  {
    owner: z.string().optional().describe("Filtrar por email del owner"),
  },
  async ({ owner }) => {
    try {
      const snap = await db.collection(COLLECTION).get();
      let clients = snap.docs.map(parseDoc);

      if (owner) {
        const ownerLower = owner.toLowerCase();
        clients = clients.filter(c => c.createdByName.toLowerCase().includes(ownerLower));
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const ritual = clients
        .filter(c => c.nextActionDate && c.nextActionDate < tomorrow)
        .sort((a, b) => (a.nextActionDate?.getTime() || 0) - (b.nextActionDate?.getTime() || 0));

      if (ritual.length === 0) {
        return { content: [{ type: "text" as const, text: "☀️ Tu lista está limpia. No hay seguimientos pendientes para hoy.\nUsa este tiempo para conectar con nuevos prospectos." }] };
      }

      const overdue = ritual.filter(c => c.nextActionDate! < today);
      const todayOnly = ritual.filter(c => c.nextActionDate! >= today);
      const priority = ritual[0];

      let text = `☀️ RITUAL DIARIO\n═══════════════════════════════════════\n`;
      text += `${overdue.length} vencido(s), ${todayOnly.length} para hoy — ${ritual.length} total\n`;

      text += `\n🎯 PRIORIDAD #1: ${priority.name}`;
      text += `\n   ${priority.nextAction ? ACTION_LABELS[priority.nextAction] || priority.nextAction : "Pendiente"}`;
      if (priority.nextActionDate) text += ` (${daysSince(priority.nextActionDate)} días de retraso)`;
      if (priority.nextActionDescription) text += `\n   "${priority.nextActionDescription}"`;
      text += `\n   💚 "${priority.emotionalNote}"`;

      if (overdue.length > 0) {
        text += `\n\n⚠️ VENCIDOS (${overdue.length}):`;
        for (const c of overdue) {
          const action = c.nextAction ? ACTION_LABELS[c.nextAction] || c.nextAction : "Pendiente";
          const days = daysSince(c.nextActionDate);
          text += `\n  • ${c.name} — ${action} (${days}d de retraso)`;
          if (c.nextActionDescription) text += `\n    → ${c.nextActionDescription}`;
        }
      }

      if (todayOnly.length > 0) {
        text += `\n\n📅 PARA HOY (${todayOnly.length}):`;
        for (const c of todayOnly) {
          const action = c.nextAction ? ACTION_LABELS[c.nextAction] || c.nextAction : "Pendiente";
          text += `\n  • ${c.name} — ${action}`;
          if (c.nextActionDescription) text += `\n    → ${c.nextActionDescription}`;
        }
      }

      return { content: [{ type: "text" as const, text }] };
    } catch (err) {
      return { content: [{ type: "text" as const, text: `Error obteniendo ritual diario: ${err}` }], isError: true };
    }
  }
);

// ═══════════════════════════════════════════════════════════
// TOOL 13: clientes_enfriandose
// ═══════════════════════════════════════════════════════════
server.tool(
  "clientes_enfriandose",
  "Muestra contactos que se están 'enfriando': sin actividad en X días, sin follow-up programado, y que no están en etapa 'completado'. Estos clientes necesitan atención urgente.",
  {
    dias: z.number().min(1).default(7).describe("Días sin contacto para considerar 'enfriándose'"),
    owner: z.string().optional().describe("Filtrar por email del owner"),
  },
  async ({ dias, owner }) => {
    try {
      const snap = await db.collection(COLLECTION).get();
      let clients = snap.docs.map(parseDoc);

      if (owner) {
        const ownerLower = owner.toLowerCase();
        clients = clients.filter(c => c.createdByName.toLowerCase().includes(ownerLower));
      }

      const threshold = new Date();
      threshold.setDate(threshold.getDate() - dias);

      const stale = clients.filter(c => {
        if (c.stage === "completado") return false;
        const lastContact = c.lastContactedAt || c.updatedAt;
        if (!lastContact || lastContact >= threshold) return false;
        // Extra: no tiene follow-up programado = más preocupante
        return true;
      }).sort((a, b) => {
        const da = (a.lastContactedAt || a.updatedAt)?.getTime() || 0;
        const db2 = (b.lastContactedAt || b.updatedAt)?.getTime() || 0;
        return da - db2; // Más tiempo sin contacto primero
      });

      if (stale.length === 0) {
        return { content: [{ type: "text" as const, text: `✅ No hay clientes enfriándose (>${dias} días sin contacto). ¡Buen trabajo!` }] };
      }

      let text = `🥶 CLIENTES ENFRIÁNDOSE (>${dias} días sin contacto)\n═══════════════════════════════════════\n${stale.length} cliente(s) necesitan atención:\n`;

      for (const c of stale.slice(0, 20)) {
        const lastContact = c.lastContactedAt || c.updatedAt;
        const days = daysSince(lastContact);
        const stage = STAGE_LABELS[c.stage] || c.stage;
        const hasAction = c.nextAction ? "✅ tiene acción" : "❌ sin acción";
        text += `\n• ${c.name}  |  ${stage}  |  ${days}d sin contacto  |  ${hasAction}`;
        if (c.dealValue > 0) text += `  |  $${c.dealValue.toLocaleString()}`;
        text += `\n  💚 "${c.emotionalNote.substring(0, 60)}${c.emotionalNote.length > 60 ? "..." : ""}"`;
      }

      if (stale.length > 20) text += `\n\n... y ${stale.length - 20} más`;

      // Resumen
      const noAction = stale.filter(c => !c.nextAction).length;
      const withValue = stale.filter(c => c.dealValue > 0);
      const totalValue = withValue.reduce((sum, c) => sum + (c.dealValue || 0), 0);
      text += `\n\n📊 Resumen: ${noAction} sin acción programada`;
      if (totalValue > 0) text += `, $${totalValue.toLocaleString()} en valor de pipeline en riesgo`;

      return { content: [{ type: "text" as const, text }] };
    } catch (err) {
      return { content: [{ type: "text" as const, text: `Error obteniendo clientes enfriándose: ${err}` }], isError: true };
    }
  }
);

// ─── Start Server ──────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CRM MCP Server running (stdio) — 13 tools available");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
