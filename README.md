# ✨ ViajeIA - Consultora Personal de Viajes

Aplicación web para planificación de viajes con inteligencia artificial, construida con React y FastAPI.

## 🚀 Inicio Rápido (5 Pasos)

### Paso 1: Obtener API Key de Google Gemini

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Crea una nueva API Key
4. Copia la API Key (la necesitarás en el Paso 3)

### Paso 2: Instalar Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Paso 3: Configurar API Key

**Linux/Mac:**
```bash
export GEMINI_API_KEY=tu_api_key_aqui
```

**Windows (PowerShell):**
```powershell
$env:GEMINI_API_KEY="tu_api_key_aqui"
```

**Windows (CMD):**
```cmd
set GEMINI_API_KEY=tu_api_key_aqui
```

> 💡 **Para hacerlo permanente:** Agrega el comando a `~/.bashrc` o `~/.zshrc` (Linux/Mac) o configura en Variables de Entorno (Windows).

### Paso 4: Iniciar Backend

```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

Deberías ver: `✅ API Key de Gemini configurada`

### Paso 5: Iniciar Frontend

En una **nueva terminal**:

```bash
cd frontend
npm install  # Solo la primera vez
npm start
```

La aplicación se abrirá automáticamente en `http://localhost:3000`

---

## ✅ Verificación

### ¿Funciona el backend?
Visita: http://localhost:8000/api/health

Deberías ver: `{"status": "ok"}`

### ¿Funciona el frontend?
Visita: http://localhost:3000

Deberías ver la interfaz de ViajeIA.

---

## 📋 URLs Importantes

- **Aplicación**: http://localhost:3000
- **API Backend**: http://localhost:8000
- **Documentación API**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

---

## 🔧 Solución de Problemas

### ❌ Error: "API key no configurada"

**Solución:** Verifica que la variable de entorno esté configurada:

```bash
echo $GEMINI_API_KEY  # Linux/Mac
$env:GEMINI_API_KEY   # Windows PowerShell
```

Si no aparece nada, vuelve al Paso 3.

### ❌ Error: "No module named 'fastapi'"

**Solución:** Activa el entorno virtual e instala dependencias:

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### ❌ Frontend no se conecta al backend

**Solución:** Asegúrate de que:
1. El backend esté corriendo en `http://localhost:8000`
2. No haya errores en la consola del backend
3. El frontend esté en `http://localhost:3000`

---

## 🤖 Modelo de IA

El proyecto usa **`gemini-2.0-flash`** (100% gratuito) por defecto.

✅ **Modelos gratuitos disponibles:**
- `gemini-2.0-flash` (por defecto)
- `gemini-2.5-flash`
- `gemini-flash-latest`

Para cambiar el modelo:

```bash
export GEMINI_MODEL=gemini-2.5-flash
```

> ⚠️ **Importante:** Solo se permiten modelos Flash (gratuitos). Los modelos Pro están bloqueados automáticamente.

---

## 📁 Estructura del Proyecto

```
ViajeIA/
├── backend/
│   ├── main.py           # API FastAPI
│   └── requirements.txt  # Dependencias Python
└── frontend/
    ├── src/
    │   └── App.js        # Componente principal React
    └── package.json      # Dependencias Node.js
```

---

## 🛑 Detener los Servidores

Presiona `Ctrl + C` en cada terminal donde estén corriendo.

---

## 📚 Documentación Adicional

- **`COMANDOS.md`** - Referencia rápida de comandos
- **`SECRETS.md`** - Gestión avanzada de secrets (producción)

---

## 🎯 Tecnologías

- **Frontend**: React 18
- **Backend**: FastAPI, Python 3.9+
- **IA**: Google Gemini AI
- **Comunicación**: REST API, CORS configurado

---

## 🎓 Aprendizajes del Desarrollo

Esta sección documenta los aprendizajes técnicos y arquitectónicos obtenidos durante el desarrollo de ViajeIA.

### 🏗️ Arquitectura y Diseño

