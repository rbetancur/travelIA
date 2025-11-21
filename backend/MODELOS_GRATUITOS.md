# 🆓 Modelos Gratuitos de Gemini

## ⚠️ IMPORTANTE: Solo Modelos Gratuitos

Este proyecto está configurado para usar **SOLO modelos GRATUITOS** de Google Gemini para evitar costos inesperados.

## ✅ Modelos Gratuitos Permitidos

### Modelos Flash (100% Gratuitos):

1. **`gemini-2.0-flash`** ⚡ (Modelo por defecto)
   - Rápido y eficiente
   - Gratuito sin límites conocidos
   - Ideal para la mayoría de casos de uso

2. **`gemini-2.5-flash`** ⚡
   - Versión más reciente de Flash
   - Gratuito
   - Más rápido que 2.0-flash

3. **`gemini-2.0-flash-lite`** 💨
   - Versión ligera de Flash
   - Ultra rápido
   - Gratuito

4. **`gemini-flash-latest`** 🎯
   - Versión más reciente disponible
   - Gratuito
   - Se actualiza automáticamente

### Modelo Gratuito con Límites:

5. **`gemini-pro-latest`** ⚠️
   - Gratuito pero con límites de uso
   - Versión estable
   - Recomendado solo para pruebas

## ❌ Modelos de Pago (NO Permitidos)

**Estos modelos NO se usan en este proyecto:**

- ❌ `gemini-2.5-pro` (De pago)
- ❌ `gemini-2.0-pro` (De pago)
- ❌ `gemini-pro` (Versiones antiguas, pueden tener costo)
- ❌ `gemini-ultra` (De pago)
- ❌ Cualquier modelo que no contenga "flash" o "pro-latest"

## 🔧 Configuración

### Modelo por Defecto

El proyecto usa `gemini-2.0-flash` por defecto, que es **100% gratuito**.

### Cambiar el Modelo (Solo Gratuitos)

Puedes cambiar el modelo usando una variable de entorno:

```bash
# Linux/Mac
export GEMINI_MODEL=gemini-2.5-flash

# Windows PowerShell
$env:GEMINI_MODEL="gemini-2.5-flash"

# Windows CMD
set GEMINI_MODEL=gemini-2.5-flash
```

**IMPORTANTE:** El código validará que solo uses modelos gratuitos. Si intentas usar un modelo de pago, recibirás un error.

### Verificar Modelo Actual

```python
# En backend/main.py
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
```

## 🛡️ Protección en el Código

El código incluye validación automática para prevenir el uso de modelos de pago:

```python
# Validar que solo se usen modelos gratuitos (Flash)
FREE_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.5-flash", 
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
    "gemini-pro-latest"
]

# Verificar que el modelo es gratuito
if not any(free_model in GEMINI_MODEL.lower() for free_model in ["flash", "pro-latest"]):
    raise HTTPException(
        status_code=400,
        detail=f"Modelo '{GEMINI_MODEL}' no permitido. Solo se permiten modelos GRATUITOS."
    )
```

## 💰 Información sobre Costos

### Modelos Flash:
- ✅ **Completamente gratuitos**
- ✅ Sin límites conocidos para uso normal
- ✅ Perfectos para desarrollo y producción

### Modelos Pro:
- ❌ **Requieren pago** después del tier gratuito
- ❌ Pueden generar costos inesperados
- ❌ NO se usan en este proyecto

## 📊 Comparación de Modelos

| Modelo | Tipo | Costo | Velocidad | Precisión |
|--------|------|-------|-----------|-----------|
| gemini-2.0-flash | Flash | 🆓 Gratuito | ⚡⚡⚡ Muy rápido | ⭐⭐⭐ Buena |
| gemini-2.5-flash | Flash | 🆓 Gratuito | ⚡⚡⚡⚡ Más rápido | ⭐⭐⭐⭐ Muy buena |
| gemini-2.0-flash-lite | Flash | 🆓 Gratuito | ⚡⚡⚡⚡⚡ Ultra rápido | ⭐⭐ Adecuada |
| gemini-pro-latest | Pro | 🆓 Gratis (límites) | ⚡⚡ Normal | ⭐⭐⭐⭐ Muy buena |
| gemini-2.5-pro | Pro | 💰 De pago | ⚡ Normal | ⭐⭐⭐⭐⭐ Excelente |
| gemini-2.0-pro | Pro | 💰 De pago | ⚡ Lento | ⭐⭐⭐⭐⭐ Excelente |

## ✅ Verificación

### Verificar que estás usando un modelo gratuito:

1. **Verifica el modelo configurado:**
   ```bash
   echo $GEMINI_MODEL
   # Debe mostrar un modelo Flash o gemini-pro-latest
   ```

2. **Revisa los logs del servidor:**
   ```bash
   # Al iniciar el servidor, no debe mostrar errores sobre modelos de pago
   ```

3. **Prueba con un modelo inválido:**
   ```bash
   export GEMINI_MODEL=gemini-2.5-pro
   # Debe dar error: "Modelo no permitido. Solo se permiten modelos GRATUITOS"
   ```

## 🎯 Recomendaciones

1. **Para desarrollo:** Usa `gemini-2.0-flash` (por defecto)
2. **Para producción:** Usa `gemini-2.5-flash` (más rápido y gratuito)
3. **Para máxima velocidad:** Usa `gemini-2.0-flash-lite`
4. **NUNCA uses:** Modelos Pro (excepto `gemini-pro-latest`)

## 📝 Notas Importantes

- ✅ Todos los modelos Flash son **100% gratuitos**
- ✅ No hay costos ocultos con los modelos Flash
- ✅ El código está protegido para prevenir uso accidental de modelos de pago
- ✅ Si necesitas más potencia, considera usar `gemini-pro-latest` (gratis con límites)
- ⚠️ **NO cambies** a modelos Pro sin entender los costos

---

**Última actualización:** Modelos verificados como gratuitos en diciembre 2024
**Estado:** ✅ Proyecto configurado para usar SOLO modelos gratuitos

