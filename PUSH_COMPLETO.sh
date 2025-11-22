#!/bin/bash

# Script completo para hacer push con gh CLI ya instalado

GH="/nix/store/kaj0mckcnigf7zixf4np6cjb45h57wy0-gh-2.39.2/bin/gh"

echo "🚀 Push Completo a GitHub"
echo "========================="
echo ""

# Verificar que gh está autenticado
if ! $GH auth status > /dev/null 2>&1; then
    echo "❌ GitHub CLI no está autenticado"
    echo ""
    echo "Primero autentica con una de estas opciones:"
    echo ""
    echo "OPCIÓN 1 - Personal Access Token (más fácil):"
    echo "  1. Ve a: https://github.com/settings/tokens/new"
    echo "  2. Scopes: repo, workflow"
    echo "  3. Copia el token"
    echo "  4. Ejecuta: echo 'TOKEN' | $GH auth login --with-token"
    echo ""
    echo "OPCIÓN 2 - Interactive (requiere browser):"
    echo "  $GH auth login"
    echo ""
    exit 1
fi

echo "✅ GitHub CLI autenticado"
echo ""

# Push
echo "📤 Haciendo push..."
if git push -u origin feat/firebase-integration-phase-6; then
    echo "✅ Push exitoso"
else
    echo "❌ Error en push"
    exit 1
fi

echo ""

# Crear PR
echo "🔀 Creando Pull Request..."
$GH pr create \
  --base main \
  --title "feat: Firebase Authentication + Feature-First Architecture" \
  --body "## 🎯 Objetivo

Integrar Firebase Authentication con arquitectura Feature-First e implementar lazy loading.

## 📦 Cambios Principales

### Arquitectura
- ✅ Feature-First structure (\`/src/features\`)
- ✅ Reorganización completa de componentes
- ✅ Shared components en \`/src/shared\`

### Firebase Integration
- ✅ AuthProvider con session persistence
- ✅ Login/Logout funcional
- ✅ Protected routes
- ✅ Firestore & Storage security rules
- ✅ Usuario admin: obrgaleria@ivanguaderrama.com

### Bug Fixes
- ✅ Lazy loading para componentes AI (fix pantalla blanca)
- ✅ Null safety en useMemo
- ✅ React Hooks rules corregidas

## 🧪 Testing
- ✅ \`npm run build\` PASSED
- ✅ Firebase Auth funcional
- ✅ Dashboard completamente funcional

## 📊 Stats
- **Archivos:** 93 changed (+13,679 lines, -4,478 lines)
- **Commits:** 2 (Firebase integration + null safety fix)

---
🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

if [ $? -eq 0 ]; then
    echo "✅ Pull Request creado exitosamente"
    echo ""
    $GH pr view --web 2>/dev/null || $GH pr view
else
    echo "⚠️ Error creando PR (puede que ya exista)"
    $GH pr list | head -5
fi

echo ""
echo "================================="
echo "✅ ¡Push Completado!"
echo "================================="

