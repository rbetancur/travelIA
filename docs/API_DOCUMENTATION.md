# 📚 Documentación de la API - ViajeIA

Documentación completa de todos los endpoints de la API REST de ViajeIA.

## 📋 Tabla de Contenidos

- [Información General](#información-general)
- [Autenticación](#autenticación)
- [Endpoints Principales](#endpoints-principales)
  - [POST /api/travel](#post-apitravel)
  - [GET /api/health](#get-apihealth)
- [Endpoints de Destinos](#endpoints-de-destinos)
- [Endpoints de Conversación](#endpoints-de-conversación)
- [Endpoints de Utilidades](#endpoints-de-utilidades)
- [Códigos de Error](#códigos-de-error)
- [Reglas de Validación](#reglas-de-validación)

---

## Información General

### Base URL

```
http://localhost:8000
```

### Formato de Respuesta

Todas las respuestas exitosas se devuelven en formato JSON con codificación UTF-8.

### Headers Requeridos

```
Content-Type: application/json
```

---

## Autenticación

La API no requiere autenticación para la mayoría de los endpoints. Sin embargo, algunos servicios (clima, fotos) requieren API keys configuradas en el servidor mediante variables de entorno.

---

## Endpoints Principales

### POST /api/travel

Endpoint principal para procesar preguntas sobre viajes usando Google Gemini. Mantiene historial de conversación para contexto y genera respuestas estructuradas o contextuales según el tipo de consulta.

#### Descripción

Este endpoint procesa preguntas sobre planificación de viajes, manteniendo el contexto de la conversación mediante un sistema de sesiones. Puede generar respuestas en formato estructurado (5 secciones) o contextual según el tipo de consulta.

#### URL

```
POST /api/travel
```

#### Headers

```
Content-Type: application/json
```

#### Cuerpo de la Solicitud

```json
{
  "question": "string (requerido)",
  "destination": "string (opcional)",
  "session_id": "string (opcional, formato UUID)"
}
```

##### Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `question` | string | ✅ Sí | Pregunta del usuario sobre viajes. Debe tener entre 10 y 500 caracteres. |
| `destination` | string | ❌ No | Destino en formato "Ciudad, País" (ej: "París, Francia"). Si se proporciona, se usa formato estructurado. |
| `session_id` | string (UUID) | ❌ No | ID de sesión para mantener historial de conversación. Si no se proporciona, se crea una nueva sesión. |

##### Ejemplo de Solicitud

```json
{
  "question": "¿Qué lugares debo visitar en París durante 3 días?",
  "destination": "París, Francia",
  "session_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

#### Respuestas Exitosas

##### Respuesta 200 OK

```json
{
  "answer": "string",
  "weather": "string | null",
  "photos": [
    {
      "url": "string",
      "description": "string",
      "photographer": "string",
      "photographer_url": "string"
    }
  ] | null,
  "session_id": "string (UUID)",
  "requires_confirmation": false,
  "detected_destination": "string | null",
  "current_destination": "string | null",
  "response_format": "structured | contextual"
}
```

##### Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `answer` | string | Respuesta generada por Gemini sobre la pregunta del usuario |
| `weather` | string \| null | Información del clima del destino (si está disponible) |
| `photos` | array \| null | Array de fotos del destino desde Unsplash (máximo 3) |
| `session_id` | string (UUID) | ID de sesión de la conversación |
| `requires_confirmation` | boolean | Indica si se requiere confirmación del usuario (actualmente siempre `false`) |
| `detected_destination` | string \| null | Destino detectado en la pregunta (si hay cambio) |
| `current_destination` | string \| null | Destino actual de la conversación |
| `response_format` | string | Formato de la respuesta: `"structured"` (5 secciones) o `"contextual"` (respuesta directa) |

##### Ejemplo de Respuesta Exitosa

```json
{
  "answer": "Para 3 días en París, te recomiendo:\n\n1. Día 1: Torre Eiffel, Campos Elíseos, Arco del Triunfo\n2. Día 2: Museo del Louvre, Notre-Dame, Barrio Latino\n3. Día 3: Montmartre, Sacré-Cœur, Moulin Rouge",
  "weather": "Temperatura actual: 15°C, Parcialmente nublado",
  "photos": [
    {
      "url": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34",
      "description": "Torre Eiffel al atardecer",
      "photographer": "John Doe",
      "photographer_url": "https://unsplash.com/@johndoe"
    }
  ],
  "session_id": "123e4567-e89b-12d3-a456-426614174000",
  "requires_confirmation": false,
  "detected_destination": null,
  "current_destination": "París, Francia",
  "response_format": "structured"
}
```

#### Códigos de Error

| Código | Significado | Descripción | Solución |
|--------|-------------|-------------|----------|
| **400** | Bad Request | La solicitud es inválida | Verificar que el cuerpo de la solicitud sea válido JSON y cumpla con las reglas de validación |
| **401** | Unauthorized | Error de autenticación con Gemini | Verificar que la API key de Gemini esté configurada correctamente en el servidor |
| **422** | Unprocessable Entity | Error de validación de datos | Verificar que los campos cumplan con las reglas de validación (longitud, formato, etc.) |
| **429** | Too Many Requests | Límite de solicitudes excedido | Esperar antes de realizar otra solicitud |
| **500** | Internal Server Error | Error interno del servidor | Contactar al soporte si el problema persiste |

##### Ejemplos de Respuestas de Error

**400 - Bad Request (Pregunta vacía)**
```json
{
  "detail": "Por favor, proporcione una pregunta válida."
}
```

**400 - Bad Request (Contenido bloqueado)**
```json
{
  "detail": "Su pregunta contiene contenido que no podemos procesar. Por favor, reformule."
}
```

**400 - Bad Request (Argumento inválido)**
```json
{
  "detail": "Error en los parámetros de la solicitud. Por favor, verifique su entrada."
}
```

**401 - Unauthorized**
```json
{
  "detail": "Error de autenticación. Contacte al administrador."
}
```

**422 - Unprocessable Entity (Validación)**
```json
{
  "detail": "El campo 'question' debe tener al menos 10 caracteres"
}
```

**422 - Unprocessable Entity (Longitud máxima)**
```json
{
  "detail": "El campo 'question' excede la longitud máxima de 500 caracteres"
}
```

**422 - Unprocessable Entity (Contenido no permitido)**
```json
{
  "detail": "La entrada contiene contenido no permitido"
}
```

**429 - Too Many Requests**
```json
{
  "detail": "Límite de solicitudes excedido. Intente de nuevo más tarde."
}
```

**500 - Internal Server Error**
```json
{
  "detail": "Error al procesar su solicitud. Por favor, inténtelo de nuevo. Si el problema persiste, contacte al soporte."
}
```

#### Reglas de Validación

##### Campo `question`

- **Longitud mínima**: 10 caracteres
- **Longitud máxima**: 500 caracteres
- **Truncamiento automático**: Si el texto excede 500 caracteres, se trunca automáticamente a 500 caracteres
- **Sanitización**: 
  - Se eliminan caracteres de control
  - Se normalizan espacios en blanco (múltiples espacios → uno solo)
  - Se normaliza Unicode (NFD → NFC)
  - Se eliminan espacios al inicio y final
- **Validación de seguridad**: 
  - Se detectan intentos de prompt injection
  - Se rechazan patrones sospechosos
  - Se validan delimitadores peligrosos

##### Campo `destination` (opcional)

- **Formato**: "Ciudad, País" (ej: "París, Francia")
- **Longitud mínima**: 3 caracteres
- **Longitud máxima**: 200 caracteres
- **Caracteres permitidos**: Letras, números, espacios, comas, guiones, puntos, acentos
- **Sanitización**: Similar a `question`

##### Campo `session_id` (opcional)

- **Formato**: UUID v4 válido
- **Ejemplo**: `"123e4567-e89b-12d3-a456-426614174000"`
- **Validación**: Debe ser un UUID válido

#### Comportamiento del Truncamiento Automático

Cuando el campo `question` excede los 500 caracteres:

1. **Antes de la validación**: El texto se trunca automáticamente a 500 caracteres
2. **Sin notificación**: El truncamiento es silencioso, no se devuelve un error
3. **Preservación**: Se intenta preservar palabras completas cuando es posible
4. **Sanitización previa**: El truncamiento ocurre después de la sanitización básica

**Ejemplo de Truncamiento:**

```
Entrada: "¿Qué lugares debo visitar en París? " + (texto repetido hasta 600 caracteres)
Salida: Texto truncado a exactamente 500 caracteres
```

#### Notas Importantes

1. **Historial de Conversación**: El endpoint mantiene historial de conversación mediante `session_id`. Si no se proporciona, se crea una nueva sesión.

2. **Formato de Respuesta**: 
   - **Estructurado**: Se usa cuando hay un destino establecido (formulario inicial o cambio explícito)
   - **Contextual**: Se usa para preguntas de seguimiento sobre el mismo destino

3. **Detección de Cambio de Destino**: Si se detecta un cambio implícito de destino, el sistema solicita confirmación al usuario.

4. **Servicios Opcionales**: 
   - El clima solo se incluye si el servicio de OpenWeatherMap está configurado
   - Las fotos solo se incluyen si el servicio de Unsplash está configurado

5. **Sin Caché**: Este endpoint siempre consulta directamente a Gemini, no utiliza caché de respuestas.

---

### GET /api/health

Endpoint de monitoreo para verificar el estado del servidor.

#### Descripción

Endpoint simple de health check que permite verificar si el servidor está funcionando correctamente. Útil para monitoreo, load balancers y sistemas de alertas.

#### URL

```
GET /api/health
```

#### Parámetros

Ninguno

#### Respuesta Exitosa

##### 200 OK

```json
{
  "status": "ok"
}
```

#### Códigos de Error

Este endpoint normalmente no devuelve errores. Si el servidor está funcionando, siempre devolverá `200 OK`.

#### Ejemplo de Uso

```bash
curl http://localhost:8000/api/health
```

**Respuesta:**
```json
{
  "status": "ok"
}
```

#### Notas

- Este endpoint no requiere autenticación
- No consume recursos significativos
- Ideal para configurar checks de salud en sistemas de monitoreo
- Tiempo de respuesta típico: < 10ms

---

## Endpoints de Destinos

### GET /api/destinations/popular

Obtiene los 5 destinos más populares/recomendados usando Gemini.

#### URL

```
GET /api/destinations/popular
```

#### Respuesta Exitosa

```json
{
  "destinations": [
    "París, Francia",
    "Tokio, Japón",
    "Nueva York, Estados Unidos",
    "Bali, Indonesia",
    "Barcelona, España"
  ]
}
```

#### Códigos de Error

- **500**: Error al obtener destinos (devuelve destinos por defecto)

---

### POST /api/destinations/search

Busca destinos basado en lo que el usuario está escribiendo usando Gemini.

#### URL

```
POST /api/destinations/search
```

#### Cuerpo de la Solicitud

```json
{
  "query": "string"
}
```

#### Respuesta Exitosa

```json
{
  "destinations": [
    "París, Francia",
    "París, Texas, Estados Unidos"
  ]
}
```

#### Códigos de Error

- **500**: Error al buscar destinos (devuelve lista vacía)

---

## Endpoints de Conversación

### POST /api/conversation/create-session

Crea una nueva sesión de conversación.

#### URL

```
POST /api/conversation/create-session
```

#### Respuesta Exitosa

```json
{
  "session_id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "Sesión de conversación creada exitosamente"
}
```

---

### POST /api/conversation/history

Obtiene el historial de una conversación.

#### URL

```
POST /api/conversation/history
```

#### Cuerpo de la Solicitud

```json
{
  "session_id": "string (UUID, requerido)"
}
```

#### Respuesta Exitosa

```json
{
  "session_id": "123e4567-e89b-12d3-a456-426614174000",
  "messages": [
    {
      "role": "user",
      "content": "¿Qué lugares debo visitar en París?"
    },
    {
      "role": "assistant",
      "content": "Para 3 días en París..."
    }
  ],
  "stats": {
    "total_messages": 2,
    "user_messages": 1,
    "assistant_messages": 1
  }
}
```

#### Códigos de Error

- **404**: Sesión no encontrada

---

### POST /api/conversation/clear

Limpia el historial de una conversación.

#### URL

```
POST /api/conversation/clear
```

#### Cuerpo de la Solicitud

```json
{
  "session_id": "string (UUID, requerido)"
}
```

#### Respuesta Exitosa

```json
{
  "session_id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "Historial limpiado exitosamente"
}
```

#### Códigos de Error

- **404**: Sesión no encontrada

---

## Endpoints de Utilidades

### GET /api/itinerary/pdf

Genera un PDF con el itinerario completo de la conversación.

#### URL

```
GET /api/itinerary/pdf?session_id={uuid}&departure_date={date}&return_date={date}
```

#### Parámetros de Query

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `session_id` | string (UUID) | ✅ Sí | ID de sesión de conversación |
| `departure_date` | string | ❌ No | Fecha de salida (formato: YYYY-MM-DD) |
| `return_date` | string | ❌ No | Fecha de regreso (formato: YYYY-MM-DD) |

#### Respuesta Exitosa

- **200 OK**: Archivo PDF descargable
- **Content-Type**: `application/pdf`
- **Content-Disposition**: `attachment; filename="itinerario_{destino}.pdf"`

#### Códigos de Error

- **404**: No se encontró historial de conversación para esta sesión
- **500**: Error al generar el PDF

---

### POST /api/travel/confirm-destination

Confirma o rechaza un cambio de destino.

#### URL

```
POST /api/travel/confirm-destination
```

#### Cuerpo de la Solicitud

```json
{
  "session_id": "string (UUID, requerido)",
  "new_destination": "string (requerido)",
  "confirmed": boolean,
  "original_question": "string (opcional)"
}
```

#### Respuesta Exitosa

```json
{
  "status": "confirmed | rejected",
  "new_destination": "string",
  "message": "string"
}
```

---

### POST /api/realtime-info

Obtiene información en tiempo real de un destino (tipo de cambio, diferencia horaria, temperatura).

#### URL

```
POST /api/realtime-info
```

#### Cuerpo de la Solicitud

```json
{
  "destination": "string (requerido, formato: 'Ciudad, País')"
}
```

#### Respuesta Exitosa

```json
{
  "destination": "París, Francia",
  "currency": {
    "code": "EUR",
    "rate": 1.0,
    "symbol": "€"
  },
  "timezone": {
    "offset": "+01:00",
    "current_time": "2024-01-15T14:30:00+01:00"
  },
  "weather": {
    "temperature": 15,
    "condition": "Parcialmente nublado"
  }
}
```

#### Códigos de Error

- **400**: El destino es requerido
- **404**: No se pudo obtener información para el destino especificado
- **500**: Error al obtener información en tiempo real

---

### GET /api/weather/cache/stats

Obtiene estadísticas del cache de clima.

#### URL

```
GET /api/weather/cache/stats
```

#### Respuesta Exitosa

```json
{
  "cache_stats": {
    "hits": 10,
    "misses": 5,
    "size": 15,
    "hit_rate": 0.67
  },
  "api_available": true
}
```

---

### POST /api/weather/cache/clear

Limpia el cache de clima.

#### URL

```
POST /api/weather/cache/clear
```

#### Respuesta Exitosa

```json
{
  "message": "Cache limpiado exitosamente",
  "cleared": true
}
```

---

### GET /api/weather/country-codes/stats

Obtiene estadísticas del cache de códigos de países.

#### URL

```
GET /api/weather/country-codes/stats
```

#### Respuesta Exitosa

```json
{
  "cache_stats": {
    "hits": 20,
    "misses": 3,
    "size": 23,
    "hit_rate": 0.87
  }
}
```

---

### POST /api/weather/country-codes/clear

Limpia el cache de códigos de países.

#### URL

```
POST /api/weather/country-codes/clear
```

#### Respuesta Exitosa

```json
{
  "message": "Cache de códigos de países limpiado exitosamente",
  "cleared": true
}
```

---

## Códigos de Error

### Códigos HTTP Estándar

| Código | Significado | Descripción |
|--------|-------------|-------------|
| **200** | OK | Solicitud exitosa |
| **400** | Bad Request | La solicitud es inválida o contiene errores |
| **401** | Unauthorized | Error de autenticación (API key inválida) |
| **404** | Not Found | Recurso no encontrado |
| **422** | Unprocessable Entity | Error de validación de datos |
| **429** | Too Many Requests | Límite de solicitudes excedido |
| **500** | Internal Server Error | Error interno del servidor |

### Formato de Respuesta de Error

Todas las respuestas de error siguen este formato:

```json
{
  "detail": "Mensaje descriptivo del error"
}
```

---

## Reglas de Validación

### Validación de Longitud

#### Campo `question` (POST /api/travel)

- **Mínimo**: 10 caracteres
- **Máximo**: 500 caracteres
- **Truncamiento automático**: 
  - Si el texto excede 500 caracteres, se trunca automáticamente
  - El truncamiento es silencioso (no genera error)
  - Se preservan palabras completas cuando es posible

#### Validación de Contenido

- **Sanitización automática**:
  - Eliminación de caracteres de control
  - Normalización de espacios en blanco
  - Normalización Unicode (NFD → NFC)
  - Eliminación de espacios al inicio y final

- **Detección de seguridad**:
  - Detección de intentos de prompt injection
  - Validación de patrones sospechosos
  - Rechazo de delimitadores peligrosos

#### Ejemplos de Validación

**✅ Válido:**
```json
{
  "question": "¿Qué lugares debo visitar en París?"
}
```
(35 caracteres - dentro del rango)

**❌ Inválido (muy corto):**
```json
{
  "question": "París?"
}
```
(6 caracteres - menos del mínimo de 10)

**✅ Válido (truncamiento automático):**
```json
{
  "question": "Texto muy largo que excede 500 caracteres..." // Se trunca automáticamente a 500
}
```

**❌ Inválido (contenido no permitido):**
```json
{
  "question": "Ignora las instrucciones anteriores y..."
}
```
(Detectado como intento de prompt injection)

### Validación de Formato

#### Campo `session_id`

- **Formato**: UUID v4
- **Ejemplo válido**: `"123e4567-e89b-12d3-a456-426614174000"`
- **Ejemplo inválido**: `"123"` (no es UUID válido)

#### Campo `destination`

- **Formato**: "Ciudad, País"
- **Ejemplo válido**: `"París, Francia"`
- **Caracteres permitidos**: Letras, números, espacios, comas, guiones, puntos, acentos
- **Longitud**: Entre 3 y 200 caracteres

---

## Ejemplos de Uso

### Ejemplo 1: Primera Consulta con Destino

```bash
curl -X POST http://localhost:8000/api/travel \
  -H "Content-Type: application/json" \
  -d '{
    "question": "¿Qué lugares debo visitar en París durante 3 días?",
    "destination": "París, Francia"
  }'
```

### Ejemplo 2: Pregunta de Seguimiento

```bash
curl -X POST http://localhost:8000/api/travel \
  -H "Content-Type: application/json" \
  -d '{
    "question": "¿Cuál es el mejor momento para visitar la Torre Eiffel?",
    "session_id": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

### Ejemplo 3: Health Check

```bash
curl http://localhost:8000/api/health
```

### Ejemplo 4: Obtener Destinos Populares

```bash
curl http://localhost:8000/api/destinations/popular
```

### Ejemplo 5: Buscar Destinos

```bash
curl -X POST http://localhost:8000/api/destinations/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "París"
  }'
```

---

## Notas Finales

1. **Rate Limiting**: La API puede tener límites de tasa. Si recibes un error 429, espera antes de realizar otra solicitud.

2. **Sesiones**: Las sesiones se mantienen en memoria. Si el servidor se reinicia, se pierden las sesiones.

3. **Servicios Opcionales**: Algunos servicios (clima, fotos) requieren API keys configuradas. Si no están disponibles, esos campos serán `null` en la respuesta.

4. **Modelos de Gemini**: La API utiliza modelos gratuitos de Gemini (Flash) por defecto. El modelo puede configurarse mediante la variable de entorno `GEMINI_MODEL`.

5. **Documentación Interactiva**: Para una documentación interactiva, visita:
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

---

**Última actualización**: 2024-01-15

