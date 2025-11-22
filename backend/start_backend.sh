#!/bin/bash

# Script para iniciar el backend con las variables de entorno cargadas

# Cargar variables de entorno del .zshrc si existe
if [ -f ~/.zshrc ]; then
    source ~/.zshrc
fi

# Cargar variables de entorno del .bash_profile si existe (fallback)
if [ -f ~/.bash_profile ]; then
    source ~/.bash_profile
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

