# Backend - ViajeIA

API REST construida con FastAPI e integrada con Google Gemini.

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configurar API Key
```bash
export GEMINI_API_KEY=tu_api_key_aqui  # Linux/Mac
# Ver README.md principal para más opciones
```

### 3. Ejecutar servidor
```bash
uvicorn main:app --reload --port 8000
```

El servidor estará en: http://localhost:8000

## 📋 Endpoints

- `GET /` - Estado del servidor
- `GET /api/health` - Health check
- `POST /api/travel` - Procesar pregunta de viajes
  - Body: `{"question": "tu pregunta"}`
  - Response: `{"answer": "respuesta generada"}`

## 📚 Documentación API

- Interactiva: http://localhost:8000/docs
- Alternativa: http://localhost:8000/redoc

## 🔧 Configuración

- **API Key**: Variable de entorno `GEMINI_API_KEY` (requerida)
- **Modelo**: Variable de entorno `GEMINI_MODEL` (opcional, por defecto: `gemini-2.0-flash`)

## 📖 Más Información

Ver `../README.md` para documentación completa del proyecto.
