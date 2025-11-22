#!/bin/bash
# Script para configurar GitHub CLI y hacer push (ejecutar en tu terminal local)

echo "🚀 Configuración de GitHub CLI y Push"
echo "======================================"
echo ""

# Paso 1: Instalar gh CLI (si no está instalado)
if ! command -v gh &> /dev/null; then
    echo "📦 Instalando GitHub CLI..."

    # Para Mac
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install gh
    # Para Linux
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
        sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
        sudo apt update
        sudo apt install gh -y
    fi
else
    echo "✅ GitHub CLI ya instalado"
fi

# Paso 2: Autenticar con GitHub (solo primera vez)
echo ""
echo "🔐 Autenticando con GitHub..."
gh auth login

# Verificar autenticación
if gh auth status &> /dev/null; then
    echo "✅ Autenticación exitosa"
else
    echo "❌ Error de autenticación"
    exit 1
fi

# Paso 3: Hacer push
echo ""
echo "📤 Haciendo push a GitHub..."
git push -u origin feat/firebase-integration-phase-6

if [ $? -eq 0 ]; then
    echo "✅ Push exitoso"
else
    echo "❌ Error en push"
    exit 1
fi

# Paso 4: Crear Pull Request
echo ""
echo "🔀 Creando Pull Request..."
gh pr create \
  --base main \
  --title "feat: Firebase Authentication + Feature-First Architecture" \
  --body "## 🎯 Objetivo

Integrar Firebase Authentication con arquitectura Feature-First e implementar lazy loading para resolver pantalla blanca.

## 📦 Cambios Principales

### Arquitectura
- ✅ Implementar Feature-First structure (\`/src/features\`)
- ✅ Reorganizar componentes por funcionalidad
- ✅ Crear \`/src/shared\` para código reutilizable

### Firebase Integration
- ✅ AuthProvider con session persistence
- ✅ Login/Logout funcional
- ✅ Protected routes
- ✅ Firestore & Storage security rules
- ✅ Usuario admin: obrgaleria@ivanguaderrama.com

### Bug Fixes
- ✅ Lazy loading para componentes AI (fix pantalla blanca)
- ✅ React Hooks rules corregidas
- ✅ Eliminado index.ts de Genkit (conflicto)

## 🧪 Testing

- ✅ \`npm run build\` PASSED
- ✅ Firebase Auth funcional
- ✅ Session persistence working
- ✅ Login/Logout working

## 📊 Stats

- **Archivos:** 93 changed (+13,679 lines, -4,478 lines)
- **Features:** 6 (auth, artwork-management, numbered-editions, mini-works, ai-naming, artwork-simulator)
- **Documentación:** 10 archivos MD en \`/docs/development\`

## 🚀 Próximos Pasos

1. Revisar cambios de arquitectura
2. Verificar que Firebase Auth funciona en todos los ambientes
3. Conectar componentes con Firestore (próximo PR)

---

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

if [ $? -eq 0 ]; then
    echo "✅ Pull Request creado exitosamente"
    echo ""
    gh pr view --web
else
    echo "❌ Error creando Pull Request"
    exit 1
fi

echo ""
echo "======================================"
echo "✅ ¡Todo listo!"
echo "======================================"
