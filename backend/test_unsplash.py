#!/usr/bin/env python3
"""
Script para probar la API key de Unsplash.
Valida que la API key esté configurada y funcionando correctamente.
"""
import os
import sys
from unsplash import UnsplashService

def test_unsplash_api_key():
    """
    Prueba la API key de Unsplash.
    """
    print("=" * 60)
    print("🔍 Validando API Key de Unsplash")
    print("=" * 60)
    print()
    
    # Verificar si la API key está configurada
    api_key = os.getenv("UNSPLASH_API_KEY")
    
    if not api_key:
        print("❌ ERROR: UNSPLASH_API_KEY no está configurada")
        print()
        print("Para configurarla:")
        print("  Linux/Mac: export UNSPLASH_API_KEY=tu_api_key")
        print("  Windows (PowerShell): $env:UNSPLASH_API_KEY=\"tu_api_key\"")
        print("  Windows (CMD): set UNSPLASH_API_KEY=tu_api_key")
        print()
        print("Ver SECRETS.md para más detalles")
        return False
    
    # Mostrar API key enmascarada
    masked_key = f"{api_key[:10]}...{api_key[-4:]}" if len(api_key) > 14 else "***"
    print(f"✅ API Key encontrada: {masked_key}")
    print()
    
    # Crear servicio y validar
    service = UnsplashService()
    
    print("🔍 Validando API key con Unsplash...")
    is_valid, error_msg = service.validate_api_key()
    
    if is_valid:
        print("✅ API key de Unsplash válida y funcionando")
        print()
        
        # Probar obtener fotos de un destino de prueba
        print("📸 Probando obtención de fotos...")
        print("   Buscando fotos de: 'Barcelona, España'")
        photos = service.get_photos("Barcelona, España", count=3)
        
        if photos and len(photos) > 0:
            print(f"✅ ¡Éxito! Se obtuvieron {len(photos)} fotos")
            print()
            print("📋 Información de las fotos obtenidas:")
            for i, photo in enumerate(photos, 1):
                print(f"   {i}. ID: {photo.get('id', 'N/A')}")
                print(f"      Fotógrafo: {photo.get('photographer', 'N/A')}")
                print(f"      URL: {photo.get('url', 'N/A')[:60]}...")
                print()
            return True
        else:
            print("⚠️  No se pudieron obtener fotos (pero la API key es válida)")
            print("   Esto puede deberse a límites de la API o problemas de conexión")
            return True  # La API key es válida aunque no haya fotos
    else:
        print(f"❌ API key de Unsplash no válida: {error_msg}")
        print()
        print("Posibles soluciones:")
        print("  1. Verifica que copiaste la API key completa")
        print("  2. Asegúrate de que no haya espacios al inicio o final")
        print("  3. Verifica que la aplicación esté activa en Unsplash")
        print("  4. Revisa los límites de tu cuenta en https://unsplash.com/oauth/applications")
        print()
        return False

if __name__ == "__main__":
    success = test_unsplash_api_key()
    print("=" * 60)
    if success:
        print("✅ Validación completada exitosamente")
        sys.exit(0)
    else:
        print("❌ Validación falló")
        sys.exit(1)

