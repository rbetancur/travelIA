#!/bin/bash
# Script rápido para verificar si la API key de OpenWeatherMap está funcionando

echo "🔍 Verificando API key de OpenWeatherMap..."
echo ""

cd "$(dirname "$0")"
source venv/bin/activate 2>/dev/null || {
    echo "⚠️  No se pudo activar el entorno virtual"
    echo "   Ejecuta: cd backend && source venv/bin/activate"
    exit 1
}

python3 test_openweather.py

