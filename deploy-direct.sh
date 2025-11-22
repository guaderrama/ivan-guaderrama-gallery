#!/bin/bash

echo "🚀 Iniciando deploy directo a Firebase Hosting..."

# Verificar que dist existe
if [ ! -d "dist" ]; then
  echo "❌ Error: La carpeta dist/ no existe. Ejecutando build..."
  npm run build
fi

echo "📦 Archivos listos en dist/"

# Intentar método 1: Firebase CLI (requiere auth manual)
echo ""
echo "🔄 Preparando commit y push para GitHub Actions..."

# Commit los cambios
git add .
git commit -m "fix: Firebase Storage integration for images

- Replace base64 image storage with Firebase Storage URLs
- Add storageService for image uploads
- Fix ProductForm to upload images to Storage
- Add debugging logs for troubleshooting
- Update firebase.json with site name

This fixes the 'imagenUrl longer than 1048487 bytes' error.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>" 2>&1

# Push al repositorio
git push origin HEAD 2>&1

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Cambios pusheados a GitHub!"
  echo ""
  echo "⚠️  Para completar el deploy automático, necesitas configurar el secret:"
  echo ""
  echo "1. Ve a: https://github.com/guaderrama/ivan-guaderrama-gallery/settings/secrets/actions"
  echo "2. Click en 'New repository secret'"
  echo "3. Nombre: FIREBASE_SERVICE_ACCOUNT"
  echo "4. Valor: Copia el JSON de la service account de Firebase"
  echo ""
  echo "O ejecuta manualmente en tu computadora:"
  echo "  firebase deploy --only hosting"
  echo ""
  exit 0
fi

echo "❌ Falló método 2"
echo ""
echo "📋 INSTRUCCIONES MANUALES:"
echo ""
echo "Los archivos están listos en la carpeta dist/"
echo ""
echo "Opción A - Firebase Console:"
echo "  1. Ve a: https://console.firebase.google.com/project/ivan-guaderrama-gallery/hosting"
echo "  2. Arrastra la carpeta dist/ completa"
echo ""
echo "Opción B - Firebase CLI en tu computadora:"
echo "  1. Descarga esta carpeta del proyecto"
echo "  2. Ejecuta: firebase deploy --only hosting"
echo ""

exit 1
