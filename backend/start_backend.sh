#!/bin/bash

# Script para iniciar el backend con las variables de entorno cargadas

# Cargar variables de entorno del .zshrc si existe
if [ -f ~/.zshrc ]; then
    # Cargar solo las variables de entorno, evitando errores de compdef
    set -a
    source ~/.zshrc 2>/dev/null || true
    set +a
fi

# Cargar variables de entorno del .bash_profile si existe (fallback)
if [ -f ~/.bash_profile ]; then
    set -a
    source ~/.bash_profile 2>/dev/null || true
    set +a
fi

# Cargar variables de entorno explícitamente si no están cargadas
# Esto es un fallback en caso de que source no funcione correctamente
if [ -z "$UNSPLASH_API_KEY" ] && [ -f ~/.zshrc ]; then
    export UNSPLASH_API_KEY=$(grep "^export UNSPLASH_API_KEY=" ~/.zshrc | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)
fi

# Activar el entorno virtual
cd "$(dirname "$0")"
source venv/bin/activate

# Verificar que la API key esté configurada
if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  ADVERTENCIA: GEMINI_API_KEY no está configurada"
    echo "   Configúrala en ~/.zshrc o ~/.bash_profile"
    echo "   Ejemplo: export GEMINI_API_KEY=tu_api_key"
    exit 1
fi

# Iniciar el servidor
echo "🚀 Iniciando backend en http://localhost:8000"
uvicorn main:app --reload --host 0.0.0.0 --port 8000

