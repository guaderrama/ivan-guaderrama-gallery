#!/bin/bash

# FASE 5 Deployment Script
# Despliega Cloud Functions a Firebase

echo "🚀 FASE 5 - Deployment de Cloud Functions"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if in project root
if [ ! -f "firebase.json" ]; then
    echo -e "${RED}Error: Ejecuta este script desde la raíz del proyecto${NC}"
    exit 1
fi

# Check if functions directory exists
if [ ! -d "functions" ]; then
    echo -e "${RED}Error: Directorio functions/ no existe${NC}"
    exit 1
fi

# Check Firebase CLI auth
echo -n "1. Verificando autenticación Firebase... "
if ! firebase projects:list &> /dev/null; then
    echo -e "${RED}✗${NC}"
    echo ""
    echo "ERROR: No estás autenticado en Firebase CLI"
    echo "Ejecuta: firebase login --no-localhost"
    exit 1
fi
echo -e "${GREEN}✓${NC}"

# Check if dependencies are installed
echo -n "2. Verificando dependencias... "
if [ ! -d "functions/node_modules" ]; then
    echo -e "${YELLOW}⚠${NC}"
    echo ""
    echo "Instalando dependencias..."
    cd functions && npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error instalando dependencias${NC}"
        exit 1
    fi
    cd ..
    echo -e "${GREEN}✓ Dependencias instaladas${NC}"
else
    echo -e "${GREEN}✓${NC}"
fi

# Check Gemini API key
echo -n "3. Verificando Gemini API key... "
api_key=$(firebase functions:config:get 2>&1 | grep "gemini.api_key")
if [ -z "$api_key" ]; then
    echo -e "${YELLOW}⚠${NC}"
    echo ""
    echo -e "${YELLOW}WARNING: Gemini API key no configurada${NC}"
    echo ""
    read -p "¿Quieres configurarla ahora? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        read -p "Ingresa tu Gemini API key: " gemini_key
        firebase functions:config:set gemini.api_key="$gemini_key"
        echo -e "${GREEN}✓ API key configurada${NC}"
    else
        echo -e "${YELLOW}⚠ Continuando sin API key (generateArtNames no funcionará)${NC}"
    fi
else
    echo -e "${GREEN}✓${NC}"
fi
echo ""

# Build functions
echo "4. Building functions..."
cd functions
if npm run build; then
    echo -e "${GREEN}✓ Build exitoso${NC}"
else
    echo -e "${RED}✗ Build falló${NC}"
    exit 1
fi
cd ..
echo ""

# Confirm deployment
echo "==========================================="
echo -e "${BLUE}Listo para desplegar:${NC}"
echo "  - generateArtNames (Callable)"
echo "  - processBulkArtUpload (Callable)"
echo "  - onArtworkUpdate (Firestore Trigger)"
echo ""
echo -e "${YELLOW}NOTA: El deployment puede tardar 3-5 minutos${NC}"
echo ""
read -p "¿Continuar con el deployment? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelado"
    exit 0
fi

echo ""
echo "Desplegando Cloud Functions..."
echo ""

# Deploy
if firebase deploy --only functions; then
    echo ""
    echo "==========================================="
    echo -e "${GREEN}✓ Deployment completado exitosamente!${NC}"
    echo ""
    echo "Verifica tus functions en:"
    echo "  https://console.firebase.google.com/project/ivan-guaderrama-gallery/functions"
    echo ""
    echo "Next steps:"
    echo "  1. Prueba las functions (FASE_5_DEPLOY_GUIDE.md - Paso 6)"
    echo "  2. Actualiza frontend para usarlas"
    echo "  3. Remueve @google/genai del cliente"
    echo ""

    # Show URLs
    echo "Function URLs:"
    firebase functions:list 2>/dev/null | grep -E "(generateArtNames|processBulkArtUpload|onArtworkUpdate)" || echo "  (ejecuta: firebase functions:list)"
else
    echo ""
    echo -e "${RED}✗ Deployment falló${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Verifica logs: firebase functions:log"
    echo "  2. Revisa errores arriba"
    echo "  3. Consulta: FASE_5_DEPLOY_GUIDE.md"
    exit 1
fi
