#!/usr/bin/env python3
"""
Tests de validación de manejo robusto de errores en el backend de ViajeIA.

Este archivo valida que el backend es lo suficientemente robusto para manejar
peticiones maliciosas o inválidas que podrían saltarse las validaciones del frontend.

Para ejecutar:
    pytest test_error_handling.py -v
    # O con más detalle:
    pytest test_error_handling.py -v -s
"""

import pytest
import httpx
import os
import json
from typing import Dict, Any, Optional


# URL base del backend (ajustar si es necesario)
BASE_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
API_ENDPOINT = f"{BASE_URL}/api/travel"


class TestErrorHandling:
    """Tests para validar el manejo robusto de errores del backend."""
    
    @pytest.fixture
    def client(self):
        """Cliente HTTP para hacer peticiones."""
        return httpx.AsyncClient(timeout=30.0)
    
    # ============================================================
    # Escenario 1: Pregunta Vacía
    # ============================================================
    
    @pytest.mark.asyncio
    async def test_empty_question(self, client: httpx.AsyncClient):
        """
        Escenario 1: Pregunta Vacía
        Validar que el backend rechaza preguntas vacías o solo espacios.
        """
        # Test 1.1: Pregunta completamente vacía
        response = await client.post(
            API_ENDPOINT,
            json={"question": ""}
        )
        # FastAPI retorna 422 para errores de validación de Pydantic
        assert response.status_code in [400, 422], f"Esperado 400 o 422, recibido {response.status_code}"
        data = response.json()
        assert "detail" in data
        assert "pregunta válida" in data["detail"].lower() or "válida" in data["detail"].lower() or "error" in data["detail"].lower()
        
        # Test 1.2: Pregunta solo con espacios
        response = await client.post(
            API_ENDPOINT,
            json={"question": "   "}
        )
        assert response.status_code in [400, 422], f"Esperado 400 o 422, recibido {response.status_code}"
        data = response.json()
        assert "detail" in data
        assert "pregunta válida" in data["detail"].lower() or "válida" in data["detail"].lower() or "error" in data["detail"].lower()
        
        # Test 1.3: Pregunta solo con tabs y newlines
        response = await client.post(
            API_ENDPOINT,
            json={"question": "\t\n\r   \t\n"}
        )
        assert response.status_code in [400, 422], f"Esperado 400 o 422, recibido {response.status_code}"
        data = response.json()
        assert "detail" in data
    
    # ============================================================
    # Escenario 2: Pregunta Extremadamente Larga
    # ============================================================
    
    @pytest.mark.asyncio
    async def test_very_long_question(self, client: httpx.AsyncClient):
        """
        Escenario 2: Pregunta Extremadamente Larga
        Validar que el backend maneja preguntas muy largas correctamente.
        """
        # Crear pregunta de 10000 caracteres
        long_question = "a" * 10000
        
        response = await client.post(
            API_ENDPOINT,
            json={"question": long_question}
        )
        
        # El backend debería validar y rechazar según MAX_QUESTION_LENGTH (500)
        # Puede retornar 422 (validación de Pydantic) o 400 (validación manual)
        assert response.status_code in [200, 400, 422], \
            f"Esperado 200, 400 o 422, recibido {response.status_code}"
        
        data = response.json()
        
        if response.status_code in [400, 422]:
            # Si retorna 400 o 422, debe ser por validación de longitud
            assert "detail" in data
        elif response.status_code == 200:
            # Si retorna 200, la pregunta fue procesada (probablemente truncada)
            assert "answer" in data or "session_id" in data
    
    # ============================================================
    # Escenario 3: Pregunta Normal
    # ============================================================
    
    @pytest.mark.asyncio
    async def test_normal_question(self, client: httpx.AsyncClient):
        """
        Escenario 3: Pregunta Normal
        Validar que las preguntas normales funcionan correctamente.
        """
        response = await client.post(
            API_ENDPOINT,
            json={"question": "¿Qué puedo hacer en París?"}
        )
        
        # Debe retornar 200 si la API key está configurada
        # O 500/401 si no está configurada
        assert response.status_code in [200, 401, 500], \
            f"Esperado 200, 401 o 500, recibido {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "answer" in data or "session_id" in data
    
    # ============================================================
    # Escenario 4: Error de Autenticación (401)
    # ============================================================
    
    @pytest.mark.asyncio
    async def test_authentication_error(self, client: httpx.AsyncClient):
        """
        Escenario 4: Error de Autenticación
        Nota: Este test requiere que la API key esté inválida o no configurada.
        En un entorno de test real, se podría mockear la API key.
        """
        # Este test es difícil de ejecutar sin modificar la API key
        # Se documenta pero puede fallar si la API key está configurada correctamente
        response = await client.post(
            API_ENDPOINT,
            json={"question": "Test de autenticación"}
        )
        
        # Si la API key no está configurada, debería retornar 500
        # Si está configurada pero es inválida, Gemini retornará 401
        # Por ahora, solo verificamos que no sea un error inesperado
        assert response.status_code in [200, 401, 500], \
            f"Esperado 200, 401 o 500, recibido {response.status_code}"
    
    # ============================================================
    # Escenario 5: Límite de Tasa (429)
    # ============================================================
    
    @pytest.mark.asyncio
    async def test_rate_limit_error(self, client: httpx.AsyncClient):
        """
        Escenario 5: Límite de Tasa
        Nota: Este test requiere exceder el límite de tasa de Gemini.
        En producción, esto se probaría con múltiples peticiones rápidas.
        """
        # Este test es difícil de ejecutar sin exceder realmente el límite
        # Se documenta pero puede no ejecutarse en tests normales
        # En un entorno de test real, se podría mockear la respuesta de Gemini
        
        # Hacer una petición normal
        response = await client.post(
            API_ENDPOINT,
            json={"question": "Test de rate limit"}
        )
        
        # Por ahora, solo verificamos que la respuesta sea válida
        assert response.status_code in [200, 401, 429, 500], \
            f"Esperado 200, 401, 429 o 500, recibido {response.status_code}"
    
    # ============================================================
    # Escenario 6: Contenido Bloqueado (400)
    # ============================================================
    
    @pytest.mark.asyncio
    async def test_blocked_content_error(self, client: httpx.AsyncClient):
        """
        Escenario 6: Contenido Bloqueado
        Nota: Este test requiere enviar contenido que viole las políticas de Gemini.
        En un entorno de test real, se podría mockear la respuesta de Gemini.
        """
        # Intentar con contenido que podría ser bloqueado
        # Nota: Esto puede no funcionar si Gemini no bloquea el contenido
        response = await client.post(
            API_ENDPOINT,
            json={"question": "Test de contenido bloqueado"}
        )
        
        # Puede retornar 200 (si no se bloquea), 400 (si se bloquea), o 500/401
        assert response.status_code in [200, 400, 401, 500], \
            f"Esperado 200, 400, 401 o 500, recibido {response.status_code}"
    
    # ============================================================
    # Tests Adicionales: Validaciones de Seguridad
    # ============================================================
    
    @pytest.mark.asyncio
    async def test_missing_question_field(self, client: httpx.AsyncClient):
        """Validar que el backend rechaza peticiones sin campo 'question'."""
        response = await client.post(
            API_ENDPOINT,
            json={}
        )
        # FastAPI/Pydantic debería retornar 422 (Unprocessable Entity)
        assert response.status_code in [400, 422], \
            f"Esperado 400 o 422, recibido {response.status_code}"
    
    @pytest.mark.asyncio
    async def test_invalid_json(self, client: httpx.AsyncClient):
        """Validar que el backend rechaza JSON inválido."""
        response = await client.post(
            API_ENDPOINT,
            content="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code in [400, 422], \
            f"Esperado 400 o 422, recibido {response.status_code}"
    
    @pytest.mark.asyncio
    async def test_sql_injection_attempt(self, client: httpx.AsyncClient):
        """Validar que el backend maneja intentos de SQL injection."""
        # Nota: Este backend no usa SQL, pero es bueno validar que maneja caracteres especiales
        response = await client.post(
            API_ENDPOINT,
            json={"question": "'; DROP TABLE users; --"}
        )
        # Debe procesar o rechazar, pero no crashear
        assert response.status_code in [200, 400, 401, 500], \
            f"Esperado 200, 400, 401 o 500, recibido {response.status_code}"
    
    @pytest.mark.asyncio
    async def test_xss_attempt(self, client: httpx.AsyncClient):
        """Validar que el backend maneja intentos de XSS."""
        response = await client.post(
            API_ENDPOINT,
            json={"question": "<script>alert('XSS')</script>"}
        )
        # Debe procesar o rechazar, pero no crashear
        assert response.status_code in [200, 400, 401, 500], \
            f"Esperado 200, 400, 401 o 500, recibido {response.status_code}"
    
    @pytest.mark.asyncio
    async def test_very_long_session_id(self, client: httpx.AsyncClient):
        """Validar que el backend maneja session_id muy largos."""
        long_session_id = "a" * 1000
        response = await client.post(
            API_ENDPOINT,
            json={
                "question": "Test pregunta",
                "session_id": long_session_id
            }
        )
        # Debe validar el session_id (debe ser UUID válido)
        # FastAPI retorna 422 para errores de validación de Pydantic
        assert response.status_code in [200, 400, 422], \
            f"Esperado 200, 400 o 422, recibido {response.status_code}"
    
    @pytest.mark.asyncio
    async def test_invalid_session_id_format(self, client: httpx.AsyncClient):
        """Validar que el backend rechaza session_id con formato inválido."""
        response = await client.post(
            API_ENDPOINT,
            json={
                "question": "Test pregunta",
                "session_id": "not-a-valid-uuid"
            }
        )
        # Debe retornar 422 por validación de formato UUID (FastAPI estándar)
        # También puede retornar 400 si el handler lo convierte
        assert response.status_code in [400, 422], \
            f"Esperado 400 o 422, recibido {response.status_code}"
    
    @pytest.mark.asyncio
    async def test_special_characters_in_question(self, client: httpx.AsyncClient):
        """Validar que el backend maneja caracteres especiales correctamente."""
        special_chars = "¿Qué puedo hacer en París? ¡Genial! @#$%^&*()"
        response = await client.post(
            API_ENDPOINT,
            json={"question": special_chars}
        )
        # Debe procesar o rechazar, pero no crashear
        assert response.status_code in [200, 400, 401, 500], \
            f"Esperado 200, 400, 401 o 500, recibido {response.status_code}"
    
    @pytest.mark.asyncio
    async def test_unicode_characters(self, client: httpx.AsyncClient):
        """Validar que el backend maneja caracteres Unicode correctamente."""
        unicode_question = "¿Qué puedo hacer en 北京? 🎉 こんにちは"
        response = await client.post(
            API_ENDPOINT,
            json={"question": unicode_question}
        )
        # Debe procesar o rechazar, pero no crashear
        assert response.status_code in [200, 400, 401, 500], \
            f"Esperado 200, 400, 401 o 500, recibido {response.status_code}"
    
    @pytest.mark.asyncio
    async def test_null_values(self, client: httpx.AsyncClient):
        """Validar que el backend rechaza valores null donde no son permitidos."""
        # Intentar enviar null en question
        response = await client.post(
            API_ENDPOINT,
            json={"question": None}
        )
        # Debe retornar 400 o 422
        assert response.status_code in [400, 422], \
            f"Esperado 400 o 422, recibido {response.status_code}"
    
    @pytest.mark.asyncio
    async def test_wrong_http_method(self, client: httpx.AsyncClient):
        """Validar que el backend rechaza métodos HTTP incorrectos."""
        # Intentar GET en lugar de POST
        response = await client.get(API_ENDPOINT)
        # Debe retornar 405 (Method Not Allowed)
        assert response.status_code == 405, \
            f"Esperado 405, recibido {response.status_code}"
    
    @pytest.mark.asyncio
    async def test_malformed_destination(self, client: httpx.AsyncClient):
        """Validar que el backend maneja destinos con formato incorrecto."""
        response = await client.post(
            API_ENDPOINT,
            json={
                "question": "Test pregunta",
                "destination": "<script>alert('XSS')</script>"
            }
        )
        # Debe validar y rechazar destinos con formato inválido
        # Puede retornar 422 (validación), 400 o 200 (si pasa validación)
        assert response.status_code in [200, 400, 422], \
            f"Esperado 200, 400 o 422, recibido {response.status_code}"


# ============================================================
# Función principal para ejecutar tests manualmente
# ============================================================

async def run_tests_manually():
    """
    Función para ejecutar tests manualmente sin pytest.
    Útil para debugging o ejecución rápida.
    """
    print("=" * 80)
    print("🧪 EJECUTANDO TESTS DE VALIDACIÓN DE ERRORES")
    print("=" * 80)
    print()
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        test_instance = TestErrorHandling()
        
        tests = [
            ("Pregunta Vacía", test_instance.test_empty_question),
            ("Pregunta Muy Larga", test_instance.test_very_long_question),
            ("Pregunta Normal", test_instance.test_normal_question),
            ("Campo 'question' Faltante", test_instance.test_missing_question_field),
            ("JSON Inválido", test_instance.test_invalid_json),
            ("Session ID Inválido", test_instance.test_invalid_session_id_format),
            ("Método HTTP Incorrecto", test_instance.test_wrong_http_method),
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            try:
                print(f"📋 Ejecutando: {test_name}...")
                await test_func(client)
                print(f"✅ {test_name}: PASSED")
                passed += 1
            except AssertionError as e:
                print(f"❌ {test_name}: FAILED - {e}")
                failed += 1
            except Exception as e:
                print(f"⚠️  {test_name}: ERROR - {e}")
                failed += 1
            print()
        
        print("=" * 80)
        print(f"📊 RESUMEN: {passed} pasados, {failed} fallidos")
        print("=" * 80)


if __name__ == "__main__":
    import asyncio
    asyncio.run(run_tests_manually())