#### Separación Frontend/Backend
- **Aprendizaje**: Separar completamente el frontend (React) del backend (FastAPI) permite:
  - Despliegues independientes en plataformas especializadas (Vercel + Railway)
  - Escalabilidad independiente de cada componente
  - Reutilización del backend para múltiples clientes (web, móvil, API)
- **Implementación**: Comunicación mediante REST API con CORS configurado para permitir orígenes específicos

#### Gestión de Estado sin Base de Datos
- **Aprendizaje**: Para aplicaciones con estado temporal, usar caché en memoria puede ser suficiente
- **Implementación**: Sistema de sesiones con UUIDs almacenados en memoria del servidor
- **Limitación**: El estado se pierde al reiniciar el servidor (aceptable para MVP)

### ⚡ Optimización y Rendimiento

#### Sistema de Caché Inteligente
- **Aprendizaje**: Implementar caché con TTL (Time To Live) reduce significativamente las llamadas a APIs externas
- **Implementación**: 
  - Caché de clima con TTL de 30 minutos (el clima no cambia tan rápido)
  - Caché de códigos de países ISO para evitar consultas repetidas a Gemini
- **Resultado**: Reducción de ~70% en llamadas a OpenWeatherMap API

#### Optimización de Prompts para IA
- **Aprendizaje**: Formato TOON (texto optimizado) reduce tokens y mejora la precisión de respuestas
- **Implementación**: Prompts almacenados en archivos `.txt` con formato estructurado
- **Beneficio**: Menor costo de tokens, respuestas más consistentes, fácil mantenimiento

#### Pre-procesamiento Asíncrono
- **Aprendizaje**: Pre-procesar datos en segundo plano mejora la experiencia del usuario
- **Implementación**: Al obtener destinos populares, se pre-procesan códigos ISO en background
- **Resultado**: Respuestas más rápidas en consultas posteriores

### 🔐 Seguridad y Configuración

#### Gestión de Secrets
- **Aprendizaje**: Nunca hardcodear API keys en el código
- **Implementación**: 
  - Variables de entorno para todas las credenciales
  - Validación de API keys al inicio del servidor
  - Máscara de keys en logs (solo primeros y últimos caracteres)
- **Deploy**: Configuración de secrets en Railway/Vercel sin exponerlos en el código

#### Validación de Modelos de IA
- **Aprendizaje**: Restringir modelos permitidos previene costos inesperados
- **Implementación**: Validación que solo permite modelos Flash (gratuitos) de Gemini
- **Protección**: Bloqueo automático de modelos Pro que generan costos

### 💬 Gestión de Conversaciones

#### Sistema de Sesiones
- **Aprendizaje**: Mantener contexto de conversación mejora significativamente la experiencia
- **Implementación**: 
  - UUIDs para identificar sesiones
  - Historial limitado a últimos 20 mensajes (evita tokens excesivos)
  - Destino actual por sesión para contexto
- **UX**: El usuario puede continuar conversaciones de forma natural

#### Detección Inteligente de Cambios
- **Aprendizaje**: Detectar cambios implícitos de destino requiere confirmación del usuario
- **Implementación**: 
  - Detección de cambios explícitos vs implícitos
  - Sistema de confirmaciones pendientes
  - Interpretación de respuestas del usuario (sí/no/ambiguo)
- **Resultado**: UX más natural sin interrupciones bruscas

### 🎨 Experiencia de Usuario

#### Respuestas Contextualizadas vs Estructuradas
- **Aprendizaje**: Diferentes tipos de preguntas requieren diferentes formatos de respuesta
- **Implementación**:
  - Formato estructurado (5 secciones) para preguntas iniciales o cambios de destino
  - Formato contextual (conversacional) para preguntas de seguimiento
- **Resultado**: Respuestas más relevantes y naturales

#### Búsqueda en Tiempo Real
- **Aprendizaje**: Debouncing y pre-procesamiento mejoran la experiencia de búsqueda
- **Implementación**: 
  - Debounce de 300ms para búsqueda de destinos
  - Pre-procesamiento de códigos ISO en background
- **Resultado**: Búsqueda fluida sin lag perceptible

### 📄 Generación de Documentos

