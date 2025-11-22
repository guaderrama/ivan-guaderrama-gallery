#!/bin/bash

echo "🚀 Deployando a Firebase Hosting..."

# Verificar dist
if [ ! -d "dist" ]; then
  echo "Building..."
  npm run build
fi

# Get token
TOKEN=$(gcloud auth print-access-token)

# Crear tarball
cd dist && tar -czf ../site.tar.gz . && cd ..

# Crear versión y deploy en un solo paso usando Firebase CLI con token de gcloud
echo "Desplegando..."

# Usar firebase deploy con el token de gcloud
GOOGLE_APPLICATION_CREDENTIALS="" firebase deploy --only hosting --token "$TOKEN" --non-interactive 2>&1

if [ $? -eq 0 ]; then
  echo "✅ DEPLOY EXITOSO!"
  echo "Sitio: https://ivan-guaderrama-gallery.web.app"
else
  echo "Intentando método alternativo..."
  # Limpiar y recrear
  rm -rf .firebase
  firebase use ivan-guaderrama-gallery --token "$TOKEN"
  firebase deploy --only hosting --token "$TOKEN" --non-interactive
fi

rm -f site.tar.gz
