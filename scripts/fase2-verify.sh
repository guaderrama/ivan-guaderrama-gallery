#!/bin/bash

# FASE 2 Verification Script
# Verifica que todos los pasos de FASE 2 estén completos

echo "🔍 FASE 2 - Verificación de Setup Firebase"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

passed=0
failed=0

# Check 1: Firebase CLI installed
echo -n "1. Firebase CLI instalado... "
if command -v firebase &> /dev/null; then
    version=$(firebase --version)
    echo -e "${GREEN}✓${NC} (v$version)"
    ((passed++))
else
    echo -e "${RED}✗${NC} No encontrado"
    ((failed++))
fi

# Check 2: Firebase CLI authenticated
echo -n "2. Firebase CLI autenticado... "
if firebase projects:list &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
    ((passed++))
else
    echo -e "${RED}✗${NC} No autenticado"
    echo "   Ejecuta: firebase login --no-localhost"
    ((failed++))
fi

# Check 3: Project configured
echo -n "3. Proyecto configurado (.firebaserc)... "
if [ -f ".firebaserc" ]; then
    project_id=$(cat .firebaserc | grep "ivan-guaderrama-gallery")
    if [ -n "$project_id" ]; then
        echo -e "${GREEN}✓${NC}"
        ((passed++))
    else
        echo -e "${RED}✗${NC} Project ID incorrecto"
        ((failed++))
    fi
else
    echo -e "${RED}✗${NC} No existe"
    ((failed++))
fi

# Check 4: Environment variables
echo -n "4. Variables de entorno (.env.local)... "
if [ -f ".env.local" ]; then
    if grep -q "VITE_FIREBASE_API_KEY" .env.local && \
       grep -q "VITE_FIREBASE_PROJECT_ID=ivan-guaderrama-gallery" .env.local; then
        echo -e "${GREEN}✓${NC}"
        ((passed++))
    else
        echo -e "${YELLOW}⚠${NC} Incompleto"
        ((failed++))
    fi
else
    echo -e "${RED}✗${NC} No existe"
    ((failed++))
fi

# Check 5: Firestore rules file
echo -n "5. Reglas Firestore (firestore.rules)... "
if [ -f "firestore.rules" ]; then
    echo -e "${GREEN}✓${NC}"
    ((passed++))
else
    echo -e "${RED}✗${NC} No existe"
    ((failed++))
fi

# Check 6: Storage rules file
echo -n "6. Reglas Storage (storage.rules)... "
if [ -f "storage.rules" ]; then
    echo -e "${GREEN}✓${NC}"
    ((passed++))
else
    echo -e "${RED}✗${NC} No existe"
    ((failed++))
fi

# Check 7: Firestore indexes
echo -n "7. Índices Firestore (firestore.indexes.json)... "
if [ -f "firestore.indexes.json" ]; then
    echo -e "${GREEN}✓${NC}"
    ((passed++))
else
    echo -e "${RED}✗${NC} No existe"
    ((failed++))
fi

# Check 8: Firebase config file
echo -n "8. Configuración Firebase (firebase.json)... "
if [ -f "firebase.json" ]; then
    echo -e "${GREEN}✓${NC}"
    ((passed++))
else
    echo -e "${RED}✗${NC} No existe"
    ((failed++))
fi

echo ""
echo "=========================================="
echo -e "Resultados: ${GREEN}${passed} passed${NC} | ${RED}${failed} failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✓ Todo listo para desplegar!${NC}"
    echo ""
    echo "Siguiente paso:"
    echo "  firebase deploy --only firestore:rules,storage:rules,firestore:indexes"
    exit 0
else
    echo -e "${RED}✗ Hay $failed problemas que resolver${NC}"
    echo ""
    echo "Revisa: FASE_2_SETUP_INTERACTIVO.md"
    exit 1
fi