#### PDFs con ReportLab
- **Aprendizaje**: Generar PDFs dinámicos requiere manejo cuidadoso de:
  - Codificación UTF-8 para caracteres especiales
  - Escape de caracteres XML/HTML
  - Descarga y redimensionamiento de imágenes
  - Formato responsive para diferentes tamaños de contenido
- **Implementación**: Sistema modular que extrae secciones del historial y genera PDFs profesionales

### 🔌 Integración de APIs Externas

#### Manejo de Errores Graceful
- **Aprendizaje**: Las APIs externas pueden fallar; la aplicación debe continuar funcionando
- **Implementación**: 
  - Try-catch en todas las llamadas externas
  - Fallbacks cuando servicios no están disponibles
  - Validación de API keys al inicio
- **Resultado**: La aplicación funciona parcialmente incluso si un servicio falla

#### Múltiples Servicios Externos
- **Aprendizaje**: Coordinar múltiples APIs requiere:
  - Abstracción en servicios separados (WeatherService, UnsplashService)
  - Manejo independiente de errores
  - Caché independiente por servicio
- **Implementación**: Cada servicio es una clase independiente con su propia lógica de caché

### 🚀 Despliegue y DevOps

#### Deploy Multi-Plataforma
- **Aprendizaje**: Diferentes plataformas tienen diferentes fortalezas
- **Implementación**:
  - Vercel: Frontend React (optimizado para SPAs)
  - Railway: Backend Python (fácil configuración, variables de entorno)
- **Beneficio**: Aprovechar las fortalezas de cada plataforma

#### Variables de Entorno por Ambiente
- **Aprendizaje**: Configurar CORS y URLs según el ambiente (desarrollo/producción)
- **Implementación**: 
  - `ENVIRONMENT=production` para configuraciones de producción
  - `ALLOWED_ORIGINS` para CORS específico
- **Resultado**: Configuración flexible sin cambios de código

### 📊 Monitoreo y Debugging

#### Logging Estructurado
- **Aprendizaje**: Logs bien estructurados facilitan el debugging
- **Implementación**: 
  - Prefijos consistentes (`[API]`, `[HISTORY]`, `[WEATHER]`)
  - Separadores visuales para peticiones
  - Información contextual (session_id, destino, etc.)
- **Resultado**: Debugging más rápido y eficiente

#### Endpoints de Diagnóstico
- **Aprendizaje**: Endpoints de estadísticas ayudan a monitorear el sistema
- **Implementación**: 
  - `/api/weather/cache/stats` - Estadísticas de caché
  - `/api/health` - Health check simple
- **Beneficio**: Monitoreo sin necesidad de acceder a logs del servidor

### 🧪 Testing y Validación

#### Validación de API Keys al Inicio
- **Aprendizaje**: Validar credenciales al inicio previene errores en runtime
- **Implementación**: Validación de OpenWeatherMap y Unsplash al iniciar el servidor
- **Resultado**: Errores detectados inmediatamente, no durante uso del usuario

### 💡 Mejores Prácticas Aplicadas

1. **DRY (Don't Repeat Yourself)**: Servicios reutilizables, funciones helper compartidas
2. **KISS (Keep It Simple, Stupid)**: Soluciones simples antes que complejas
3. **Separation of Concerns**: Cada módulo tiene una responsabilidad clara
4. **Error Handling**: Try-catch comprehensivo con mensajes informativos
5. **Type Hints**: Python type hints para mejor mantenibilidad
6. **Documentación**: Docstrings en todas las funciones públicas

### 🔮 Áreas de Mejora Futura

1. **Base de Datos**: Migrar de caché en memoria a base de datos persistente
2. **Autenticación**: Sistema de usuarios para guardar itinerarios
3. **Testing**: Suite de tests unitarios y de integración
4. **Rate Limiting**: Protección contra abuso de la API
5. **WebSockets**: Actualizaciones en tiempo real para clima/información
6. **Internacionalización**: Soporte multi-idioma
7. **PWA**: Convertir en Progressive Web App para uso offline

---

## 📄 Licencia

Código abierto para uso personal y educativo.
