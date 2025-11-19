#!/bin/bash

# FASE 2 Deployment Script
# Despliega todas las reglas de seguridad e índices

echo "🚀 FASE 2 - Despliegue de Reglas e Índices"
echo "==========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if authenticated
echo -n "Verificando autenticación... "
if ! firebase projects:list &> /dev/null; then
    echo -e "${RED}✗${NC}"
    echo ""
    echo "ERROR: No estás autenticado en Firebase CLI"
    echo ""
    echo "Ejecuta primero:"
    echo "  firebase login --no-localhost"
    exit 1
fi
echo -e "${GREEN}✓${NC}"

# Get current project
project_id=$(firebase use 2>&1 | grep "Active project" | cut -d'(' -f2 | cut -d')' -f1)
echo -e "Proyecto activo: ${BLUE}$project_id${NC}"
echo ""

# Confirm before deploying
read -p "¿Desplegar reglas e índices? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelado"
    exit 0
fi

echo ""
echo "Desplegando..."
echo ""

# Deploy Firestore rules
echo "📜 1/3 - Firestore Rules..."
if firebase deploy --only firestore:rules; then
    echo -e "${GREEN}✓ Firestore rules desplegadas${NC}"
else
    echo -e "${RED}✗ Error desplegando Firestore rules${NC}"
    exit 1
fi
echo ""

# Deploy Storage rules
echo "📦 2/3 - Storage Rules..."
if firebase deploy --only storage:rules; then
    echo -e "${GREEN}✓ Storage rules desplegadas${NC}"
else
    echo -e "${RED}✗ Error desplegando Storage rules${NC}"
    exit 1
fi
echo ""

# Deploy Firestore indexes
echo "🔍 3/3 - Firestore Indexes..."
if firebase deploy --only firestore:indexes; then
    echo -e "${GREEN}✓ Firestore indexes desplegados${NC}"
else
    echo -e "${RED}✗ Error desplegando Firestore indexes${NC}"
    exit 1
fi

echo ""
echo "==========================================="
echo -e "${GREEN}✓ Despliegue completado exitosamente!${NC}"
echo ""
echo "Verifica en Firebase Console:"
echo "  Firestore → Rules"
echo "  Storage → Rules"
echo "  Firestore → Indexes"
echo ""
echo "Siguiente paso:"
echo "  1. Crea un usuario admin (FASE_2_SETUP_INTERACTIVO.md - Paso 6)"
echo "  2. Verifica la integración (npm run dev)"
