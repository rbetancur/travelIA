#!/usr/bin/env python3
"""
Script para validar la API key de OpenWeatherMap.
"""
import os
import sys
import requests
from typing import Optional


def validate_openweather_api_key(api_key: Optional[str] = None) -> tuple[bool, str]:
    """
    Valida la API key de OpenWeatherMap haciendo una solicitud de prueba.
    
    Args:
        api_key: API key a validar. Si no se proporciona, se busca en variables de entorno.
        
    Returns:
        Tupla (es_válida, mensaje)
    """
    if not api_key:
        api_key = os.getenv("OPENWEATHER_API_KEY")
    
    if not api_key:
        return (False, "❌ API key no configurada. Configura la variable OPENWEATHER_API_KEY")
    
    api_key = api_key.strip()
    if not api_key:
        return (False, "❌ API key está vacía")
    
    if len(api_key) < 20:
        return (False, f"❌ API key parece ser muy corta ({len(api_key)} caracteres). Debería tener 32 caracteres")
    
    print(f"🔍 Validando API key: {api_key[:10]}...{api_key[-4:]}")
    print(f"   Longitud: {len(api_key)} caracteres")
    
    # Hacer solicitud de prueba
    base_url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": "London",
        "appid": api_key,
        "units": "metric"
    }
    
    try:
        print(f"\n🌐 Haciendo solicitud de prueba a OpenWeatherMap...")
        response = requests.get(base_url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            city = data.get("name", "Unknown")
            temp = data.get("main", {}).get("temp", 0)
            print(f"\n✅ API key VÁLIDA y FUNCIONANDO")
            print(f"   Ciudad de prueba: {city}")
            print(f"   Temperatura: {temp}°C")
            return (True, "✅ API key válida y funcionando correctamente")
        
        elif response.status_code == 401:
            try:
                error_data = response.json()
                message = error_data.get("message", "Invalid API key")
            except:
                message = "Invalid API key"
            
            print(f"\n❌ ERROR 401: API key no válida")
            print(f"   Mensaje: {message}")
            print(f"\n📋 Pasos para solucionar:")
            print(f"   1. Ve a https://openweathermap.org/api")
            print(f"   2. Regístrate o inicia sesión")
            print(f"   3. Confirma tu email (revisa tu correo)")
            print(f"   4. Ve a https://home.openweathermap.org/api_keys")
            print(f"   5. Copia tu API key (debería tener 32 caracteres)")
            print(f"   6. Configúrala: export OPENWEATHER_API_KEY=tu_api_key")
            print(f"   7. Espera hasta 2 horas si acabas de confirmar el email")
            return (False, f"❌ API key no válida: {message}")
        
        elif response.status_code == 429:
            return (False, "⚠️ Límite de solicitudes excedido. Espera un momento")
        
        else:
            return (False, f"❌ Error HTTP {response.status_code}: {response.text}")
    
    except requests.exceptions.RequestException as e:
        return (False, f"❌ Error de conexión: {str(e)}")
    except Exception as e:
        return (False, f"❌ Error inesperado: {str(e)}")


if __name__ == "__main__":
    print("=" * 60)
    print("🔑 Validador de API Key de OpenWeatherMap")
    print("=" * 60)
    print()
    
    # Intentar obtener API key de argumentos o variable de entorno
    api_key = None
    if len(sys.argv) > 1:
        api_key = sys.argv[1]
        print(f"📝 Usando API key proporcionada como argumento")
    else:
        api_key = os.getenv("OPENWEATHER_API_KEY")
        if api_key:
            print(f"📝 Usando API key de variable de entorno OPENWEATHER_API_KEY")
        else:
            print(f"⚠️  No se encontró API key en argumentos ni en variables de entorno")
            print(f"   Uso: python test_openweather.py [API_KEY]")
            print(f"   O configura: export OPENWEATHER_API_KEY=tu_api_key")
            sys.exit(1)
    
    print()
    is_valid, message = validate_openweather_api_key(api_key)
    
    print()
    print("=" * 60)
    print(message)
    print("=" * 60)
    
    sys.exit(0 if is_valid else 1)

