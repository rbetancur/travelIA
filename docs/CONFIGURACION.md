# ⚙️ Configuración del Sistema - ViajeIA

Documentación completa de variables de entorno, constantes del sistema y configuración del modelo de IA.

## 📋 Tabla de Contenidos

- [Variables de Entorno](#variables-de-entorno)
- [Constantes del Sistema](#constantes-del-sistema)
- [Configuración del Modelo de IA](#configuración-del-modelo-de-ia)
- [Estructura de Prompts Optimizados](#estructura-de-prompts-optimizados)
- [Optimización de Tokens](#optimización-de-tokens)
- [Configuración de Servicios Externos](#configuración-de-servicios-externos)

---

## Variables de Entorno

### ⚠️ Importante: No se usa archivo `.env`

**Este proyecto NO utiliza archivos `.env`** por razones de seguridad. Todas las configuraciones se realizan mediante **variables de entorno del sistema operativo**.

### Variables Requeridas

#### GEMINI_API_KEY (Obligatoria)

API key de Google Gemini para el procesamiento de IA.

- **Tipo**: String
- **Requerida**: ✅ Sí
- **Ubicación**: Variable de entorno del sistema
- **Formato**: String alfanumérico (ej: `AIzaSy...`)
- **Obtención**: [Google AI Studio](https://makersuite.google.com/app/apikey)

**Configuración:**

```bash
# Linux/Mac
export GEMINI_API_KEY=tu_api_key_aqui

# Windows (PowerShell)
$env:GEMINI_API_KEY="tu_api_key_aqui"

# Windows (CMD)
set GEMINI_API_KEY=tu_api_key_aqui
```

**Verificación:**

```bash
# Linux/Mac
echo $GEMINI_API_KEY

# Windows (PowerShell)
$env:GEMINI_API_KEY

# Windows (CMD)
echo %GEMINI_API_KEY%
```

**Uso en el código:**

```python
# backend/main.py
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("⚠️  ADVERTENCIA: GEMINI_API_KEY no encontrada")
else:
    genai.configure(api_key=GEMINI_API_KEY)
```

### Variables Opcionales

#### GEMINI_MODEL

Modelo de Gemini a utilizar. Por defecto usa `gemini-2.0-flash` (gratuito).

- **Tipo**: String
- **Requerida**: ❌ No
- **Valor por defecto**: `"gemini-2.0-flash"`
- **Valores permitidos**:
  - `gemini-2.0-flash` (recomendado, gratuito)
  - `gemini-2.5-flash` (gratuito)
  - `gemini-2.0-flash-lite` (gratuito)
  - `gemini-flash-latest` (gratuito)
  - `gemini-pro-latest` (gratuito con límites)

**Configuración:**

```bash
# Linux/Mac
export GEMINI_MODEL=gemini-2.0-flash

# Windows (PowerShell)
$env:GEMINI_MODEL="gemini-2.0-flash"
```

**Uso en el código:**

```python
# backend/main.py
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
model = genai.GenerativeModel(GEMINI_MODEL)
```

**Validación:**

El sistema valida que solo se usen modelos gratuitos (Flash). Si se intenta usar un modelo Pro de pago, se lanza un error 400.

#### OPENWEATHER_API_KEY (Opcional)

API key de OpenWeatherMap para información del clima.

- **Tipo**: String
- **Requerida**: ❌ No (opcional, pero recomendada)
- **Obtención**: [OpenWeatherMap API](https://openweathermap.org/api)
- **Plan gratuito**: 60 llamadas/minuto, 1M llamadas/mes

**Configuración:**

```bash
# Linux/Mac
export OPENWEATHER_API_KEY=tu_api_key_aqui

# Windows (PowerShell)
$env:OPENWEATHER_API_KEY="tu_api_key_aqui"
```

**Uso en el código:**

```python
# backend/weather.py
self.api_key = api_key or os.getenv("OPENWEATHER_API_KEY")
```

#### UNSPLASH_API_KEY (Opcional)

API key de Unsplash para fotos de destinos.

- **Tipo**: String
- **Requerida**: ❌ No (opcional, pero recomendada)
- **Obtención**: [Unsplash Developers](https://unsplash.com/developers)
- **Plan gratuito**: 50 solicitudes/hora

**Configuración:**

```bash
# Linux/Mac
export UNSPLASH_API_KEY=tu_api_key_aqui

# Windows (PowerShell)
$env:UNSPLASH_API_KEY="tu_api_key_aqui"
```

**Uso en el código:**

```python
# backend/unsplash.py
self.api_key = api_key or os.getenv("UNSPLASH_API_KEY")
```

#### ALLOWED_ORIGINS

Orígenes permitidos para CORS. Por defecto permite `http://localhost:3000`.

- **Tipo**: String (separado por comas)
- **Requerida**: ❌ No
- **Valor por defecto**: `"http://localhost:3000"`
- **Formato**: `"http://localhost:3000,https://example.com"`

**Configuración:**

```bash
# Linux/Mac
export ALLOWED_ORIGINS="http://localhost:3000,https://viajeia.com"

# Windows (PowerShell)
$env:ALLOWED_ORIGINS="http://localhost:3000,https://viajeia.com"
```

**Uso en el código:**

```python
# backend/main.py
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
```

#### ENVIRONMENT

Variable de entorno para indicar el ambiente (desarrollo/producción).

- **Tipo**: String
- **Requerida**: ❌ No
- **Valores**: `"production"` o cualquier otro valor (desarrollo)
- **Efecto**: Si es `"production"`, permite todos los orígenes en CORS (`["*"]`)

**Configuración:**

```bash
# Linux/Mac
export ENVIRONMENT=production

# Windows (PowerShell)
$env:ENVIRONMENT="production"
```

**Uso en el código:**

```python
# backend/main.py
if os.getenv("ENVIRONMENT") == "production":
    allowed_origins = ["*"]
```

#### PORT (Implícito)

Puerto en el que se ejecuta el servidor. No se configura directamente, sino que se pasa como argumento a Uvicorn.

- **Tipo**: Integer
- **Requerida**: ❌ No
- **Valor por defecto**: `8000`
- **Configuración**: Se pasa como argumento al iniciar el servidor

**Inicio del servidor:**

```bash
# Puerto por defecto (8000)
uvicorn main:app --reload

# Puerto personalizado
uvicorn main:app --reload --port 8080
```

### Resumen de Variables de Entorno

| Variable | Requerida | Valor por Defecto | Descripción |
|----------|-----------|-------------------|-------------|
| `GEMINI_API_KEY` | ✅ Sí | - | API key de Google Gemini |
| `GEMINI_MODEL` | ❌ No | `gemini-2.0-flash` | Modelo de Gemini a usar |
| `OPENWEATHER_API_KEY` | ❌ No | - | API key de OpenWeatherMap |
| `UNSPLASH_API_KEY` | ❌ No | - | API key de Unsplash |
| `ALLOWED_ORIGINS` | ❌ No | `http://localhost:3000` | Orígenes permitidos para CORS |
| `ENVIRONMENT` | ❌ No | - | Ambiente (production/desarrollo) |

---

## Constantes del Sistema

### Constantes de Validación

Definidas en `backend/validators.py`:

#### MAX_QUESTION_LENGTH

Longitud máxima permitida para preguntas del usuario.

- **Valor**: `500` caracteres
- **Ubicación**: `backend/validators.py`
- **Propósito**: Optimización de tokens y prevención de abuso
- **Historial**: Reducido de 2000 caracteres para optimizar tokens

```python
# backend/validators.py
MAX_QUESTION_LENGTH = 500  # Máximo de caracteres permitidos en preguntas
```

**Comportamiento:**

- Si una pregunta excede 500 caracteres, se trunca automáticamente
- El truncamiento es silencioso (no genera error)
- Se preservan palabras completas cuando es posible

#### MIN_QUESTION_LENGTH

Longitud mínima requerida para preguntas del usuario.

- **Valor**: `10` caracteres
- **Ubicación**: `backend/validators.py`
- **Propósito**: Evitar preguntas muy cortas o vacías
- **Historial**: Aumentado de 1 carácter para mejorar calidad

```python
# backend/validators.py
MIN_QUESTION_LENGTH = 10   # Mínimo de caracteres requeridos en preguntas
```

**Comportamiento:**

- Si una pregunta tiene menos de 10 caracteres, se rechaza con error 422
- Mensaje de error: `"El campo 'question' debe tener al menos 10 caracteres"`

### Constantes de Otros Campos

#### MAX_DESTINATION_LENGTH

Longitud máxima para destinos.

- **Valor**: `200` caracteres
- **Ubicación**: `backend/validators.py`
- **Uso**: Validación de campo `destination`

#### MAX_SEARCH_QUERY_LENGTH

Longitud máxima para búsquedas de destinos.

- **Valor**: `100` caracteres
- **Ubicación**: `backend/validators.py`
- **Uso**: Validación de campo `query` en búsquedas

### Resumen de Constantes

| Constante | Valor | Ubicación | Propósito |
|-----------|-------|------------|-----------|
| `MAX_QUESTION_LENGTH` | `500` | `validators.py` | Longitud máxima de preguntas |
| `MIN_QUESTION_LENGTH` | `10` | `validators.py` | Longitud mínima de preguntas |
| `MAX_DESTINATION_LENGTH` | `200` | `validators.py` | Longitud máxima de destinos |
| `MAX_SEARCH_QUERY_LENGTH` | `100` | `validators.py` | Longitud máxima de búsquedas |

---

## Configuración del Modelo de IA

### Modelo Principal: Gemini 2.0 Flash

El sistema utiliza **Google Gemini 2.0 Flash** como modelo de IA principal.

#### Características del Modelo

- **Nombre**: `gemini-2.0-flash`
- **Tipo**: Modelo Flash (gratuito)
- **Velocidad**: Optimizado para respuestas rápidas
- **Costo**: Gratuito (sin costos asociados)
- **Capacidad**: Generación de respuestas sobre viajes

#### Configuración en el Código

```python
# backend/main.py
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

# Validar que solo se usen modelos gratuitos
model_lower = GEMINI_MODEL.lower()
is_free_model = (
    "flash" in model_lower or 
    model_lower == "gemini-pro-latest" or
    model_lower == "models/gemini-pro-latest"
)

if not is_free_model:
    raise HTTPException(
        status_code=400,
        detail="Solo se permiten modelos GRATUITOS de Gemini"
    )

model = genai.GenerativeModel(GEMINI_MODEL)
```

#### Modelos Permitidos

El sistema valida que solo se usen modelos gratuitos:

| Modelo | Tipo | Estado |
|--------|------|--------|
| `gemini-2.0-flash` | Flash | ✅ Permitido (por defecto) |
| `gemini-2.5-flash` | Flash | ✅ Permitido |
| `gemini-2.0-flash-lite` | Flash | ✅ Permitido |
| `gemini-flash-latest` | Flash | ✅ Permitido |
| `gemini-pro-latest` | Pro (gratuito con límites) | ✅ Permitido |
| `gemini-2.5-pro` | Pro (pago) | ❌ Rechazado |
| `gemini-2.0-pro` | Pro (pago) | ❌ Rechazado |

---

## Estructura de Prompts Optimizados

### System Prompt Reutilizable

El sistema utiliza un **system prompt centralizado** que se reutiliza en todos los prompts.

#### Ubicación

- **Archivo**: `backend/prompts/system_prompt.txt`
- **Tamaño**: ~31 tokens (123 caracteres)
- **Formato**: Texto plano

#### Contenido

```
Mary | consultora viajes | sofisticada | experta
Tono: elegante, refinado, discreto
Enfoque: excelencia, mejores opciones
```

#### Carga en el Código

```python
# backend/prompts/__init__.py
def load_system_prompt() -> str:
    """Carga el prompt de sistema reutilizable con cache."""
    global _system_prompt_cache
    
    if _system_prompt_cache is None:
        system_prompt_path = PROMPTS_DIR / "system_prompt.txt"
        with open(system_prompt_path, 'r', encoding='utf-8') as f:
            _system_prompt_cache = f.read().strip()
    
    return _system_prompt_cache
```

### Tipos de Prompts

#### 1. Prompt Estructurado

Usado para respuestas en formato JSON con 5 secciones.

**Archivo**: `backend/prompts/travel_planning_optimized.txt`

**Estructura:**

```
{system_prompt}

Responde en JSON con 5 secciones: alojamiento, comida_local, lugares_imperdibles, consejos_locales, estimacion_costos.
Cada sección: array de strings con recomendaciones detalladas (mínimo 3-5).

Pregunta: {question}
```

**Tokens aproximados:**
- System prompt: ~31 tokens
- Instrucciones: ~35 tokens
- Pregunta: ~125 tokens (promedio)
- **Total**: ~191 tokens

**Uso:**

```python
# Se usa cuando hay destino establecido (formulario inicial o cambio explícito)
prompt = build_optimized_prompt(
    question=query.question,
    prompt_type="structured",
    destination=current_destination
)
```

#### 2. Prompt Contextual

Usado para respuestas conversacionales directas.

**Archivo**: `backend/prompts/travel_contextual_optimized.txt`

**Estructura:**

```
{system_prompt}

Responde de forma conversacional y directa (NO JSON), 2-4 párrafos{destination_text}.

Pregunta: {question}
```

**Tokens aproximados:**
- System prompt: ~31 tokens
- Instrucciones: ~25 tokens
- Pregunta: ~125 tokens (promedio)
- **Total**: ~181 tokens

**Uso:**

```python
# Se usa para preguntas de seguimiento sobre el mismo destino
prompt = build_optimized_prompt(
    question=query.question,
    prompt_type="contextual",
    destination=current_destination
)
```

### Construcción de Prompts

La función `build_optimized_prompt()` construye prompts ultra-optimizados:

```python
# backend/prompts/__init__.py
def build_optimized_prompt(
    question: str, 
    prompt_type: str = "structured", 
    destination: Optional[str] = None
) -> str:
    """
    Construye un prompt ultra-optimizado usando templates desde archivos.
    """
    # 1. Validar y limpiar la pregunta
    validate_input_length(question, "question", 
                         min_length=MIN_QUESTION_LENGTH, 
                         max_length=MAX_QUESTION_LENGTH)
    cleaned_question = sanitize_user_input(question, max_length=MAX_QUESTION_LENGTH)
    
    # 2. Cargar template desde archivo según tipo
    if prompt_type == "structured":
        prompt = load_prompt("travel_planning_optimized", question=cleaned_question)
    else:
        destination_text = f" sobre {destination}" if destination else ""
        prompt = load_prompt("travel_contextual_optimized", 
            question=cleaned_question,
            destination_text=destination_text
        )
    
    return prompt
```

---

## Optimización de Tokens

### Resumen de Optimizaciones

El sistema ha implementado optimizaciones que logran una **reducción total del 92.0% en tokens** comparado con la versión original.

### Métricas de Optimización

#### Antes de la Optimización

| Componente | Tokens |
|------------|--------|
| Prompt base | ~1,513 tokens |
| Construcción contexto | ~503 tokens |
| Pregunta (1000 caracteres) | ~250 tokens |
| **TOTAL** | **~2,266 tokens** |

#### Después de la Optimización

| Componente | Tokens |
|------------|--------|
| System prompt | ~31 tokens |
| Instrucciones | ~35 tokens |
| Pregunta (500 caracteres máximo) | ~125 tokens |
| **TOTAL** | **~191 tokens** |

#### Ahorro Total

- **Reducción**: 2,085 tokens (de ~2,266 a ~181)
- **Porcentaje**: 92.0% de reducción
- **Ahorro por llamada**: 2,085 tokens

### Optimizaciones Implementadas

#### 1. System Prompt Reutilizable

**Antes:**
- Instrucciones del sistema duplicadas en cada prompt
- ~500 caracteres (~125 tokens) por prompt
- 8-10 reglas detalladas

**Después:**
- System prompt centralizado
- ~123 caracteres (~31 tokens)
- 6 reglas esenciales
- **Reducción**: 74.2% en tokens base

#### 2. Construcción Simplificada

**Antes:**
- Construcción TOON con contexto dinámico verboso
- ~78-500 tokens adicionales por construcción
- ~55 líneas de código

**Después:**
- Construcción directa desde templates
- ~35 tokens de instrucciones
- ~10 líneas de código
- **Reducción**: 83.9% en construcción de prompt

#### 3. Validación de Longitud

**Antes:**
- `MAX_QUESTION_LENGTH = 2000` caracteres
- Preguntas largas consumían muchos tokens

**Después:**
- `MAX_QUESTION_LENGTH = 500` caracteres
- Truncamiento automático si excede
- **Reducción**: 75% en tokens de pregunta (para preguntas largas)

### Impacto en Costos

| Escenario | Tokens Ahorrados | Reducción de Costos |
|-----------|------------------|---------------------|
| **Estructurado - Promedio** | 1,210 tokens | 80.0% |
| **Contextualizado - Promedio** | 308 tokens | 58.0% |
| **Construcción - Promedio** | 422 tokens | 83.9% |
| **TOTAL COMBINADO** | **2,085 tokens** | **92.0%** |

### Estructura de Prompt Optimizada

#### Prompt Estructurado Optimizado

```
{system_prompt}                    # ~31 tokens

Responde en JSON con 5 secciones: alojamiento, comida_local, lugares_imperdibles, consejos_locales, estimacion_costos.
Cada sección: array de strings con recomendaciones detalladas (mínimo 3-5).  # ~35 tokens

Pregunta: {question}                  # ~125 tokens (promedio)
```

**Total**: ~191 tokens

#### Prompt Contextual Optimizado

```
{system_prompt}                    # ~31 tokens

Responde de forma conversacional y directa (NO JSON), 2-4 párrafos{destination_text}.  # ~25 tokens

Pregunta: {question}               # ~125 tokens (promedio)
```

**Total**: ~181 tokens

### Comparación: Antes vs Después

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| **Tokens por prompt** | ~2,266 | ~181 | 92.0% |
| **Líneas de código** | ~55 | ~10 | 82% |
| **Tiempo de construcción** | ~50ms | ~5ms | 90% |
| **Costo por llamada** | Alto | Mínimo | 92% |

---

## Configuración de Servicios Externos

### OpenWeatherMap

#### Configuración

- **API Key**: Variable de entorno `OPENWEATHER_API_KEY`
- **Endpoint**: `https://api.openweathermap.org/data/2.5/weather`
- **Cache**: Implementado en `backend/weather_cache.py`
- **Validación**: Se valida al iniciar el servidor

#### Límites del Plan Gratuito

- 60 llamadas por minuto
- 1,000,000 llamadas por mes
- Datos del clima actual
- Pronóstico de 5 días

### Unsplash

#### Configuración

- **API Key**: Variable de entorno `UNSPLASH_API_KEY`
- **Endpoint**: `https://api.unsplash.com/search/photos`
- **Validación**: Se valida al iniciar el servidor

#### Límites del Plan Gratuito

- 50 solicitudes por hora
- Acceso a búsqueda de fotos
- Fotos de alta calidad

---

## Ejemplo de Configuración Completa

### Archivo de Configuración (No existe, solo referencia)

Aunque el proyecto no usa archivos `.env`, aquí está un ejemplo de cómo se verían las variables:

```bash
# .env (NO SE USA - Solo referencia)
# Este archivo NO existe en el proyecto por seguridad

# API Keys (Obligatorias)
GEMINI_API_KEY=AIzaSy...

# API Keys (Opcionales)
OPENWEATHER_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
UNSPLASH_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Configuración del Modelo
GEMINI_MODEL=gemini-2.0-flash

# Configuración de CORS
ALLOWED_ORIGINS=http://localhost:3000,https://viajeia.com
ENVIRONMENT=production
```

### Configuración Real (Variables de Entorno del Sistema)

**Linux/Mac (zsh):**

```bash
# Agregar a ~/.zshrc
echo 'export GEMINI_API_KEY=tu_api_key_aqui' >> ~/.zshrc
echo 'export OPENWEATHER_API_KEY=tu_api_key_aqui' >> ~/.zshrc
echo 'export UNSPLASH_API_KEY=tu_api_key_aqui' >> ~/.zshrc
echo 'export GEMINI_MODEL=gemini-2.0-flash' >> ~/.zshrc
echo 'export ENVIRONMENT=production' >> ~/.zshrc

# Cargar en sesión actual
source ~/.zshrc
```

**Windows (PowerShell):**

```powershell
[System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY', 'tu_api_key_aqui', 'User')
[System.Environment]::SetEnvironmentVariable('OPENWEATHER_API_KEY', 'tu_api_key_aqui', 'User')
[System.Environment]::SetEnvironmentVariable('UNSPLASH_API_KEY', 'tu_api_key_aqui', 'User')
[System.Environment]::SetEnvironmentVariable('GEMINI_MODEL', 'gemini-2.0-flash', 'User')
[System.Environment]::SetEnvironmentVariable('ENVIRONMENT', 'production', 'User')
```

---

## Verificación de Configuración

### Script de Verificación

```bash
#!/bin/bash
# verify_config.sh

echo "🔍 Verificando configuración de ViajeIA..."
echo ""

# Verificar GEMINI_API_KEY
if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ GEMINI_API_KEY no configurada"
else
    echo "✅ GEMINI_API_KEY configurada"
fi

# Verificar GEMINI_MODEL
GEMINI_MODEL=${GEMINI_MODEL:-"gemini-2.0-flash"}
echo "✅ GEMINI_MODEL: $GEMINI_MODEL"

# Verificar OPENWEATHER_API_KEY
if [ -z "$OPENWEATHER_API_KEY" ]; then
    echo "⚠️  OPENWEATHER_API_KEY no configurada (opcional)"
else
    echo "✅ OPENWEATHER_API_KEY configurada"
fi

# Verificar UNSPLASH_API_KEY
if [ -z "$UNSPLASH_API_KEY" ]; then
    echo "⚠️  UNSPLASH_API_KEY no configurada (opcional)"
else
    echo "✅ UNSPLASH_API_KEY configurada"
fi

echo ""
echo "📊 Resumen de configuración completado"
```

### Verificación Manual

```bash
# Verificar todas las variables
echo "GEMINI_API_KEY: ${GEMINI_API_KEY:+✅ Configurada}"
echo "GEMINI_MODEL: ${GEMINI_MODEL:-gemini-2.0-flash}"
echo "OPENWEATHER_API_KEY: ${OPENWEATHER_API_KEY:+✅ Configurada}"
echo "UNSPLASH_API_KEY: ${UNSPLASH_API_KEY:+✅ Configurada}"
echo "ENVIRONMENT: ${ENVIRONMENT:-development}"
```

---

## Referencias

- **Documentación de API Keys**: Ver `SECRETS.md`
- **Optimización de Tokens**: Ver `entrega/ejercicio1/Resumen Ejecutivo.md`
- **Documentación de API**: Ver `docs/API_DOCUMENTATION.md`
- **Arquitectura**: Ver `docs/ARQUITECTURA.md`

---

**Última actualización**: 2024-01-15

