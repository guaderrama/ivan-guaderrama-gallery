#!/bin/bash

GH="/nix/store/kaj0mckcnigf7zixf4np6cjb45h57wy0-gh-2.39.2/bin/gh"

echo "🔐 Configuración de GitHub CLI"
echo "================================"
echo ""
echo "Para autenticarte, necesitas crear un Personal Access Token:"
echo ""
echo "1. Ve a: https://github.com/settings/tokens/new"
echo "2. Dale un nombre: 'Ivan Guaderrama Gallery - CLI'"
echo "3. Selecciona scopes:"
echo "   - repo (todos)"
echo "   - workflow"
echo "4. Copia el token generado"
echo ""
echo "Luego ejecuta:"
echo "echo 'TU_TOKEN_AQUI' | $GH auth login --with-token"
echo ""
echo "O usa el método interactivo:"
echo "$GH auth login"

