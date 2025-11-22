#!/bin/bash

set -e

echo "🚀 Deploy a Firebase Hosting usando gcloud..."

# Get access token
TOKEN=$(gcloud auth print-access-token 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ No se pudo obtener el token de gcloud"
  exit 1
fi

echo "✅ Token obtenido"

# Project details
PROJECT_ID="ivan-guaderrama-gallery"
SITE_ID="ivan-guaderrama-gallery"

echo "📦 Verificando carpeta dist..."
if [ ! -d "dist" ]; then
  echo "❌ dist/ no existe. Ejecutando build..."
  npm run build
fi

echo "✅ dist/ lista con $(find dist -type f | wc -l) archivos"

# Create a tarball
echo "📦 Comprimiendo archivos..."
cd dist
tar -czf ../deploy.tar.gz .
cd ..

FILE_SIZE=$(stat -f%z deploy.tar.gz 2>/dev/null || stat -c%s deploy.tar.gz)
echo "✅ Archivo creado: deploy.tar.gz ($(echo "scale=2; $FILE_SIZE/1024" | bc) KB)"

# Create version
echo "🔄 Creando nueva versión en Firebase Hosting..."
VERSION_RESPONSE=$(curl -s -X POST \
  "https://firebasehosting.googleapis.com/v1beta1/sites/${SITE_ID}/versions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "rewrites": [{
        "glob": "**",
        "path": "/index.html"
      }]
    }
  }')

VERSION_NAME=$(echo "$VERSION_RESPONSE" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)

if [ -z "$VERSION_NAME" ]; then
  echo "❌ Error creando versión:"
  echo "$VERSION_RESPONSE"
  exit 1
fi

echo "✅ Versión creada: $VERSION_NAME"

# Upload files
echo "📤 Subiendo archivos..."
UPLOAD_URL=$(echo "$VERSION_RESPONSE" | grep -o '"uploadUrl":"[^"]*"' | cut -d'"' -f4 | sed 's/\\//g')

if [ -z "$UPLOAD_URL" ]; then
  echo "❌ No se obtuvo URL de upload"
  exit 1
fi

UPLOAD_RESPONSE=$(curl -s -X POST \
  "${UPLOAD_URL}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/x-gzip" \
  --data-binary @deploy.tar.gz)

echo "✅ Archivos subidos"

# Finalize version
echo "🔄 Finalizando versión..."
FINALIZE_RESPONSE=$(curl -s -X PATCH \
  "https://firebasehosting.googleapis.com/${VERSION_NAME}?update_mask=status" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"status": "FINALIZED"}')

echo "✅ Versión finalizada"

# Deploy to live channel
echo "🚀 Desplegando a producción..."
RELEASE_RESPONSE=$(curl -s -X POST \
  "https://firebasehosting.googleapis.com/v1beta1/sites/${SITE_ID}/channels/live/releases" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"version\": \"${VERSION_NAME}\"}")

echo ""
echo "✅ ¡DEPLOY EXITOSO!"
echo ""
echo "Tu sitio está disponible en:"
echo "  https://${SITE_ID}.web.app"
echo "  https://${SITE_ID}.firebaseapp.com"
echo ""
echo "⏳ Espera 1-2 minutos para que se propague"
echo "🔄 Luego recarga con Ctrl+Shift+R"

# Cleanup
rm -f deploy.tar.gz

exit 0
