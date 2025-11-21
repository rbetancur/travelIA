from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import google.generativeai as genai
import os

app = FastAPI(title="ViajeIA API")

# Configurar la API key de Gemini desde variable de entorno del sistema
# IMPORTANTE: La API key debe estar configurada como variable de entorno
# NO se usa archivo .env para mayor seguridad
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("⚠️  ADVERTENCIA: GEMINI_API_KEY no encontrada en las variables de entorno")
    print("   Configura la variable de entorno antes de ejecutar el servidor:")
    print("   - Linux/Mac: export GEMINI_API_KEY=tu_api_key")
    print("   - Windows (PowerShell): $env:GEMINI_API_KEY=\"tu_api_key\"")
    print("   - Windows (CMD): set GEMINI_API_KEY=tu_api_key")
    print("   Ver SECRETS.md para más detalles")
else:
    # Solo mostrar confirmación, nunca la key completa por seguridad
    masked_key = f"{GEMINI_API_KEY[:10]}...{GEMINI_API_KEY[-4:]}" if len(GEMINI_API_KEY) > 14 else "***"
    print(f"✅ API Key de Gemini configurada ({masked_key})")
    genai.configure(api_key=GEMINI_API_KEY)

# Configurar CORS para permitir requests del frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React por defecto corre en puerto 3000
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TravelQuery(BaseModel):
    question: str


class TravelResponse(BaseModel):
    answer: str


@app.get("/")
def read_root():
    return {"message": "ViajeIA API is running"}


@app.post("/api/travel", response_model=TravelResponse)
async def plan_travel(query: TravelQuery):
    """
    Endpoint para procesar preguntas sobre viajes usando Google Gemini
    """
    try:
        # Verificar que la API key esté configurada
        if not GEMINI_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="API key de Gemini no configurada. Por favor, configura la variable de entorno GEMINI_API_KEY. Ver SECRETS.md para instrucciones."
            )
        
        # Crear el prompt para Gemini enfocado en viajes
        prompt = f"""Eres un asistente experto en viajes llamado ViajeIA. 
Ayuda al usuario con su pregunta sobre viajes de manera útil, clara y amigable.

Pregunta del usuario: {query.question}

Proporciona una respuesta útil y detallada sobre planificación de viajes."""

        # Inicializar el modelo de Gemini
        # IMPORTANTE: Solo usamos modelos GRATUITOS de Gemini (modelos Flash)
        # Los modelos Flash son gratuitos y no generan costos
        # NO usar modelos Pro (gemini-pro, gemini-2.5-pro, etc.) ya que son de pago
        
        # Modelo por defecto: gemini-2.0-flash (100% gratuito)
        GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        
        # Lista de modelos gratuitos permitidos
        FREE_MODELS = [
            "gemini-2.0-flash",
            "gemini-2.5-flash", 
            "gemini-2.0-flash-lite",
            "gemini-flash-latest",
            "gemini-pro-latest"  # Gratuito con límites
        ]
        
        # Validar que solo se usen modelos gratuitos (Flash)
        # Verificar que el nombre del modelo contiene "flash" o es "gemini-pro-latest"
        model_lower = GEMINI_MODEL.lower()
        is_free_model = (
            "flash" in model_lower or 
            model_lower == "gemini-pro-latest" or
            model_lower == "models/gemini-pro-latest"
        )
        
        if not is_free_model:
            raise HTTPException(
                status_code=400,
                detail=f"❌ Modelo '{GEMINI_MODEL}' NO permitido. Solo se permiten modelos GRATUITOS de Gemini. " +
                       f"Modelos permitidos: {', '.join(FREE_MODELS)}. " +
                       "Los modelos Pro (gemini-2.5-pro, gemini-2.0-pro) son de pago y NO están permitidos."
            )
        
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        # Generar la respuesta
        response = model.generate_content(prompt)
        
        # Extraer el texto de la respuesta
        if not response:
            raise HTTPException(
                status_code=500,
                detail="No se recibió respuesta de Gemini"
            )
        
        # Verificar que la respuesta tenga texto
        if not hasattr(response, 'text') or not response.text:
            raise HTTPException(
                status_code=500,
                detail="La respuesta de Gemini está vacía"
            )
        
        response_text = response.text
        
        return TravelResponse(answer=response_text)
        
    except HTTPException:
        # Re-lanzar excepciones HTTP directamente
        raise
    except Exception as e:
        # Manejo de errores más detallado
        error_type = type(e).__name__
        error_message = str(e) if str(e) else "Error desconocido"
        full_error = f"Error al procesar la solicitud ({error_type}): {error_message}"
        print(f"Error completo: {full_error}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=full_error)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}

