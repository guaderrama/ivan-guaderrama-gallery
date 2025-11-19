#!/bin/bash

# Script para crear usuario admin en Firebase
# Uso: bash scripts/create-admin.sh

EMAIL="obrgaleria@ivanguaderrama.com"
PASSWORD="QMgep809"

echo "🔄 Creando usuario admin en Firebase Authentication..."

# Crear usuario usando Firebase CLI (requiere extensión)
# Como Firebase CLI no tiene comando directo para crear usuarios,
# vamos a usar curl con Firebase Auth REST API

PROJECT_ID="ivan-guaderrama-gallery"
API_KEY="AIzaSyDNH6Btw9Ntkhe2BZl4jPDW3RJq_U4EQFE"

echo "📡 Enviando request a Firebase Auth API..."

# Crear usuario con Firebase Auth REST API
RESPONSE=$(curl -s -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"returnSecureToken\": true
  }")

# Verificar si hay error
if echo "$RESPONSE" | grep -q "error"; then
  ERROR_MSG=$(echo "$RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)

  # Si el usuario ya existe, intentar hacer login para obtener el UID
  if echo "$ERROR_MSG" | grep -q "EMAIL_EXISTS"; then
    echo "⚠️  El usuario ya existe. Obteniendo UID..."

    LOGIN_RESPONSE=$(curl -s -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$API_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$EMAIL\",
        \"password\": \"$PASSWORD\",
        \"returnSecureToken\": true
      }")

    USER_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"localId":"[^"]*"' | cut -d'"' -f4)

    if [ -z "$USER_ID" ]; then
      echo "❌ Error: No se pudo obtener el UID del usuario"
      echo "Respuesta: $LOGIN_RESPONSE"
      exit 1
    fi
  else
    echo "❌ Error al crear usuario: $ERROR_MSG"
    echo "Respuesta completa: $RESPONSE"
    exit 1
  fi
else
  # Extraer el UID del nuevo usuario
  USER_ID=$(echo "$RESPONSE" | grep -o '"localId":"[^"]*"' | cut -d'"' -f4)
  echo "✅ Usuario creado en Authentication"
fi

echo "   UID: $USER_ID"
echo "   Email: $EMAIL"

# Ahora crear documento en Firestore con rol admin
echo ""
echo "🔄 Asignando rol admin en Firestore..."

# Usar Firebase CLI para crear documento en Firestore
# Nota: Este comando es experimental y puede requerir autenticación
cat > /tmp/admin-user.json << EOF
{
  "uid": "$USER_ID",
  "email": "$EMAIL",
  "role": "admin",
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "updatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

# Usar curl con Firestore REST API
FIRESTORE_RESPONSE=$(curl -s -X PATCH \
  "https://firestore.googleapis.com/v1/projects/$PROJECT_ID/databases/(default)/documents/users/$USER_ID?updateMask.fieldPaths=uid&updateMask.fieldPaths=email&updateMask.fieldPaths=role&updateMask.fieldPaths=createdAt&updateMask.fieldPaths=updatedAt" \
  -H "Content-Type: application/json" \
  -d "{
    \"fields\": {
      \"uid\": {\"stringValue\": \"$USER_ID\"},
      \"email\": {\"stringValue\": \"$EMAIL\"},
      \"role\": {\"stringValue\": \"admin\"},
      \"createdAt\": {\"timestampValue\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"},
      \"updatedAt\": {\"timestampValue\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}
    }
  }")

if echo "$FIRESTORE_RESPONSE" | grep -q "error"; then
  echo "❌ Error al asignar rol en Firestore"
  echo "Respuesta: $FIRESTORE_RESPONSE"
  echo ""
  echo "⚠️  Necesitas crear el documento manualmente en Firestore Console:"
  echo "   1. Ve a: https://console.firebase.google.com/project/ivan-guaderrama-gallery/firestore"
  echo "   2. Collection: users"
  echo "   3. Document ID: $USER_ID"
  echo "   4. Fields:"
  echo "      - role: admin"
  echo "      - email: $EMAIL"
  echo "      - uid: $USER_ID"
  exit 1
fi

echo "✅ Rol admin asignado en Firestore"
echo ""
echo "🎉 Usuario admin creado exitosamente!"
echo ""
echo "📝 Credenciales:"
echo "   Email: $EMAIL"
echo "   Password: $PASSWORD"
echo "   Role: admin"
echo "   UID: $USER_ID"
echo ""
echo "✅ FASE 2 COMPLETADA"
