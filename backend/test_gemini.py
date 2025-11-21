#!/usr/bin/env python3
"""
Script simple para probar la conexión con Gemini
"""
import os
import google.generativeai as genai

# Obtener API key de variable de entorno
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

print("=" * 60)
print("🧪 PRUEBA DE CONEXIÓN CON GEMINI")
print("=" * 60)
print()

if not GEMINI_API_KEY:
    print("❌ ERROR: GEMINI_API_KEY no está configurada")
    print("   Configura la variable de entorno:")
    print("   export GEMINI_API_KEY=tu_api_key")
    exit(1)

print(f"✅ API Key encontrada: {GEMINI_API_KEY[:10]}...{GEMINI_API_KEY[-4:]}")
print()

try:
    # Configurar Gemini
    genai.configure(api_key=GEMINI_API_KEY)
    print("✅ Gemini configurado correctamente")
    print()

    # Inicializar modelo
    model = genai.GenerativeModel('gemini-2.0-flash')
    print("✅ Modelo inicializado: gemini-2.0-flash")
    print()

    # Probar con una pregunta simple
    print("🧪 Probando con pregunta simple...")
    prompt = "Di solo 'Hola, funciono correctamente' en una línea"
    response = model.generate_content(prompt)
    
    print(f"✅ Respuesta recibida: {response.text.strip()}")
    print()
    print("=" * 60)
    print("✅ PRUEBA EXITOSA - Gemini está funcionando correctamente")
    print("=" * 60)
    
except Exception as e:
    print(f"❌ ERROR al probar Gemini: {e}")
    print(f"   Tipo de error: {type(e).__name__}")
    import traceback
    traceback.print_exc()
    exit(1)

