from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import google.generativeai as genai
import os
from prompts import load_prompt
from weather import WeatherService, extract_destination_from_question, parse_form_destination
from unsplash import UnsplashService
from realtime_info import RealtimeInfoService


def parse_destinations_simple(response_text: str) -> list[str]:
    """
    Parsea una lista simple de destinos desde la respuesta de Gemini.
    Extrae líneas que contienen destinos en formato "Ciudad, País".
    
    Args:
        response_text: Texto de respuesta de Gemini
        
    Returns:
        Lista de destinos parseados
    """
    if not response_text:
        return []
    
    destinations = []
    lines = response_text.strip().split('\n')
    
    for line in lines:
        line = line.strip()
        # Filtrar líneas vacías, comentarios y explicaciones
        if not line or line.startswith('#') or line.startswith('//'):
            continue
        # Filtrar líneas que parecen explicaciones (muy cortas o con puntuación final)
        if len(line) < 3 or (line.endswith('.') and len(line) < 20):
            continue
        # Filtrar líneas que contienen palabras clave de explicación
        if any(word in line.lower() for word in ['ejemplo', 'formato', 'instrucción', 'responde']):
            continue
        # Si la línea contiene una coma (formato "Ciudad, País"), agregarla
        if ',' in line:
            destinations.append(line)
    
    return destinations

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

# Inicializar servicio de clima
weather_service = WeatherService()
if weather_service.is_available():
    masked_weather_key = f"{weather_service.api_key[:10]}...{weather_service.api_key[-4:]}" if len(weather_service.api_key) > 14 else "***"
    print(f"✅ API Key de OpenWeatherMap configurada ({masked_weather_key})")
    
    # Validar la API key al inicio
    print("🔍 Validando API key de OpenWeatherMap...")
    is_valid, error_msg = weather_service.validate_api_key()
    if is_valid:
        print("✅ API key de OpenWeatherMap válida y funcionando")
    else:
        print(f"❌ API key de OpenWeatherMap no válida: {error_msg}")
        print("   El clima no estará disponible hasta que corrijas la API key")
        print("   Verifica en: https://home.openweathermap.org/api_keys")
else:
    print("⚠️  ADVERTENCIA: OPENWEATHER_API_KEY no encontrada")
    print("   El clima no estará disponible. Configura la variable de entorno OPENWEATHER_API_KEY")
    print("   Ver SECRETS.md para más detalles")

# Inicializar servicio de Unsplash
unsplash_service = UnsplashService()
if unsplash_service.is_available():
    masked_unsplash_key = f"{unsplash_service.api_key[:10]}...{unsplash_service.api_key[-4:]}" if len(unsplash_service.api_key) > 14 else "***"
    print(f"✅ API Key de Unsplash configurada ({masked_unsplash_key})")
    
    # Validar la API key al inicio
    print("🔍 Validando API key de Unsplash...")
    is_valid, error_msg = unsplash_service.validate_api_key()
    if is_valid:
        print("✅ API key de Unsplash válida y funcionando")
    else:
        print(f"❌ API key de Unsplash no válida: {error_msg}")
        print("   Las fotos no estarán disponibles hasta que corrijas la API key")
        print("   Verifica en: https://unsplash.com/developers")
else:
    print("⚠️  ADVERTENCIA: UNSPLASH_API_KEY no encontrada")
    print("   Las fotos no estarán disponibles. Configura la variable de entorno UNSPLASH_API_KEY")
    print("   Ver SECRETS.md para más detalles")

# Inicializar servicio de información en tiempo real
realtime_info_service = RealtimeInfoService()
print("✅ Servicio de información en tiempo real inicializado")

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
    destination: Optional[str] = None  # Destino del formulario (formato: "Ciudad, País")


class TravelResponse(BaseModel):
    answer: str
    weather: Optional[str] = None
    photos: Optional[List[Dict[str, Any]]] = None


class DestinationsResponse(BaseModel):
    destinations: list[str]


