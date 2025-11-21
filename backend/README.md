# ViajeIA Backend

Backend API para ViajeIA construido con FastAPI e integrado con Google Gemini.

## Instalación

1. Crea un entorno virtual:
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

2. Instala las dependencias:
```bash
pip install -r requirements.txt
```

3. Configura la API key de Gemini como variable de entorno:
   
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
   
   **Verificar que está configurada:**
   ```bash
   echo $GEMINI_API_KEY  # Linux/Mac
   $env:GEMINI_API_KEY   # Windows PowerShell
   ```
   
   ⚠️ **IMPORTANTE:** El proyecto usa SOLO variables de entorno del sistema. NO se usan archivos `.env` por seguridad.

## Ejecución

Para ejecutar el servidor en modo desarrollo:

```bash
uvicorn main:app --reload --port 8000
```

El servidor estará disponible en:
- API: http://localhost:8000
- Documentación interactiva: http://localhost:8000/docs
- Documentación alternativa: http://localhost:8000/redoc

## Endpoints

- `GET /`: Verificación de estado
- `GET /api/health`: Health check
- `POST /api/travel`: Procesar pregunta sobre viajes usando Google Gemini
  - Body: `{"question": "tu pregunta aquí"}`
  - Response: `{"answer": "respuesta del asistente generada por Gemini"}`

## Integración con Gemini

El backend está integrado con Google Gemini para generar respuestas inteligentes sobre viajes.

- Se usa el modelo `gemini-2.0-flash` de Google (rápido y eficiente)
- La API key se configura mediante variables de entorno del sistema
- NO se usan archivos `.env` por seguridad
- El sistema está diseñado para ser simple y fácil de usar

## Próximos Pasos

- ✅ Integración con Google Gemini
- Persistencia de conversaciones
- Autenticación de usuarios
- Cache de respuestas
- Mejoras en el prompt para respuestas más personalizadas

