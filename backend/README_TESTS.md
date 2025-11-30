# Tests de Validación de Manejo de Errores

Este documento explica cómo ejecutar los tests de validación del manejo robusto de errores del backend.

## 📋 Prerequisitos

1. El backend debe estar corriendo en `http://localhost:8000` (o configurar `BACKEND_URL`)
2. Instalar dependencias de testing:
   ```bash
   cd backend
   source venv/bin/activate
   pip install -r requirements.txt
   ```

## 🚀 Ejecutar Tests

### Opción 1: Usando pytest (Recomendado)

```bash
cd backend
source venv/bin/activate
pytest test_error_handling.py -v
```

Para ver más detalles:
```bash
pytest test_error_handling.py -v -s
```

Para ejecutar un test específico:
```bash
pytest test_error_handling.py::TestErrorHandling::test_empty_question -v
```

### Opción 2: Ejecución Manual

```bash
cd backend
source venv/bin/activate
python test_error_handling.py
```

## 📝 Tests Incluidos

### Escenarios Documentados

1. **test_empty_question**: Valida que preguntas vacías o solo espacios son rechazadas (400)
2. **test_very_long_question**: Valida que preguntas muy largas son manejadas correctamente
3. **test_normal_question**: Valida que preguntas normales funcionan (200)
4. **test_authentication_error**: Valida manejo de errores de autenticación (401)
5. **test_rate_limit_error**: Valida manejo de límites de tasa (429)
6. **test_blocked_content_error**: Valida manejo de contenido bloqueado (400)

### Tests Adicionales de Seguridad

7. **test_missing_question_field**: Valida rechazo de peticiones sin campo 'question'
8. **test_invalid_json**: Valida rechazo de JSON inválido
9. **test_sql_injection_attempt**: Valida manejo de intentos de SQL injection
10. **test_xss_attempt**: Valida manejo de intentos de XSS
11. **test_very_long_session_id**: Valida manejo de session_id muy largos
12. **test_invalid_session_id_format**: Valida rechazo de session_id con formato inválido
13. **test_special_characters_in_question**: Valida manejo de caracteres especiales
14. **test_unicode_characters**: Valida manejo de caracteres Unicode
15. **test_null_values**: Valida rechazo de valores null
16. **test_wrong_http_method**: Valida rechazo de métodos HTTP incorrectos (405)
17. **test_malformed_destination**: Valida manejo de destinos con formato incorrecto

## ✅ Resultados Esperados

### Tests que DEBEN pasar siempre:

- ✅ `test_empty_question`: Debe retornar 400
- ✅ `test_missing_question_field`: Debe retornar 400 o 422
- ✅ `test_invalid_json`: Debe retornar 400 o 422
- ✅ `test_invalid_session_id_format`: Debe retornar 400 o 422
- ✅ `test_wrong_http_method`: Debe retornar 405
- ✅ `test_null_values`: Debe retornar 400 o 422

### Tests que pueden variar según configuración:

- ⚠️ `test_normal_question`: Retorna 200 si API key está configurada, 500/401 si no
- ⚠️ `test_authentication_error`: Solo funciona si API key está inválida
- ⚠️ `test_rate_limit_error`: Solo funciona si se excede el límite de tasa
- ⚠️ `test_blocked_content_error`: Solo funciona si Gemini bloquea el contenido

## 🔍 Verificar Logs

Después de ejecutar los tests, verifica los logs:

```bash
tail -f backend/logs/app.log
```

Deberías ver entradas como:
- `WARNING - Validación fallida: pregunta vacía o solo espacios. IP: ...`
- `INFO - Nueva petición recibida. IP: ..., Session ID: ...`

## 📊 Interpretación de Resultados

### ✅ Test PASSED
El backend maneja correctamente el escenario de error.

### ❌ Test FAILED
El backend no maneja correctamente el escenario. Revisa:
1. El código de estado HTTP
2. El mensaje de error
3. Los logs en `backend/logs/app.log`

### ⚠️ Test ERROR
Ocurrió una excepción inesperada. Revisa:
1. Que el backend esté corriendo
2. Que la URL sea correcta
3. Los logs del backend

## 🎯 Objetivo

Estos tests validan que el backend es **robusto** y puede manejar peticiones maliciosas o inválidas que podrían saltarse las validaciones del frontend. El backend debe:

1. ✅ Validar todas las entradas
2. ✅ Rechazar peticiones inválidas con códigos HTTP apropiados
3. ✅ Registrar todos los errores en los logs
4. ✅ No crashear ante peticiones malformadas
5. ✅ Proporcionar mensajes de error claros y seguros

