# ViajeIA Backend

Backend API para ViajeIA construido con FastAPI.

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
- `POST /api/travel`: Procesar pregunta sobre viajes
  - Body: `{"question": "tu pregunta aquí"}`
  - Response: `{"answer": "respuesta del asistente"}`

## Próximos Pasos

- Integración con modelos de IA (GPT, Claude, etc.)
- Persistencia de conversaciones
- Autenticación de usuarios
- Cache de respuestas

