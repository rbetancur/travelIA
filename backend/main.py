# Aplicar workaround para Python 3.9 antes de importar otras dependencias
import _fix_importlib  # noqa: F401

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, field_validator, ValidationError
from typing import Optional, List, Dict, Any
import google.generativeai as genai
import os
import unicodedata
import re
from prompts import load_prompt, build_optimized_prompt
from weather import WeatherService, extract_destination_from_question, parse_form_destination
from unsplash import UnsplashService
from realtime_info import RealtimeInfoService
from conversation_history import conversation_history
from destination_detector import detect_destination_change, interpret_confirmation_response
from pdf_generator import create_pdf
from validators import validate_question, validate_destination, validate_search_query, validate_session_id


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
# En producción, permite orígenes desde variable de entorno o todos los orígenes
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
# Si está en producción (Railway, Vercel, etc.), permite todos los orígenes por defecto
if os.getenv("ENVIRONMENT") == "production":
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Type"],  # Exponer headers necesarios para descarga de archivos
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Maneja errores de validación de Pydantic y retorna respuestas seguras.
    No expone detalles internos que podrían ayudar a atacantes.
    """
    errors = exc.errors()
    error_messages = []
    
    for error in errors:
        field = ".".join(str(loc) for loc in error.get("loc", []))
        msg = error.get("msg", "Error de validación")
        
        # Detectar si es un intento de prompt injection
        if "contenido no permitido" in msg.lower() or "prompt injection" in msg.lower():
            print(f"⚠️ [SECURITY] Intento de prompt injection detectado en campo '{field}'")
            error_messages.append("La entrada contiene contenido no permitido")
        else:
            # Mensaje genérico para otros errores de validación
            if "longitud" in msg.lower() or "length" in msg.lower():
                error_messages.append(f"El campo '{field}' tiene una longitud inválida")
            elif "formato" in msg.lower() or "format" in msg.lower():
                error_messages.append(f"El campo '{field}' tiene un formato inválido")
            else:
                error_messages.append(f"Error en el campo '{field}'")
    
    # Retornar mensaje genérico sin exponer detalles
    return JSONResponse(
        status_code=400,
        content={
            "detail": error_messages[0] if error_messages else "Error de validación en los datos enviados"
        }
    )


@app.exception_handler(ValidationError)
async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
    """
    Maneja errores de validación de Pydantic en modelos.
    """
    errors = exc.errors()
    error_messages = []
    
    for error in errors:
        field = ".".join(str(loc) for loc in error.get("loc", []))
        msg = error.get("msg", "Error de validación")
        
        # Detectar si es un intento de prompt injection
        if "contenido no permitido" in msg.lower():
            print(f"⚠️ [SECURITY] Intento de prompt injection detectado en campo '{field}'")
            error_messages.append("La entrada contiene contenido no permitido")
        else:
            error_messages.append(f"Error en el campo '{field}': {msg}")
    
    return JSONResponse(
        status_code=400,
        content={
            "detail": error_messages[0] if error_messages else "Error de validación en los datos enviados"
        }
    )


class TravelQuery(BaseModel):
    question: str
    destination: Optional[str] = None  # Destino del formulario (formato: "Ciudad, País")
    session_id: Optional[str] = None  # ID de sesión para mantener historial
    
    @field_validator('question')
    @classmethod
    def validate_question_field(cls, v: str) -> str:
        return validate_question(v)
    
    @field_validator('destination')
    @classmethod
    def validate_destination_field(cls, v: Optional[str]) -> Optional[str]:
        return validate_destination(v)
    
    @field_validator('session_id')
    @classmethod
    def validate_session_id_field(cls, v: Optional[str]) -> Optional[str]:
        return validate_session_id(v)


class TravelResponse(BaseModel):
    answer: str
    weather: Optional[str] = None
    photos: Optional[List[Dict[str, Any]]] = None
    session_id: Optional[str] = None  # ID de sesión para mantener historial
    requires_confirmation: bool = False  # Indica si se requiere confirmación del usuario
    detected_destination: Optional[str] = None  # Destino detectado en la pregunta (si hay cambio)
    current_destination: Optional[str] = None  # Destino actual de la conversación
    response_format: str = "structured"  # "structured" o "contextual"


class DestinationsResponse(BaseModel):
    destinations: list[str]


class DestinationSearchQuery(BaseModel):
    query: str
    
    @field_validator('query')
    @classmethod
    def validate_query_field(cls, v: str) -> str:
        return validate_search_query(v)


class DestinationConfirmation(BaseModel):
    session_id: str
    new_destination: str
    confirmed: bool
    original_question: Optional[str] = None  # Para re-procesar si se confirma
    
    @field_validator('session_id')
    @classmethod
    def validate_session_id_field(cls, v: str) -> str:
        result = validate_session_id(v)
        if result is None:
            raise ValueError("El session ID es requerido")
        return result
    
    @field_validator('new_destination')
    @classmethod
    def validate_new_destination_field(cls, v: str) -> str:
        result = validate_destination(v)
        if result is None:
            raise ValueError("El destino es requerido")
        return result
    
    @field_validator('original_question')
    @classmethod
    def validate_original_question_field(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return validate_question(v)


@app.get("/")
def read_root():
    return {"message": "ViajeIA API is running"}


@app.get("/api/itinerary/pdf")
async def generate_itinerary_pdf(
    session_id: str,
    departure_date: Optional[str] = None,
    return_date: Optional[str] = None
):
    """
    Genera un PDF con el itinerario completo de la conversación.
    
    Args:
        session_id: ID de la sesión de conversación
        departure_date: Fecha de salida (opcional)
        return_date: Fecha de regreso (opcional)
        
    Returns:
        PDF file como respuesta HTTP
    """
    try:
        print(f"\n{'='*80}")
        print(f"📄 [API] Generando PDF de itinerario")
        print(f"🔑 [API] Session ID: {session_id}")
        
        # Obtener historial de conversación
        messages = conversation_history.get_history(session_id)
        if not messages:
            raise HTTPException(
                status_code=404,
                detail="No se encontró historial de conversación para esta sesión"
            )
        
        print(f"📚 [API] Historial encontrado: {len(messages)} mensajes")
        
        # Obtener destino actual
        current_destination = conversation_history.get_current_destination(session_id)
        if not current_destination:
            # Intentar extraer del historial
            current_destination = conversation_history.extract_last_destination(session_id)
            if not current_destination:
                current_destination = "Destino no especificado"
        
        print(f"📍 [API] Destino: {current_destination}")
        
        # Obtener fotos del destino (si están disponibles en el historial o necesitamos buscarlas)
        # Por ahora, intentaremos obtenerlas del último mensaje que las tenga
        photos = None
        for msg in reversed(messages):
            if msg.get('role') == 'assistant':
                # Las fotos normalmente vienen en las respuestas del backend
                # Por ahora, las obtendremos del servicio si es necesario
                pass
        
        # Si no hay fotos, intentar obtenerlas del servicio
        if not photos:
            from unsplash import UnsplashService
            unsplash_service = UnsplashService()
            if unsplash_service.is_available():
                photos = unsplash_service.get_photos(current_destination, count=6)
                if photos:
                    print(f"📸 [API] {len(photos)} fotos obtenidas para el PDF")
        
        # Generar PDF
        pdf_buffer = create_pdf(
            destination=current_destination,
            departure_date=departure_date,
            return_date=return_date,
            messages=messages,
            photos=photos
        )
        
        print(f"✅ [API] PDF generado exitosamente")
        print(f"{'='*80}\n")
        
        # Generar nombre de archivo limpio con el destino
        # Normalizar el nombre del destino: eliminar caracteres especiales y espacios
        
        # Normalizar caracteres unicode (quitar tildes, etc.)
        normalized = unicodedata.normalize('NFD', current_destination)
        # Eliminar diacríticos (tildes, acentos)
        cleaned = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
        # Reemplazar comas y espacios por guiones bajos
        cleaned = cleaned.replace(', ', '_').replace(',', '_').replace(' ', '_')
        # Eliminar caracteres especiales que no sean letras, números, guiones o guiones bajos
        cleaned = re.sub(r'[^a-zA-Z0-9_-]', '', cleaned)
        # Limitar longitud y asegurar que no esté vacío
        if not cleaned:
            cleaned = "destino"
        cleaned = cleaned[:50]  # Limitar a 50 caracteres
        
        filename = f"itinerario_{cleaned}.pdf"
        
        print(f"📄 [API] Nombre del archivo: {filename}")
        
        # Codificar el nombre del archivo para URL (RFC 5987)
        from urllib.parse import quote
        encoded_filename = quote(filename, safe='')
        
        # Retornar PDF como respuesta con headers correctos
        return Response(
            content=pdf_buffer.read(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"; filename*=UTF-8\'\'{encoded_filename}',
                "Content-Type": "application/pdf"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [API] Error al generar PDF: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error al generar el PDF: {str(e)}"
        )


@app.post("/api/travel", response_model=TravelResponse)
async def plan_travel(query: TravelQuery):
    """
    Endpoint para procesar preguntas sobre viajes usando Google Gemini
    Mantiene historial de conversación para contexto
    """
    try:
        print(f"\n{'='*80}")
        print(f"🚀 [API] Nueva petición recibida")
        print(f"📝 [API] Pregunta: {query.question[:100]}...")
        print(f"📍 [API] Destino (formulario): {query.destination}")
        print(f"🔑 [API] Session ID recibido: {query.session_id}")
        
        # ============================================================
        # PASO 1: Determinar tipo de petición
        # ============================================================
        is_form_submission = query.destination is not None and query.destination.strip() != ""
        is_chat_question = not is_form_submission
        
        if is_form_submission:
            print(f"📋 [API] Tipo: PREGUNTA DE FORMULARIO")
        else:
            print(f"💬 [API] Tipo: PREGUNTA DE CHAT")
        
        print(f"✅ [API] Esta petición SIEMPRE consulta a Gemini (no hay caché de respuestas)")
        
        # Verificar que la API key esté configurada
        if not GEMINI_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="API key de Gemini no configurada. Por favor, configura la variable de entorno GEMINI_API_KEY. Ver SECRETS.md para instrucciones."
            )
        
        # Gestionar sesión de conversación
        session_id = query.session_id
        if not session_id:
            # Crear nueva sesión si no existe
            session_id = conversation_history.create_session()
            print(f"🆕 [API] Nueva sesión creada: {session_id}")
        elif session_id not in conversation_history.get_all_sessions():
            # Si la sesión no existe, crear una nueva
            session_id = conversation_history.create_session()
            print(f"🆕 [API] Sesión no válida, nueva sesión creada: {session_id}")
        else:
            print(f"✅ [API] Usando sesión existente: {session_id}")
        
        # ============================================================
        # PASO 1.5: Verificar si hay confirmación pendiente y procesar respuesta
        # ============================================================
        pending_confirmation = conversation_history.get_pending_confirmation(session_id)
        skip_destination_detection = False
        
        if pending_confirmation:
            print(f"⏳ [API] Confirmación pendiente detectada")
            print(f"📍 [API] Destino detectado: {pending_confirmation['detected_destination']}")
            print(f"📍 [API] Destino actual: {pending_confirmation['current_destination']}")
            
            # Intentar interpretar la pregunta como respuesta a la confirmación
            is_response, confirmed = interpret_confirmation_response(
                query.question,
                pending_confirmation['detected_destination'],
                pending_confirmation['current_destination']
            )
            
            if is_response:
                print(f"✅ [API] Pregunta interpretada como respuesta a confirmación: confirmed={confirmed}")
                
                # Añadir pregunta del usuario al historial
                conversation_history.add_message(session_id, 'user', query.question)
                
                if confirmed is True:
                    # Usuario confirmó el cambio
                    print(f"✅ [API] Usuario confirmó cambio de destino")
                    conversation_history.set_current_destination(session_id, pending_confirmation['detected_destination'])
                    conversation_history.clear_pending_confirmation(session_id)
                    
                    # Procesar pregunta original con el nuevo destino
                    original_question = pending_confirmation['original_question']
                    print(f"📝 [API] Procesando pregunta original: {original_question}")
                    
                    # Establecer destino y continuar con lógica normal
                    current_destination = pending_confirmation['detected_destination']
                    destination_string = pending_confirmation['detected_destination']
                    use_structured_format = True
                    skip_destination_detection = True
                    # Cambiar la pregunta a la original para procesarla
                    # Pero primero añadir la pregunta original al historial si no está
                    # (la respuesta de confirmación ya se añadió arriba)
                    query.question = original_question
                    # No añadir de nuevo al historial, ya se añadió cuando se detectó el cambio
                    
                elif confirmed is False:
                    # Usuario rechazó el cambio
                    print(f"❌ [API] Usuario rechazó cambio de destino")
                    conversation_history.clear_pending_confirmation(session_id)
                    current_destination = pending_confirmation['current_destination']
                    # Continuar con pregunta actual normalmente
                    skip_destination_detection = False
                    
                else:
                    # Respuesta ambigua - pedir aclaración
                    print(f"❓ [API] Respuesta ambigua, solicitando aclaración")
                    clarification_message = (
                        f"No estoy seguro de tu respuesta. "
                        f"¿Quieres cambiar el destino a '{pending_confirmation['detected_destination']}' "
                        f"o prefieres continuar con '{pending_confirmation['current_destination']}'? "
                        f"Por favor responde 'sí' o 'no', o menciona el destino que prefieres."
                    )
                    conversation_history.add_message(session_id, 'assistant', clarification_message)
                    return TravelResponse(
                        answer=clarification_message,
                        session_id=session_id,
                        weather=None,
                        photos=None,
                        requires_confirmation=False,
                        detected_destination=None,
                        current_destination=pending_confirmation['current_destination'],
                        response_format="confirmation"
                    )
            else:
                # No es respuesta a confirmación - limpiar confirmación pendiente y continuar normalmente
                print(f"🔄 [API] Pregunta no es respuesta a confirmación, limpiando confirmación pendiente")
                conversation_history.clear_pending_confirmation(session_id)
                skip_destination_detection = False
        
        # ============================================================
        # PASO 2: Obtener destino actual de la conversación
        # ============================================================
        if 'current_destination' not in locals():
            current_destination = conversation_history.get_current_destination(session_id)
            print(f"📍 [API] Destino actual de la conversación: {current_destination or 'Ninguno'}")
        
        # ============================================================
        # PASO 3: Si es formulario inicial, establecer destino y usar formato estructurado
        # ============================================================
        if 'use_structured_format' not in locals():
            use_structured_format = False
        if 'destination_string' not in locals():
            destination_string = None
        
        if is_form_submission:
            # Establecer destino actual
            conversation_history.set_current_destination(session_id, query.destination)
            current_destination = query.destination
            destination_string = query.destination
            
            # Usar formato estructurado (5 secciones)
            use_structured_format = True
            print(f"📋 [API] Formulario inicial - Usando formato estructurado (5 secciones)")
        
        # ============================================================
        # PASO 4: Si es pregunta de chat, detectar cambio de destino
        # ============================================================
        elif is_chat_question and not skip_destination_detection:
            # Añadir pregunta del usuario al historial (si no se añadió antes)
            if not (pending_confirmation and 'is_response' in locals() and is_response):
                conversation_history.add_message(session_id, 'user', query.question)
                print(f"💬 [API] Pregunta añadida al historial")
            
            # Detectar si hay cambio de destino
            is_change, detected_dest, is_explicit = detect_destination_change(
                current_destination, 
                query.question
            )
            
            print(f"🔍 [API] Detección de destino: cambio={is_change}, detectado={detected_dest}, explícito={is_explicit}")
            
            # ============================================================
            # PASO 5: Si hay cambio de destino (implícito), establecer confirmación pendiente
            # ============================================================
            if is_change and not is_explicit:
                # Cambio implícito detectado - establecer confirmación pendiente y preguntar
                confirmation_message = (
                    f"Veo que mencionaste '{detected_dest}' en tu pregunta. "
                    f"Actualmente estamos hablando sobre '{current_destination}'. "
                    f"¿Te gustaría cambiar el destino a '{detected_dest}' o prefieres continuar con '{current_destination}'?"
                )
                
                # Establecer confirmación pendiente
                conversation_history.set_pending_confirmation(
                    session_id,
                    detected_dest,
                    current_destination,
                    query.question  # Guardar pregunta original
                )
                
                # Agregar mensaje de confirmación al historial
                conversation_history.add_message(session_id, 'assistant', confirmation_message)
                
                print(f"❓ [API] Cambio implícito detectado - Confirmación pendiente establecida")
                
                # Retornar mensaje de confirmación (sin requires_confirmation, se maneja en el chat)
                return TravelResponse(
                    answer=confirmation_message,
                    session_id=session_id,
                    weather=None,
                    photos=None,
                    requires_confirmation=False,  # Ya no se usa window.confirm
                    detected_destination=detected_dest,
                    current_destination=current_destination,
                    response_format="confirmation"
                )
            
            # ============================================================
            # PASO 6: Si hay cambio explícito, actualizar destino y usar formato estructurado
            # ============================================================
            elif is_change and is_explicit:
                # Cambio explícito - actualizar destino y usar formato estructurado
                conversation_history.set_current_destination(session_id, detected_dest)
                current_destination = detected_dest
                destination_string = detected_dest
                use_structured_format = True
                print(f"🔄 [API] Cambio explícito de destino - Usando formato estructurado (5 secciones)")
            
            # ============================================================
            # PASO 7: Si NO hay cambio, usar respuesta directa contextualizada
            # ============================================================
            else:
                # Si no hay destino actual (primera pregunta), usar formato estructurado
                if not current_destination:
                    # Primera pregunta sin destino - usar formato estructurado
                    if detected_dest:
                        # Si se detectó un destino, establecerlo y usar formato estructurado
                        conversation_history.set_current_destination(session_id, detected_dest)
                        current_destination = detected_dest
                        destination_string = detected_dest
                        use_structured_format = True
                        print(f"🆕 [API] Primera pregunta con destino detectado - Usando formato estructurado (5 secciones)")
                    else:
                        # No se detectó destino - usar formato estructurado por defecto
                        use_structured_format = True
                        print(f"🆕 [API] Primera pregunta sin destino - Usando formato estructurado (5 secciones)")
                else:
                    # Mismo destino - usar respuesta directa (NO formato estructurado)
                    use_structured_format = False
                    destination_string = current_destination
                    print(f"💬 [API] Pregunta sobre mismo destino - Usando respuesta directa contextualizada")
        
        # ============================================================
        # PASO 8: Construir prompt según el formato a usar
        # ============================================================
        # Obtener contexto de conversaciones anteriores
        conversation_context = conversation_history.get_conversation_context(session_id, limit=10)
        print(f"📚 [API] Contexto del historial: {len(conversation_context.split(chr(10))) if conversation_context else 0} líneas")
        
        # Construcción ultra-optimizada: validar, limpiar y combinar directamente
        # Elimina contexto dinámico verboso y se enfoca solo en información esencial
        try:
            if use_structured_format:
                prompt = build_optimized_prompt(
                    question=query.question,
                    prompt_type="structured",
                    destination=current_destination
                )
                print(f"📋 [API] Usando prompt estructurado optimizado (construcción simplificada)")
            else:
                # Para contextual, usar destino si está disponible
                if not current_destination:
                    last_destination = conversation_history.extract_last_destination(session_id)
                    current_destination = last_destination
                
                prompt = build_optimized_prompt(
                    question=query.question,
                    prompt_type="contextual",
                    destination=current_destination
                )
                print(f"💬 [API] Usando prompt contextualizado optimizado (construcción simplificada)")
        except ValueError as e:
            # Si falla la validación, usar método anterior como fallback
            print(f"⚠️ [API] Validación falló, usando método anterior: {e}")
            if use_structured_format:
                base_prompt = load_prompt("travel_planning_optimized", question=query.question)
                prompt = base_prompt
            else:
                if not current_destination:
                    last_destination = conversation_history.extract_last_destination(session_id)
                    current_destination = last_destination or "el destino actual"
                base_prompt = load_prompt("travel_contextual_optimized", 
                    question=query.question,
                    current_destination=current_destination or "el destino actual",
                    conversation_history=conversation_context or "No hay historial previo"
                )
                prompt = base_prompt

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
        
        print(f"🤖 [API] Enviando prompt a Gemini (modelo: {GEMINI_MODEL})")
        print(f"📏 [API] Longitud del prompt: {len(prompt)} caracteres")
        print(f"📋 [API] Primeros 300 caracteres del prompt:\n{prompt[:300]}...")
        print(f"⚠️ [API] IMPORTANTE: Consultando DIRECTAMENTE a Gemini (NO hay caché de respuestas)")
        
        # Generar la respuesta - SIEMPRE se consulta a Gemini, nunca se usa caché
        response = model.generate_content(prompt)
        
        print(f"✅ [API] Respuesta recibida de Gemini (consulta directa, no desde caché)")
        
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
        
        print(f"📝 [API] Respuesta de Gemini (primeros 200 caracteres): {response_text[:200]}...")
        print(f"📏 [API] Longitud de la respuesta: {len(response_text)} caracteres")
        
        # ============================================================
        # PASO 9: Consultar a Gemini y procesar respuesta
        # ============================================================
        # Si no se añadió la pregunta al historial antes (solo para formularios), añadirla ahora
        if is_form_submission:
            conversation_history.add_message(session_id, 'user', query.question)
            print(f"💬 [API] Pregunta añadida al historial")
        
        # Procesar clima y fotos solo si hay destination_string válido
        weather_message = None
        photos = None
        destination = None
        
        if destination_string:
            # Intentar parsear el destino para obtener ciudad y país
            destination = parse_form_destination(destination_string)
            
            # Obtener clima
            if weather_service.is_available():
                if destination:
                    city, country = destination
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
            print(f"⚠️ No se pudo obtener el destino para clima/fotos")
            if not weather_service.is_available():
                print(f"⚠️ Servicio de clima no disponible (API key no configurada)")
        
        # Añadir respuesta del asistente al historial
        conversation_history.add_message(session_id, 'assistant', response_text)
        print(f"💬 [API] Respuesta añadida al historial")
        
        print(f"✅ [API] Respuesta final preparada")
        print(f"📊 [API] Resumen: respuesta={len(response_text)} chars, formato={'estructurado' if use_structured_format else 'contextual'}, clima={'sí' if weather_message else 'no'}, fotos={len(photos) if photos else 0}")
        print(f"{'='*80}\n")
        
        return TravelResponse(
            answer=response_text, 
            weather=weather_message, 
            photos=photos,
            session_id=session_id,
            requires_confirmation=False,
            detected_destination=None,
            current_destination=current_destination,
            response_format="structured" if use_structured_format else "contextual"
        )
        
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


@app.post("/api/travel/confirm-destination")
async def confirm_destination_change(confirmation: DestinationConfirmation):
    """
    Endpoint para confirmar o rechazar un cambio de destino
    """
    try:
        print(f"\n{'='*80}")
        print(f"🔄 [API] Confirmación de cambio de destino")
        print(f"🔑 [API] Session ID: {confirmation.session_id}")
        print(f"📍 [API] Nuevo destino: {confirmation.new_destination}")
        print(f"✅ [API] Confirmado: {confirmation.confirmed}")
        
        if confirmation.confirmed:
            # Actualizar destino actual
            conversation_history.set_current_destination(confirmation.session_id, confirmation.new_destination)
            print(f"✅ [API] Destino actualizado a: {confirmation.new_destination}")
            
            # Si hay pregunta original, procesarla con el nuevo destino
            if confirmation.original_question:
                print(f"📝 [API] Procesando pregunta original con nuevo destino")
                # Crear un TravelQuery para procesar la pregunta
                travel_query = TravelQuery(
                    question=confirmation.original_question,
                    destination=confirmation.new_destination,  # Usar nuevo destino como si fuera formulario
                    session_id=confirmation.session_id
                )
                # Procesar la pregunta con el nuevo destino
                return await plan_travel(travel_query)
            else:
                return {
                    "status": "confirmed",
                    "new_destination": confirmation.new_destination,
                    "message": f"Destino cambiado a {confirmation.new_destination}. Puedes hacer tu pregunta ahora."
                }
        else:
            # Mantener destino actual
            current_dest = conversation_history.get_current_destination(confirmation.session_id)
            print(f"❌ [API] Cambio rechazado - Manteniendo destino actual: {current_dest}")
            return {
                "status": "rejected",
                "current_destination": current_dest,
                "message": f"Se mantiene el destino actual: {current_dest}. Puedes continuar con tu pregunta."
            }
    except Exception as e:
        print(f"❌ [API] Error en confirmación: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar confirmación: {str(e)}"
        )


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
    
    @field_validator('destination')
    @classmethod
    def validate_destination_field(cls, v: str) -> str:
        result = validate_destination(v)
        if result is None:
            raise ValueError("El destino es requerido")
        return result


class ConversationHistoryRequest(BaseModel):
    session_id: str
    
    @field_validator('session_id')
    @classmethod
    def validate_session_id_field(cls, v: str) -> str:
        result = validate_session_id(v)
        if result is None:
            raise ValueError("El session ID es requerido")
        return result


class ConversationHistoryResponse(BaseModel):
    session_id: str
    messages: List[Dict[str, Any]]
    stats: Dict[str, Any]


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


@app.post("/api/conversation/create-session")
async def create_conversation_session():
    """
    Crea una nueva sesión de conversación
    """
    session_id = conversation_history.create_session()
    return {
        "session_id": session_id,
        "message": "Sesión de conversación creada exitosamente"
    }


@app.post("/api/conversation/history", response_model=ConversationHistoryResponse)
async def get_conversation_history(request: ConversationHistoryRequest):
    """
    Obtiene el historial de una conversación
    """
    session_id = request.session_id
    
    if session_id not in conversation_history.get_all_sessions():
        raise HTTPException(
            status_code=404,
            detail="Sesión no encontrada"
        )
    
    messages = conversation_history.get_history(session_id)
    stats = conversation_history.get_session_stats(session_id)
    
    return ConversationHistoryResponse(
        session_id=session_id,
        messages=messages,
        stats=stats
    )


@app.post("/api/conversation/clear")
async def clear_conversation_history(request: ConversationHistoryRequest):
    """
    Limpia el historial de una conversación
    """
    session_id = request.session_id
    
    if session_id not in conversation_history.get_all_sessions():
        raise HTTPException(
            status_code=404,
            detail="Sesión no encontrada"
        )
    
    conversation_history.clear_session(session_id)
    
    return {
        "session_id": session_id,
        "message": "Historial limpiado exitosamente"
    }

