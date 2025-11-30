# 🏗️ Arquitectura del Proyecto - ViajeIA

Documentación completa de la arquitectura, estructura del proyecto y flujo de datos de ViajeIA.

## 📋 Tabla de Contenidos

- [Visión General](#visión-general)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Flujo de Datos](#flujo-de-datos)
- [Componentes Principales](#componentes-principales)
- [Comunicación entre Componentes](#comunicación-entre-componentes)

---

## Visión General

ViajeIA es una aplicación web de planificación de viajes con inteligencia artificial que utiliza un modelo de arquitectura cliente-servidor. El frontend (React) se comunica con el backend (FastAPI) mediante HTTP/JSON, y el backend integra con Google Gemini 2.0 Flash para generar respuestas inteligentes sobre viajes.

### Características Principales

- **Frontend React**: Interfaz de usuario interactiva y responsiva
- **Backend FastAPI**: API REST de alto rendimiento con validación robusta
- **IA con Gemini**: Integración con Google Gemini 2.0 Flash para generación de contenido
- **Servicios Externos**: Integración con OpenWeatherMap (clima) y Unsplash (fotos)
- **Gestión de Estado**: Historial de conversación y sesiones en memoria

---

## Tecnologías Utilizadas

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 18.2.0 | Framework de JavaScript para construir la interfaz de usuario |
| **React DOM** | 18.2.0 | Renderizado de componentes React en el DOM |
| **Axios** | 1.6.0 | Cliente HTTP para realizar peticiones al backend |
| **Lucide React** | 0.554.0 | Librería de iconos para la interfaz |
| **React Scripts** | 5.0.1 | Scripts y configuración para desarrollo React |
| **Tailwind CSS** | 4.1.17 | Framework CSS para estilos |
| **Autoprefixer** | 10.4.22 | Procesador CSS para compatibilidad de navegadores |
| **PostCSS** | 8.5.6 | Herramienta para transformar CSS |

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **FastAPI** | 0.104.1 | Framework web moderno y rápido para construir APIs REST |
| **Uvicorn** | 0.24.0 | Servidor ASGI de alto rendimiento para FastAPI |
| **Pydantic** | 2.5.0 | Validación de datos y serialización usando tipos de Python |
| **Google Generative AI** | 0.3.2 | SDK oficial de Google para interactuar con Gemini API |
| **Requests** | 2.32.5 | Librería HTTP para peticiones a servicios externos |
| **Pytz** | 2024.1 | Manejo de zonas horarias |
| **ReportLab** | 4.0.7 | Generación de documentos PDF |
| **Pillow** | 10.1.0 | Procesamiento de imágenes |
| **HTTPX** | 0.25.2 | Cliente HTTP asíncrono para testing |
| **Pytest** | 7.4.3 | Framework de testing para Python |

### Servicios Externos

| Servicio | Propósito |
|----------|-----------|
| **Google Gemini 2.0 Flash** | Modelo de IA para generar respuestas sobre viajes |
| **OpenWeatherMap API** | Información del clima en tiempo real |
| **Unsplash API** | Fotos de alta calidad de destinos turísticos |

### Protocolos y Formatos

| Tecnología | Propósito |
|------------|-----------|
| **HTTP/HTTPS** | Protocolo de comunicación entre frontend y backend |
| **JSON** | Formato de intercambio de datos (request/response) |
| **REST** | Arquitectura de API RESTful |

---

## Estructura del Proyecto

### Árbol de Directorios Completo

```
travelIA/
│
├── backend/                          # Backend FastAPI
│   ├── main.py                       # Punto de entrada principal de la API
│   ├── requirements.txt              # Dependencias de Python
│   ├── Procfile                      # Configuración para despliegue (Railway)
│   ├── railway.json                  # Configuración específica de Railway
│   ├── start_backend.sh              # Script de inicio del servidor
│   │
│   ├── prompts/                      # Templates de prompts para Gemini
│   │   ├── __init__.py
│   │   ├── popular_destinations.txt
│   │   ├── search_destinations.txt
│   │   ├── system_prompt.txt
│   │   ├── travel_contextual_optimized.txt
│   │   └── travel_planning_optimized.txt
│   │
│   ├── logs/                         # Logs de la aplicación
│   │   └── app.log
│   │
│   ├── venv/                         # Entorno virtual de Python (no versionado)
│   │
│   ├── conversation_history.py       # Gestión de historial de conversaciones
│   ├── country_code_cache.py         # Cache de códigos de países ISO
│   ├── destination_detector.py       # Detección de cambios de destino
│   ├── logger_config.py             # Configuración de logging
│   ├── pdf_generator.py             # Generación de PDFs de itinerarios
│   ├── realtime_info.py              # Información en tiempo real (clima, moneda, etc.)
│   ├── security.py                   # Validación de seguridad y detección de prompt injection
│   ├── toon_parser.py                # Parser para formato TOON de prompts
│   ├── unsplash.py                   # Integración con Unsplash API
│   ├── validators.py                 # Validadores Pydantic personalizados
│   ├── weather.py                    # Integración con OpenWeatherMap API
│   ├── weather_cache.py              # Cache de datos de clima
│   │
│   ├── test_error_handling.py        # Tests de manejo de errores
│   ├── test_gemini.py                # Tests de integración con Gemini
│   ├── test_openweather.py           # Tests de OpenWeatherMap
│   ├── test_unsplash.py              # Tests de Unsplash
│   │
│   ├── _fix_importlib.py             # Workaround para Python 3.9
│   ├── verificar_clima.sh            # Script de verificación de clima
│   ├── README.md                     # Documentación del backend
│   ├── README_TESTS.md               # Documentación de tests
│   └── WEATHER_CACHE_README.md       # Documentación del cache de clima
│
├── frontend/                         # Frontend React
│   ├── src/                          # Código fuente
│   │   ├── App.js                    # Componente principal de la aplicación
│   │   ├── App.css                   # Estilos del componente principal
│   │   ├── index.js                  # Punto de entrada de React
│   │   └── index.css                 # Estilos globales
│   │
│   ├── public/                       # Archivos públicos estáticos
│   │   └── index.html                # HTML base
│   │
│   ├── build/                        # Build de producción (generado)
│   │   ├── index.html
│   │   ├── asset-manifest.json
│   │   └── static/
│   │       ├── css/
│   │       └── js/
│   │
│   ├── node_modules/                 # Dependencias de Node.js (no versionado)
│   ├── package.json                  # Dependencias y scripts de npm
│   ├── package-lock.json             # Lock file de dependencias
│   ├── vercel.json                   # Configuración de Vercel
│   └── .gitignore                    # Archivos ignorados por git
│
├── docs/                             # Documentación del proyecto
│   ├── API_DOCUMENTATION.md          # Documentación completa de la API
│   └── ARQUITECTURA.md               # Este archivo
│
├── entrega/                          # Documentación de entregas
│   ├── ejercicio1/
│   │   ├── ANALISIS_PROMPT.md
│   │   ├── Ejercicio 1: Optimización de Tokens.md
│   │   ├── Paso2.md
│   │   ├── Paso3.md
│   │   └── Resumen Ejecutivo.md
│   └── ejercicio2/
│       ├── Reporte_Tests.md
│       └── Resumen_Ejecutivo.md
│
├── entrega_ejercicio3/               # Entrega del ejercicio 3
│
├── README.md                         # Documentación principal del proyecto
├── SECRETS.md                        # Guía de configuración de API keys
├── COMANDOS.md                       # Comandos de referencia rápida
├── DEPLOYMENT.md                     # Guía de despliegue
├── DEPLOY_QUICK_START.md             # Inicio rápido de despliegue
├── TOON_GUIDE.md                     # Guía del formato TOON
├── TROUBLESHOOTING.md                # Solución de problemas
└── OBTENER_API_KEY_OPENWEATHER.md    # Guía para obtener API key de OpenWeatherMap
```

---

## Arquitectura del Sistema

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIO                                  │
│                    (Navegador Web)                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            │ JSON Request/Response
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                      FRONTEND (React)                           │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Componente App.js                                     │    │
│  │  - Gestión de estado (useState, useRef)               │    │
│  │  - Formulario de búsqueda de destinos                  │    │
│  │  - Chat interactivo                                    │    │
│  │  - Visualización de respuestas                        │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Axios (Cliente HTTP)                                 │    │
│  │  - POST /api/travel                                   │    │
│  │  - GET /api/health                                    │    │
│  │  - GET /api/destinations/popular                      │    │
│  │  - POST /api/destinations/search                      │    │
│  └──────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            │ JSON Request/Response
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    BACKEND (FastAPI)                            │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  FastAPI Application (main.py)                        │    │
│  │  - Endpoints REST                                    │    │
│  │  - Middleware CORS                                   │    │
│  │  - Manejo de excepciones                            │    │
│  └──────────────────────────────────────────────────────┘    │
│                            │                                   │
│  ┌─────────────────────────▼──────────────────────────┐      │
│  │  Validación y Sanitización                          │      │
│  │  - validators.py (Pydantic validators)              │      │
│  │  - security.py (Detección de prompt injection)      │      │
│  │  - Validación de longitud (10-500 caracteres)       │      │
│  └─────────────────────────┬──────────────────────────┘      │
│                            │                                   │
│  ┌─────────────────────────▼──────────────────────────┐      │
│  │  Procesamiento de Solicitud                         │      │
│  │  - conversation_history.py (Gestión de sesiones)     │      │
│  │  - destination_detector.py (Detección de destino)   │      │
│  │  - prompts/ (Construcción de prompts)               │      │
│  └─────────────────────────┬──────────────────────────┘      │
│                            │                                   │
│  ┌─────────────────────────▼──────────────────────────┐      │
│  │  Integración con Servicios Externos                 │      │
│  │  ┌──────────────────────────────────────────────┐  │      │
│  │  │  Google Gemini 2.0 Flash API                  │  │      │
│  │  │  - Generación de respuestas sobre viajes      │  │      │
│  │  └──────────────────────────────────────────────┘  │      │
│  │  ┌──────────────────────────────────────────────┐  │      │
│  │  │  OpenWeatherMap API                          │  │      │
│  │  │  - Información del clima                     │  │      │
│  │  │  - weather.py, weather_cache.py              │  │      │
│  │  └──────────────────────────────────────────────┘  │      │
│  │  ┌──────────────────────────────────────────────┐  │      │
│  │  │  Unsplash API                                │  │      │
│  │  │  - Fotos de destinos                         │  │      │
│  │  │  - unsplash.py                               │  │      │
│  │  └──────────────────────────────────────────────┘  │      │
│  └─────────────────────────┬──────────────────────────┘      │
│                            │                                   │
│  ┌─────────────────────────▼──────────────────────────┐      │
│  │  Procesamiento de Respuesta                         │      │
│  │  - Formateo de respuesta                            │      │
│  │  - Agregación de clima y fotos                      │      │
│  │  - Actualización de historial                      │      │
│  └─────────────────────────┬──────────────────────────┘      │
│                            │                                   │
│  ┌─────────────────────────▼──────────────────────────┐      │
│  │  Respuesta JSON                                     │      │
│  │  - TravelResponse (Pydantic model)                 │      │
│  └──────────────────────────────────────────────────────┘      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            │ JSON Response
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                      FRONTEND (React)                           │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Visualización de Resultados                         │    │
│  │  - Renderizado de respuesta                           │    │
│  │  - Visualización de clima                            │    │
│  │  - Galería de fotos                                  │    │
│  │  - Historial de conversación                         │    │
│  └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flujo de Datos

### Flujo Completo: Entrada del Usuario → Visualización

```
1. ENTRADA DEL USUARIO
   │
   │ Usuario escribe pregunta en el formulario o chat
   │ Ejemplo: "¿Qué lugares debo visitar en París durante 3 días?"
   │
   ▼
2. FRONTEND (React - App.js)
   │
   │ - Captura del evento onSubmit o onChange
   │ - Validación básica en el cliente
   │ - Preparación de datos:
   │   {
   │     question: "¿Qué lugares debo visitar en París durante 3 días?",
   │     destination: "París, Francia",
   │     session_id: "123e4567-e89b-12d3-a456-426614174000"
   │   }
   │ - Estado de carga: setLoading(true)
   │
   ▼
3. HTTP REQUEST (Axios)
   │
   │ POST http://localhost:8000/api/travel
   │ Headers: {
   │   Content-Type: application/json
   │ }
   │ Body: {
   │   question: "...",
   │   destination: "...",
   │   session_id: "..."
   │ }
   │
   ▼
4. BACKEND (FastAPI - main.py)
   │
   │ - Recepción de la petición en @app.post("/api/travel")
   │ - Extracción de IP del cliente para logging
   │
   ▼
5. VALIDACIÓN DEL BACKEND
   │
   │ ┌─────────────────────────────────────────┐
   │ │ validators.py                           │
   │ │ - validate_question()                   │
   │ │   • Longitud: 10-500 caracteres        │
   │ │   • Truncamiento automático si > 500    │
   │ │   • Sanitización de caracteres          │
   │ │                                         │
   │ │ security.py                             │
   │ │ - sanitize_user_input()                 │
   │ │   • Eliminación de caracteres de control│
   │ │   • Normalización Unicode               │
   │ │   • Normalización de espacios           │
   │ │                                         │
   │ │ - detect_prompt_injection()             │
   │ │   • Detección de patrones sospechosos  │
   │ │   • Validación de delimitadores         │
   │ │                                         │
   │ │ - validate_input_length()               │
   │ │   • Validación de longitud mínima/máxima│
   │ └─────────────────────────────────────────┘
   │
   │ Si la validación falla:
   │   → HTTPException 422 (Unprocessable Entity)
   │   → Respuesta de error JSON
   │   → Fin del flujo
   │
   │ Si la validación es exitosa:
   │   → Continuar al siguiente paso
   │
   ▼
6. GESTIÓN DE SESIÓN
   │
   │ ┌─────────────────────────────────────────┐
   │ │ conversation_history.py                 │
   │ │ - Verificar/crear session_id            │
   │ │ - Obtener historial de conversación    │
   │ │ - Detectar tipo de petición:            │
   │ │   • Formulario inicial                  │
   │ │   • Pregunta de chat                   │
   │ └─────────────────────────────────────────┘
   │
   ▼
7. DETECCIÓN DE DESTINO
   │
   │ ┌─────────────────────────────────────────┐
   │ │ destination_detector.py                  │
   │ │ - detect_destination_change()            │
   │ │   • Detectar cambio implícito           │
   │ │   • Detectar cambio explícito            │
   │ │   • Solicitar confirmación si es necesario│
   │ └─────────────────────────────────────────┘
   │
   ▼
8. CONSTRUCCIÓN DEL PROMPT
   │
   │ ┌─────────────────────────────────────────┐
   │ │ prompts/                                │
   │ │ - build_optimized_prompt()              │
   │ │   • Cargar template desde archivo      │
   │ │   • Formato estructurado (5 secciones)  │
   │ │   • Formato contextual (respuesta directa)│
   │ │   • Incluir historial de conversación  │
   │ │   • Incluir destino si está disponible  │
   │ └─────────────────────────────────────────┘
   │
   ▼
9. API DE GEMINI
   │
   │ ┌─────────────────────────────────────────┐
   │ │ google.generativeai                     │
   │ │ - genai.GenerativeModel("gemini-2.0-flash")│
   │ │ - model.generate_content(prompt)        │
   │ │                                         │
   │ │ Request a Google Gemini API:            │
   │ │ POST https://generativelanguage.googleapis.com/│
   │ │ Headers: {                               │
   │ │   x-goog-api-key: GEMINI_API_KEY        │
   │ │ }                                        │
   │ │ Body: {                                  │
   │ │   contents: [{                          │
   │ │     parts: [{ text: prompt }]           │
   │ │   }]                                     │
   │ │ }                                        │
   │ └─────────────────────────────────────────┘
   │
   │ Respuesta de Gemini:
   │ {
   │   candidates: [{
   │     content: {
   │       parts: [{
   │         text: "Para 3 días en París..."
   │       }]
   │     }
   │   }]
   │ }
   │
   ▼
10. PROCESAMIENTO DE RESPUESTA
    │
    │ ┌─────────────────────────────────────────┐
    │ │ main.py - plan_travel()                    │
    │ │ - Extraer texto de la respuesta           │
    │ │ - Obtener clima (si hay destino):         │
    │ │   • weather.py                            │
    │ │   • OpenWeatherMap API                    │
    │ │   • weather_cache.py (cache)              │
    │ │                                           │
    │ │ - Obtener fotos (si hay destino):         │
    │ │   • unsplash.py                           │
    │ │   • Unsplash API                         │
    │ │                                           │
    │ │ - Actualizar historial:                   │
    │ │   • conversation_history.add_message()    │
    │ │                                           │
    │ │ - Construir TravelResponse:                │
    │ │   {                                       │
    │ │     answer: "...",                        │
    │ │     weather: "...",                      │
    │ │     photos: [...],                       │
    │ │     session_id: "...",                    │
    │ │     response_format: "structured"        │
    │ │   }                                       │
    │ └─────────────────────────────────────────┘
    │
    ▼
11. HTTP RESPONSE (JSON)
    │
    │ Status: 200 OK
    │ Headers: {
    │   Content-Type: application/json
    │ }
    │ Body: {
    │   answer: "Para 3 días en París...",
    │   weather: "Temperatura actual: 15°C...",
    │   photos: [
    │     {
    │       url: "https://images.unsplash.com/...",
    │       description: "Torre Eiffel...",
    │       photographer: "John Doe"
    │     }
    │   ],
    │   session_id: "123e4567-e89b-12d3-a456-426614174000",
    │   response_format: "structured"
    │ }
    │
    ▼
12. FRONTEND (React - App.js)
    │
    │ - Recepción de la respuesta en axios
    │ - Actualización de estado:
    │   • setResponse(result.data.answer)
    │   • setWeather(result.data.weather)
    │   • setPhotos(result.data.photos)
    │   • setSessionId(result.data.session_id)
    │ - Actualización de historial de chat
    │ - setLoading(false)
    │
    ▼
13. VISUALIZACIÓN PARA EL USUARIO
    │
    │ ┌─────────────────────────────────────────┐
    │ │ Renderizado React                       │
    │ │ - Mostrar respuesta en el chat           │
    │ │ - Mostrar información del clima          │
    │ │ - Mostrar galería de fotos              │
    │ │ - Actualizar historial de conversación  │
    │ │ - Scroll automático al nuevo mensaje    │
    │ └─────────────────────────────────────────┘
    │
    ▼
    USUARIO VE LA RESPUESTA
```

### Flujo de Validación Detallado

```
ENTRADA DEL USUARIO
    │
    │ question: "¿Qué lugares debo visitar en París?"
    │
    ▼
VALIDACIÓN EN FRONTEND (Básica)
    │
    │ - Verificar que question no esté vacío
    │ - Verificar que destination tenga formato válido
    │
    ▼
ENVÍO HTTP REQUEST
    │
    ▼
VALIDACIÓN EN BACKEND (Completa)
    │
    ├─► Pydantic Model (TravelQuery)
    │   │
    │   ├─► @field_validator('question')
    │   │   │
    │   │   └─► validate_question()
    │   │       │
    │   │       ├─► validate_input_length()
    │   │       │   • Mínimo: 10 caracteres
    │   │       │   • Máximo: 500 caracteres
    │   │       │   • Error 400 si no cumple
    │   │       │
    │   │       ├─► sanitize_user_input()
    │   │       │   • Eliminar caracteres de control
    │   │       │   • Normalizar Unicode (NFD → NFC)
    │   │       │   • Normalizar espacios
    │   │       │   • Truncar a 500 caracteres si excede
    │   │       │
    │   │       └─► detect_prompt_injection()
    │   │           • Detectar patrones sospechosos
    │   │           • Validar delimitadores
    │   │           • Error si detecta inyección
    │   │
    │   ├─► @field_validator('destination')
    │   │   │
    │   │   └─► validate_destination()
    │   │       • Validar formato "Ciudad, País"
    │   │       • Validar longitud (3-200 caracteres)
    │   │       • Validar caracteres permitidos
    │   │
    │   └─► @field_validator('session_id')
    │       │
    │       └─► validate_session_id()
    │           • Validar formato UUID
    │
    ▼
SI VALIDACIÓN FALLA
    │
    └─► HTTPException 422
        {
          "detail": "Mensaje de error descriptivo"
        }
        │
        └─► Frontend muestra error al usuario
            │
            └─► FIN DEL FLUJO

SI VALIDACIÓN EXITOSA
    │
    └─► Continuar con procesamiento
        │
        └─► Llamada a Gemini API
```

---

## Componentes Principales

### Frontend (React)

#### App.js
- **Responsabilidad**: Componente principal de la aplicación
- **Funcionalidades**:
  - Gestión de estado global (useState, useRef)
  - Formulario de búsqueda de destinos
  - Chat interactivo
  - Visualización de respuestas, clima y fotos
  - Gestión de sesiones y historial
  - Favoritos y descarga de PDFs

#### Axios Client
- **Responsabilidad**: Cliente HTTP para comunicación con el backend
- **Configuración**: `API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'`
- **Endpoints utilizados**:
  - `POST /api/travel`
  - `GET /api/health`
  - `GET /api/destinations/popular`
  - `POST /api/destinations/search`
  - `POST /api/realtime-info`
  - `GET /api/itinerary/pdf`

### Backend (FastAPI)

#### main.py
- **Responsabilidad**: Punto de entrada de la API
- **Funcionalidades**:
  - Definición de endpoints REST
  - Configuración de CORS
  - Manejo de excepciones globales
  - Inicialización de servicios externos

#### validators.py
- **Responsabilidad**: Validación de datos de entrada
- **Funciones principales**:
  - `validate_question()`: Validación de preguntas (10-500 caracteres)
  - `validate_destination()`: Validación de destinos
  - `validate_search_query()`: Validación de búsquedas
  - `validate_session_id()`: Validación de UUIDs

#### security.py
- **Responsabilidad**: Seguridad y detección de ataques
- **Funciones principales**:
  - `sanitize_user_input()`: Sanitización de entrada
  - `detect_prompt_injection()`: Detección de prompt injection
  - `validate_input_length()`: Validación de longitud

#### conversation_history.py
- **Responsabilidad**: Gestión de historial de conversaciones
- **Funcionalidades**:
  - Creación de sesiones
  - Almacenamiento de mensajes
  - Obtención de contexto para prompts
  - Estadísticas de sesiones

#### destination_detector.py
- **Responsabilidad**: Detección de cambios de destino
- **Funcionalidades**:
  - Detección de cambios implícitos
  - Detección de cambios explícitos
  - Interpretación de confirmaciones

#### weather.py
- **Responsabilidad**: Integración con OpenWeatherMap
- **Funcionalidades**:
  - Obtención de datos del clima
  - Parsing de destinos a códigos ISO
  - Formateo de mensajes de clima
  - Cache de datos

#### unsplash.py
- **Responsabilidad**: Integración con Unsplash API
- **Funcionalidades**:
  - Búsqueda de fotos por destino
  - Formateo de datos de fotos
  - Manejo de errores

#### realtime_info.py
- **Responsabilidad**: Información en tiempo real
- **Funcionalidades**:
  - Tipo de cambio de moneda
  - Diferencia horaria
  - Temperatura actual

#### pdf_generator.py
- **Responsabilidad**: Generación de PDFs
- **Funcionalidades**:
  - Creación de itinerarios en PDF
  - Inclusión de fotos y clima
  - Formateo profesional

---

## Comunicación entre Componentes

### Protocolo HTTP/JSON

#### Request Format
```json
{
  "question": "string (10-500 caracteres)",
  "destination": "string (opcional, formato: 'Ciudad, País')",
  "session_id": "string (opcional, UUID)"
}
```

#### Response Format
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

### Endpoints Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/travel` | Procesar pregunta sobre viajes |
| GET | `/api/health` | Health check del servidor |
| GET | `/api/destinations/popular` | Obtener destinos populares |
| POST | `/api/destinations/search` | Buscar destinos |
| POST | `/api/travel/confirm-destination` | Confirmar cambio de destino |
| GET | `/api/itinerary/pdf` | Generar PDF de itinerario |
| POST | `/api/realtime-info` | Información en tiempo real |
| POST | `/api/conversation/create-session` | Crear sesión de conversación |
| POST | `/api/conversation/history` | Obtener historial |
| POST | `/api/conversation/clear` | Limpiar historial |

### Integración con Servicios Externos

#### Google Gemini 2.0 Flash
- **Protocolo**: HTTPS REST API
- **Autenticación**: API Key en header `x-goog-api-key`
- **Modelo**: `gemini-2.0-flash` (gratuito)
- **Uso**: Generación de respuestas sobre viajes

#### OpenWeatherMap
- **Protocolo**: HTTPS REST API
- **Autenticación**: API Key en query parameter
- **Uso**: Información del clima en tiempo real
- **Cache**: Implementado en `weather_cache.py`

#### Unsplash
- **Protocolo**: HTTPS REST API
- **Autenticación**: API Key en header `Authorization`
- **Uso**: Fotos de alta calidad de destinos

---

## Resumen de Tecnologías

### Stack Tecnológico Completo

**Frontend:**
- React 18.2.0 (JavaScript)
- Axios 1.6.0 (HTTP Client)
- Lucide React 0.554.0 (Iconos)
- Tailwind CSS 4.1.17 (Estilos)

**Backend:**
- FastAPI 0.104.1 (Python)
- Uvicorn 0.24.0 (ASGI Server)
- Pydantic 2.5.0 (Validación)
- Google Generative AI 0.3.2 (Gemini SDK)

**IA:**
- Google Gemini 2.0 Flash (Modelo de IA)

**Comunicación:**
- HTTP/HTTPS (Protocolo)
- JSON (Formato de datos)
- REST (Arquitectura de API)

**Servicios Externos:**
- OpenWeatherMap API (Clima)
- Unsplash API (Fotos)

---

**Última actualización**: 2024-01-15