class DestinationSearchQuery(BaseModel):
    query: str


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
        
        # Cargar prompt optimizado en formato TOON desde archivo
        prompt = load_prompt("travel_planning", question=query.question)

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
        # Gemini puede devolver el texto de diferentes formas
        response_text = None
        if hasattr(response, 'text') and response.text:
            response_text = response.text
        elif hasattr(response, 'candidates') and response.candidates:
            # Intentar obtener el texto de los candidatos
            if len(response.candidates) > 0:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    parts = candidate.content.parts
                    if parts and len(parts) > 0:
                        response_text = parts[0].text if hasattr(parts[0], 'text') else str(parts[0])
        
        if not response_text:
            raise HTTPException(
                status_code=500,
                detail="La respuesta de Gemini está vacía o en formato inesperado"
            )
        
        # Intentar obtener el clima y fotos del destino si está disponible
        weather_message = None
        photos = None
        
        # Prioridad 1: Usar destino del formulario si está disponible
        destination = None
        destination_string = None
        
        if query.destination:
            destination = parse_form_destination(query.destination)
            if destination:
                destination_string = query.destination
                print(f"📍 Usando destino del formulario: {query.destination}")
        
        # Prioridad 2: Extraer destino del texto de la pregunta si no hay destino del formulario
        if not destination:
            destination = extract_destination_from_question(query.question)
            if destination:
                city, country = destination
                destination_string = f"{city}, {country}"
                print(f"📍 Destino extraído del texto de la pregunta: {destination_string}")
        
        if destination_string:
            # Obtener clima
            if weather_service.is_available():
                city, country = destination if destination else (None, None)
                if city and country:
                    print(f"🌤️ Intentando obtener clima para: {city}, {country}")
                    weather_data = weather_service.get_weather(city, country)
                    if weather_data:
                        weather_message = weather_service.format_weather_message(weather_data)
                        print(f"✅ Clima obtenido exitosamente")
                    else:
                        print(f"❌ No se pudo obtener el clima para {city}, {country}")
            
            # Obtener fotos
            if unsplash_service.is_available():
                print(f"📸 Intentando obtener fotos para: {destination_string}")
                photos = unsplash_service.get_photos(destination_string, count=3)
                if photos:
                    print(f"✅ {len(photos)} fotos obtenidas exitosamente")
                else:
                    print(f"❌ No se pudo obtener fotos para {destination_string}")
            else:
                print(f"⚠️ Servicio de fotos no disponible (API key no configurada)")
        else:
            print(f"⚠️ No se pudo obtener el destino (ni del formulario ni del texto)")
            if not weather_service.is_available():
                print(f"⚠️ Servicio de clima no disponible (API key no configurada)")
        
        return TravelResponse(answer=response_text, weather=weather_message, photos=photos)
        
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


