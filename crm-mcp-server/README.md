# CRM MCP Server — Ivan Guaderrama Gallery

MCP Server (stdio) que conecta un AI assistant con el CRM en Firestore.

## Setup

```bash
cd crm-mcp-server
npm install
npm run build
```

## Credenciales Firebase

Copia `.env.example` a `.env` y configura:

```bash
cp .env.example .env
```

**Opcion 1** — Service account file:
```
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

**Opcion 2** — Inline JSON (para VPS):
```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"ivan-guaderrama-gallery",...}
```

Para generar el service account key:
1. Firebase Console > Project Settings > Service Accounts
2. Generate New Private Key
3. Guardar el JSON

## Ejecutar

```bash
# Desarrollo
npm run dev

# Produccion (despues de build)
node dist/index.js
```

## Configurar en OpenClaw / Claude Desktop

Agregar a la config MCP del client:

```json
{
  "mcpServers": {
    "crm-galeria": {
      "command": "node",
      "args": ["/path/to/crm-mcp-server/dist/index.js"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/service-account-key.json"
      }
    }
  }
}
```

## Tools disponibles

| Tool | Descripcion |
|------|-------------|
| `buscar_cliente` | Busca por nombre, email o telefono |
| `listar_clientes` | Lista con filtro por etapa y vencidos |
| `ver_cliente` | Detalle completo de un cliente |
| `actualizar_status` | Cambia etapa del pipeline |
| `agregar_nota` | Agrega nota al historial |
| `reporte_resumen` | Resumen del CRM con metricas |