@app.get("/api/destinations/popular", response_model=DestinationsResponse)
async def get_popular_destinations():
    """
    Endpoint para obtener los 5 destinos más populares/recomendados usando Gemini
    """
    try:
        # Verificar que la API key esté configurada
        if not GEMINI_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="API key de Gemini no configurada. Por favor, configura la variable de entorno GEMINI_API_KEY. Ver SECRETS.md para instrucciones."
            )
        
        # Cargar prompt optimizado en formato TOON desde archivo
        prompt = load_prompt("popular_destinations")

        # Inicializar el modelo de Gemini
        GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        
        # Validar que solo se usen modelos gratuitos (Flash)
        model_lower = GEMINI_MODEL.lower()
        is_free_model = (
            "flash" in model_lower or 
            model_lower == "gemini-pro-latest" or
            model_lower == "models/gemini-pro-latest"
        )
        
        if not is_free_model:
            raise HTTPException(
                status_code=400,
                detail=f"❌ Modelo '{GEMINI_MODEL}' NO permitido. Solo se permiten modelos GRATUITOS de Gemini."
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
        
        response_text = None
        if hasattr(response, 'text') and response.text:
            response_text = response.text
        elif hasattr(response, 'candidates') and response.candidates:
            if len(response.candidates) > 0:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    parts = candidate.content.parts
                    if parts and len(parts) > 0:
                        response_text = parts[0].text if hasattr(parts[0], 'text') else str(parts[0])
        
        if not response_text:
            raise HTTPException(
                status_code=500,
                detail="La respuesta de Gemini está vacía o en formato inesperado"
            )
        
        # Parsear respuesta usando parser simple
        destinations = parse_destinations_simple(response_text)
        
        # Validar y limitar a 5 destinos
        if destinations and len(destinations) > 0:
            destinations = destinations[:5]
            
            # Pre-procesar destinos para preparar información del clima
            # Esto parsea cada destino y obtiene códigos ISO usando Gemini (con cache)
            from weather import parse_form_destination
            
            for dest in destinations:
                try:
                    # Parsear destino (esto obtiene código ISO con Gemini si no está en cache)
                    parsed = parse_form_destination(dest)
                    if parsed:
                        city, country_code = parsed
                        print(f"✅ Destino popular pre-procesado para cache: {dest} → ({city}, {country_code})")
                except Exception as e:
                    # No fallar si hay error en pre-procesamiento, es solo optimización
                    print(f"⚠️ Error al pre-procesar destino popular {dest}: {e}")
            
            return DestinationsResponse(destinations=destinations)
        
        # Si falla el parseo, devolver destinos por defecto
        default_destinations = [
            "París, Francia",
            "Tokio, Japón",
            "Nueva York, Estados Unidos",
            "Bali, Indonesia",
            "Barcelona, España"
        ]
        
        # Pre-procesar destinos por defecto también
        from weather import parse_form_destination
        for dest in default_destinations:
            try:
                parsed = parse_form_destination(dest)
                if parsed:
                    city, country_code = parsed
                    print(f"✅ Destino por defecto pre-procesado para cache: {dest} → ({city}, {country_code})")
            except Exception as e:
                print(f"⚠️ Error al pre-procesar destino por defecto {dest}: {e}")
        
        return DestinationsResponse(destinations=default_destinations)
        
    except HTTPException:
        raise
    except Exception as e:
        error_type = type(e).__name__
        error_message = str(e) if str(e) else "Error desconocido"
        full_error = f"Error al obtener destinos populares ({error_type}): {error_message}"
        print(f"Error completo: {full_error}")
        import traceback
        traceback.print_exc()
        # En caso de error, devolver destinos por defecto
        default_destinations = [
            "París, Francia",
            "Tokio, Japón",
            "Nueva York, Estados Unidos",
            "Bali, Indonesia",
            "Barcelona, España"
        ]
        
        # Pre-procesar destinos por defecto también
        from weather import parse_form_destination
        for dest in default_destinations:
            try:
                parsed = parse_form_destination(dest)
                if parsed:
                    city, country_code = parsed
                    print(f"✅ Destino por defecto (error) pre-procesado para cache: {dest} → ({city}, {country_code})")
            except Exception as e:
                print(f"⚠️ Error al pre-procesar destino por defecto {dest}: {e}")
        
        return DestinationsResponse(destinations=default_destinations)


@app.post("/api/destinations/search", response_model=DestinationsResponse)
async def search_destinations(search_query: DestinationSearchQuery):
    """
    Endpoint para buscar destinos basado en lo que el usuario está escribiendo usando Gemini
    """
    try:
        # Verificar que la API key esté configurada
        if not GEMINI_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="API key de Gemini no configurada. Por favor, configura la variable de entorno GEMINI_API_KEY. Ver SECRETS.md para instrucciones."
            )
        
        # Si el query está vacío, devolver lista vacía
        if not search_query.query or not search_query.query.strip():
            return DestinationsResponse(destinations=[])
        
        query = search_query.query.strip()
        
        # Cargar prompt optimizado en formato TOON desde archivo
        prompt = load_prompt("search_destinations", query=query)

        # Inicializar el modelo de Gemini
        GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        
        # Validar que solo se usen modelos gratuitos (Flash)
        model_lower = GEMINI_MODEL.lower()
        is_free_model = (
            "flash" in model_lower or 
            model_lower == "gemini-pro-latest" or
            model_lower == "models/gemini-pro-latest"
        )
        
        if not is_free_model:
            raise HTTPException(
                status_code=400,
                detail=f"❌ Modelo '{GEMINI_MODEL}' NO permitido. Solo se permiten modelos GRATUITOS de Gemini."
            )
        
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        # Generar la respuesta
        response = model.generate_content(prompt)
        
        # Extraer el texto de la respuesta
        if not response:
            return DestinationsResponse(destinations=[])
        
        response_text = None
        if hasattr(response, 'text') and response.text:
            response_text = response.text
        elif hasattr(response, 'candidates') and response.candidates:
            if len(response.candidates) > 0:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    parts = candidate.content.parts
                    if parts and len(parts) > 0:
                        response_text = parts[0].text if hasattr(parts[0], 'text') else str(parts[0])
        
        if not response_text:
            return DestinationsResponse(destinations=[])
        
        # Parsear respuesta usando parser simple
        destinations = parse_destinations_simple(response_text)
        
        # Validar y limitar a 5 destinos
        if destinations and len(destinations) > 0:
            destinations = destinations[:5]
            
            # Pre-procesar destinos para preparar información del clima
            # Esto parsea cada destino y obtiene códigos ISO usando Gemini (con cache)
            # Como usa cache, es rápido y no bloquea significativamente la respuesta
            from weather import parse_form_destination
            
            for dest in destinations:
                try:
                    # Parsear destino (esto obtiene código ISO con Gemini si no está en cache)
                    # Si ya está en cache, es instantáneo
                    parsed = parse_form_destination(dest)
                    if parsed:
                        city, country_code = parsed
                        print(f"✅ Destino pre-procesado para cache: {dest} → ({city}, {country_code})")
                except Exception as e:
                    # No fallar si hay error en pre-procesamiento, es solo optimización
                    print(f"⚠️ Error al pre-procesar destino {dest}: {e}")
            
            return DestinationsResponse(destinations=destinations)
        
        # Si falla el parseo, devolver lista vacía
        return DestinationsResponse(destinations=[])
        
    except HTTPException:
        raise
    except Exception as e:
        error_type = type(e).__name__
        error_message = str(e) if str(e) else "Error desconocido"
        full_error = f"Error al buscar destinos ({error_type}): {error_message}"
        print(f"Error completo: {full_error}")
        import traceback
        traceback.print_exc()
        # En caso de error, devolver lista vacía
        return DestinationsResponse(destinations=[])


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/weather/cache/stats")
def get_weather_cache_stats():
    """
    Endpoint para obtener estadísticas del cache de clima.
    """
    if not weather_service.is_available():
        return {
            "error": "Servicio de clima no disponible",
            "cache_stats": None
        }
    
    stats = weather_service.cache.get_stats()
    return {
        "cache_stats": stats,
        "api_available": not weather_service.api_unavailable
    }


@app.post("/api/weather/cache/clear")
def clear_weather_cache():
    """
    Endpoint para limpiar el cache de clima.
    """
    if not weather_service.is_available():
        return {
            "error": "Servicio de clima no disponible",
            "cleared": False
        }
    
    weather_service.cache.clear()
    return {
        "message": "Cache limpiado exitosamente",
        "cleared": True
    }


@app.get("/api/weather/country-codes/stats")
def get_country_code_cache_stats():
    """
    Endpoint para obtener estadísticas del cache de códigos de países.
    """
    from weather import _country_code_cache
    stats = _country_code_cache.get_stats()
    return {
        "cache_stats": stats
    }


@app.post("/api/weather/country-codes/clear")
def clear_country_code_cache():
    """
    Endpoint para limpiar el cache de códigos de países.
    """
    from weather import _country_code_cache
    _country_code_cache.clear()
    return {
        "message": "Cache de códigos de países limpiado exitosamente",
        "cleared": True
    }


class RealtimeInfoQuery(BaseModel):
    destination: str  # Destino en formato "Ciudad, País"


@app.post("/api/realtime-info")
async def get_realtime_info(query: RealtimeInfoQuery):
    """
    Endpoint para obtener información en tiempo real de un destino:
    - Tipo de cambio de moneda
    - Diferencia horaria
    - Temperatura actual
    """
    try:
        if not query.destination or not query.destination.strip():
            raise HTTPException(
                status_code=400,
                detail="El destino es requerido"
            )
        
        info = realtime_info_service.get_realtime_info(query.destination)
        
        if not info:
            raise HTTPException(
                status_code=404,
                detail="No se pudo obtener información para el destino especificado"
            )
        
        return info
        
    except HTTPException:
        raise
    except Exception as e:
        error_type = type(e).__name__
        error_message = str(e) if str(e) else "Error desconocido"
        full_error = f"Error al obtener información en tiempo real ({error_type}): {error_message}"
        print(f"Error completo: {full_error}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=full_error)

