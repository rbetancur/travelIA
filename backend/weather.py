"""
Módulo para obtener información del clima usando OpenWeatherMap API.
"""
import os
import requests
from typing import Optional, Dict, Any
from weather_cache import WeatherCache
from country_code_cache import CountryCodeCache
import google.generativeai as genai

# Cache global para códigos de países
_country_code_cache = CountryCodeCache()


class WeatherService:
    """
    Servicio para obtener información del clima de ciudades usando OpenWeatherMap API.
    """
    
    BASE_URL = "https://api.openweathermap.org/data/2.5/weather"
    
    def __init__(self, api_key: Optional[str] = None, cache_ttl_seconds: int = 1800):
        """
        Inicializa el servicio de clima.
        
        Args:
            api_key: API key de OpenWeatherMap. Si no se proporciona, se busca en variables de entorno.
            cache_ttl_seconds: Tiempo de vida del cache en segundos (default: 30 minutos)
        """
        self.api_key = api_key or os.getenv("OPENWEATHER_API_KEY")
        self.cache = WeatherCache(ttl_seconds=cache_ttl_seconds)
        self.api_unavailable = False  # Flag para evitar reintentos si la API no está disponible
    
    def get_weather(self, city: str, country: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Obtiene el clima actual de una ciudad.
        Primero busca en el cache, si no está disponible o ha expirado, hace solicitud a la API.
        NO hace reintentos si la API no está disponible.
        
        Args:
            city: Nombre de la ciudad
            country: Código de país (opcional, ej: "ES", "FR", "US")
            
        Returns:
            Diccionario con información del clima o None si hay error
        """
        # 1. Limpiar entradas expiradas periódicamente (cada 10 solicitudes aproximadamente)
        # Esto se hace de forma lazy para no impactar el rendimiento
        import random
        if random.random() < 0.1:  # 10% de probabilidad
            self.cache.clear_expired()
        
        # 2. Verificar cache primero
        cached_data = self.cache.get(city, country)
        if cached_data:
            return cached_data
        
        # 3. Si la API no está disponible, no intentar solicitud
        if self.api_unavailable:
            print(f"⚠️ API de OpenWeatherMap no disponible, no se harán más intentos")
            return None
        
        # 4. Si no hay cache, hacer solicitud a la API
        print(f"🌐 Consultando API de OpenWeatherMap para: {city}, {country}")
        weather_data = self._fetch_weather_from_api(city, country)
        
        # 5. Si la solicitud fue exitosa, guardar en cache
        if weather_data:
            self.cache.set(city, country, weather_data)
            self.api_unavailable = False  # Resetear flag si la solicitud fue exitosa
            print(f"✅ Clima obtenido y guardado en cache")
        else:
            # Si falló por error de autenticación o API no disponible, marcar como no disponible
            # Esto evita hacer múltiples solicitudes fallidas
            if self.api_unavailable:
                print(f"⚠️ API marcada como no disponible, no se harán más intentos hasta reiniciar el servidor")
        
        return weather_data
    
    def _fetch_weather_from_api(self, city: str, country: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Hace una solicitud a la API de OpenWeatherMap.
        NO hace reintentos si falla.
        
        Args:
            city: Nombre de la ciudad
            country: Código de país (opcional)
            
        Returns:
            Diccionario con información del clima o None si hay error
        """
        if not self.api_key:
            print("❌ API key de OpenWeatherMap no configurada")
            self.api_unavailable = True
            return None
        
        # Limpiar la API key (eliminar espacios en blanco)
        api_key_clean = self.api_key.strip()
        if not api_key_clean:
            print("❌ API key de OpenWeatherMap está vacía")
            self.api_unavailable = True
            return None
        
        # Construir query: "city,country" o solo "city"
        query = f"{city},{country}" if country else city
        
        params = {
            "q": query,
            "appid": api_key_clean,
            "units": "metric",  # Temperatura en Celsius
            "lang": "es"  # Respuestas en español
        }
        
        try:
            response = requests.get(self.BASE_URL, params=params, timeout=10)
            
            # Manejar errores específicos (SIN REINTENTOS)
            if response.status_code == 401:
                print(f"❌ ERROR 401: API key de OpenWeatherMap no válida o no activada")
                print(f"   No se harán más intentos hasta reiniciar el servidor")
                print(f"   Verifica en: https://home.openweathermap.org/api_keys")
                try:
                    error_data = response.json()
                    if "message" in error_data:
                        print(f"   Mensaje de la API: {error_data['message']}")
                except:
                    pass
                self.api_unavailable = True  # Marcar API como no disponible
                return None
            elif response.status_code == 404:
                print(f"⚠️ Ciudad no encontrada: {query}")
                # No marcar como no disponible para 404, puede ser que la ciudad no exista
                return None
            elif response.status_code == 429:
                print(f"⚠️ Límite de solicitudes excedido para OpenWeatherMap")
                print(f"   No se harán más intentos hasta reiniciar el servidor")
                self.api_unavailable = True  # Marcar API como no disponible temporalmente
                return None
            
            response.raise_for_status()
            data = response.json()
            
            return self._format_weather_data(data)
            
        except requests.exceptions.HTTPError as e:
            print(f"❌ Error HTTP al obtener clima para {query}: {e}")
            if hasattr(e.response, 'status_code'):
                if e.response.status_code in [401, 403, 429]:
                    self.api_unavailable = True  # Marcar como no disponible para errores críticos
            return None
        except requests.exceptions.RequestException as e:
            print(f"❌ Error de conexión al obtener clima para {query}: {e}")
            print(f"   No se harán más intentos hasta reiniciar el servidor")
            self.api_unavailable = True  # Marcar API como no disponible
            return None
        except Exception as e:
            print(f"❌ Error inesperado al procesar clima para {query}: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _format_weather_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Formatea los datos del clima en un formato más legible.
        
        Args:
            data: Datos raw de la API de OpenWeatherMap
            
        Returns:
            Diccionario formateado con información del clima
        """
        main = data.get("main", {})
        weather = data.get("weather", [{}])[0]
        wind = data.get("wind", {})
        sys = data.get("sys", {})
        
        return {
            "ciudad": data.get("name", "Desconocida"),
            "pais": sys.get("country", ""),
            "temperatura": round(main.get("temp", 0), 1),
            "sensacion_termica": round(main.get("feels_like", 0), 1),
            "descripcion": weather.get("description", "").capitalize(),
            "humedad": main.get("humidity", 0),
            "viento": {
                "velocidad": round(wind.get("speed", 0) * 3.6, 1),  # Convertir m/s a km/h
                "direccion": wind.get("deg", 0)
            },
            "presion": main.get("pressure", 0),
            "visibilidad": round(data.get("visibility", 0) / 1000, 1) if data.get("visibility") else None,  # Convertir m a km
            "icono": weather.get("icon", ""),
            "codigo_clima": weather.get("id", 0)
        }
    
    def format_weather_message(self, weather_data: Dict[str, Any]) -> str:
        """
        Formatea los datos del clima en un mensaje legible para el usuario.
        
        Args:
            weather_data: Datos del clima formateados
            
        Returns:
            Mensaje formateado con información del clima
        """
        if not weather_data:
            return ""
        
        ciudad = weather_data.get("ciudad", "Desconocida")
        pais = weather_data.get("pais", "")
        temp = weather_data.get("temperatura", 0)
        sensacion = weather_data.get("sensacion_termica", 0)
        descripcion = weather_data.get("descripcion", "")
        humedad = weather_data.get("humedad", 0)
        viento_vel = weather_data.get("viento", {}).get("velocidad", 0)
        
        ubicacion = f"{ciudad}, {pais}" if pais else ciudad
        
        mensaje = f"🌤️ **Clima Actual en {ubicacion}:**\n"
        mensaje += f"• T: {temp}°C / ST: {sensacion}°C\n"
        mensaje += f"• Condiciones: {descripcion}\n"
        mensaje += f"• Humedad: {humedad}%\n"
        
        if viento_vel > 0:
            mensaje += f"• Viento: {viento_vel} km/h\n"
        
        return mensaje
    
    def is_available(self) -> bool:
        """
        Verifica si el servicio de clima está disponible (tiene API key).
        
        Returns:
            True si el servicio está disponible, False en caso contrario
        """
        return self.api_key is not None and self.api_key.strip() != ""
    
    def validate_api_key(self) -> tuple[bool, Optional[str]]:
        """
        Valida la API key haciendo una solicitud de prueba.
        
        Returns:
            Tupla (es_válida, mensaje_error)
        """
        if not self.api_key or not self.api_key.strip():
            return (False, "API key no configurada")
        
        # Hacer una solicitud de prueba con una ciudad conocida
        test_params = {
            "q": "London",
            "appid": self.api_key.strip(),
            "units": "metric"
        }
        
        try:
            response = requests.get(self.BASE_URL, params=test_params, timeout=5)
            if response.status_code == 200:
                return (True, None)
            elif response.status_code == 401:
                return (False, "API key no válida o no activada. Verifica en https://home.openweathermap.org/api_keys")
            elif response.status_code == 429:
                return (False, "Límite de solicitudes excedido")
            else:
                return (False, f"Error HTTP {response.status_code}")
        except requests.exceptions.RequestException as e:
            return (False, f"Error de conexión: {str(e)}")
        except Exception as e:
            return (False, f"Error inesperado: {str(e)}")


def get_country_code_with_gemini(country_name: str) -> Optional[str]:
    """
    Obtiene el código ISO de un país usando Gemini AI.
    Primero busca en cache, si no está, consulta a Gemini.
    
    Args:
        country_name: Nombre del país
        
    Returns:
        Código ISO del país (ej: "ES", "FR", "US") o None si no se encuentra
    """
    if not country_name or not country_name.strip():
        return None
    
    country_name = country_name.strip()
    
    # 1. Buscar primero en cache
    cached_code = _country_code_cache.get(country_name)
    if cached_code is not None:
        return cached_code
    
    # 2. Si no está en cache, consultar a Gemini
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        print(f"⚠️ GEMINI_API_KEY no configurada, no se puede obtener código para '{country_name}'")
        _country_code_cache.set(country_name, None)  # Guardar None en cache para no intentar de nuevo
        return None
    
    try:
        # Configurar Gemini
        genai.configure(api_key=gemini_api_key)
        
        # Modelo gratuito
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        model = genai.GenerativeModel(model_name)
        
        # Prompt optimizado para obtener código ISO
        prompt = f"""Dado el nombre de un país, devuelve SOLO su código ISO 3166-1 alpha-2 (2 letras).

País: {country_name}

Responde ÚNICAMENTE con el código ISO de 2 letras en mayúsculas, sin explicaciones, sin puntos, sin espacios.
Si no conoces el país o no existe, responde exactamente: NOT_FOUND

Ejemplos:
- España → ES
- France → FR
- United States → US
- Japan → JP
- Países que no existen → NOT_FOUND"""
        
        print(f"🤖 Consultando Gemini para código ISO de '{country_name}'...")
        response = model.generate_content(prompt)
        
        # Extraer el texto de la respuesta
        response_text = None
        if hasattr(response, 'text') and response.text:
            response_text = response.text.strip()
        elif hasattr(response, 'candidates') and response.candidates:
            if len(response.candidates) > 0:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    parts = candidate.content.parts
                    if parts and len(parts) > 0:
                        response_text = parts[0].text.strip() if hasattr(parts[0], 'text') else str(parts[0]).strip()
        
        if not response_text:
            print(f"⚠️ Gemini no devolvió respuesta para '{country_name}'")
            _country_code_cache.set(country_name, None)
            return None
        
        # Limpiar la respuesta (eliminar espacios, puntos, etc.)
        response_text = response_text.strip().upper().replace('.', '').replace(' ', '')
        
        # Validar que sea un código ISO válido (2 letras) o NOT_FOUND
        if response_text == "NOT_FOUND" or len(response_text) != 2 or not response_text.isalpha():
            print(f"⚠️ Gemini no encontró código ISO para '{country_name}' (respuesta: {response_text})")
            _country_code_cache.set(country_name, None)
            return None
        
        # Guardar en cache y retornar
        print(f"✅ Gemini devolvió código ISO: {country_name} → {response_text}")
        _country_code_cache.set(country_name, response_text)
        return response_text
        
    except Exception as e:
        print(f"❌ Error al consultar Gemini para código de '{country_name}': {e}")
        _country_code_cache.set(country_name, None)  # Guardar None para no intentar de nuevo
        return None


def parse_form_destination(destination: str) -> Optional[tuple[str, Optional[str]]]:
    """
    Parsea el destino del formulario que viene en formato "Ciudad, País".
    Usa Gemini para obtener códigos ISO de países con cache.
    
    Args:
        destination: Destino del formulario en formato "Ciudad, País"
        
    Returns:
        Tupla (ciudad, código_país) o None si no se puede parsear
    """
    if not destination or not destination.strip():
        return None
    
    destination = destination.strip()
    
    # Intentar dividir por coma
    if ',' in destination:
        parts = destination.split(',', 1)
        city = parts[0].strip()
        country_name = parts[1].strip() if len(parts) > 1 else None
        
        if country_name:
            # Obtener código de país usando Gemini (con cache)
            country_code = get_country_code_with_gemini(country_name)
            if country_code:
                print(f"✅ Destino del formulario parseado: {city}, {country_code}")
                return (city, country_code)
            else:
                # Si no encontramos el código, intentar usar el nombre directamente
                print(f"⚠️ Destino del formulario parseado pero sin código: {city}, {country_name}")
                return (city, None)
        else:
            # Solo ciudad, sin país
            print(f"✅ Destino del formulario (solo ciudad): {city}")
            return (city, None)
    else:
        # No hay coma, asumir que es solo la ciudad
        print(f"✅ Destino del formulario (solo ciudad): {destination}")
        return (destination, None)


def extract_destination_from_question(question: str) -> Optional[tuple[str, Optional[str]]]:
    """
    Intenta extraer el destino (ciudad y país) de una pregunta del usuario.
    
    Esta es una función simple que busca patrones comunes. Para mejor precisión,
    se podría usar NLP o el mismo Gemini para extraer el destino.
    
    Args:
        question: Pregunta del usuario sobre viajes
        
    Returns:
        Tupla (ciudad, país) o None si no se puede extraer
    """
    import re
    
    question_lower = question.lower()
    
    # Mapeo de países comunes a códigos ISO
    country_codes = {
        "españa": "ES", "spain": "ES", "español": "ES",
        "francia": "FR", "france": "FR", "francés": "FR",
        "italia": "IT", "italy": "IT", "italiano": "IT",
        "reino unido": "GB", "united kingdom": "GB", "uk": "GB", "inglaterra": "GB", "england": "GB",
        "estados unidos": "US", "united states": "US", "usa": "US", "eeuu": "US",
        "japón": "JP", "japan": "JP", "japon": "JP",
        "indonesia": "ID", "indonesia": "ID",
        "tailandia": "TH", "thailand": "TH",
        "emiratos árabes": "AE", "united arab emirates": "AE", "uae": "AE", "dubai": "AE",
        "australia": "AU", "australia": "AU",
        "países bajos": "NL", "netherlands": "NL", "holanda": "NL",
        "alemania": "DE", "germany": "DE", "alemán": "DE",
        "austria": "AT", "austria": "AT",
        "república checa": "CZ", "czech republic": "CZ", "chequia": "CZ",
    }
    
    # Patrones comunes de destinos mencionados en preguntas
    common_destinations = {
        "parís": ("Paris", "FR"),
        "paris": ("Paris", "FR"),
        "tokio": ("Tokyo", "JP"),
        "tokyo": ("Tokyo", "JP"),
        "nueva york": ("New York", "US"),
        "new york": ("New York", "US"),
        "barcelona": ("Barcelona", "ES"),
        "madrid": ("Madrid", "ES"),
        "londres": ("London", "GB"),
        "london": ("London", "GB"),
        "roma": ("Rome", "IT"),
        "rome": ("Rome", "IT"),
        "bali": ("Bali", "ID"),
        "bangkok": ("Bangkok", "TH"),
        "dubai": ("Dubai", "AE"),
        "sydney": ("Sydney", "AU"),
        "miami": ("Miami", "US"),
        "los angeles": ("Los Angeles", "US"),
        "amsterdam": ("Amsterdam", "NL"),
        "berlín": ("Berlin", "DE"),
        "berlin": ("Berlin", "DE"),
        "viena": ("Vienna", "AT"),
        "vienna": ("Vienna", "AT"),
        "praga": ("Prague", "CZ"),
        "prague": ("Prague", "CZ"),
    }
    
    # Primero, intentar extraer "Ciudad, País" del formato del formulario
    # Patrón mejorado: "viajar a Ciudad, País" o "a Ciudad, País"
    pattern_form = r'(?:viajar\s+a|a|hacia|destino:)\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*),\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)'
    match_form = re.search(pattern_form, question, re.IGNORECASE)
    if match_form:
        city = match_form.group(1).strip()
        country_name = match_form.group(2).strip()
        # Convertir nombre del país a código ISO
        country_code = country_codes.get(country_name.lower(), None)
        if country_code:
            print(f"✅ Destino extraído del formulario: {city}, {country_code}")
            return (city, country_code)
        else:
            # Si no encontramos el código, intentar usar el nombre del país directamente
            print(f"⚠️ Destino extraído pero sin código de país: {city}, {country_name}")
            return (city, None)
    
    # Buscar destinos comunes en la pregunta
    for key, (city, country) in common_destinations.items():
        if key in question_lower:
            print(f"✅ Destino común encontrado: {city}, {country}")
            return (city, country)
    
    # Intentar extraer cualquier "Ciudad, País" del texto
    pattern_generic = r'([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*),\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)'
    match_generic = re.search(pattern_generic, question)
    if match_generic:
        city = match_generic.group(1).strip()
        country_name = match_generic.group(2).strip()
        country_code = country_codes.get(country_name.lower(), None)
        if country_code:
            print(f"✅ Destino genérico extraído: {city}, {country_code}")
            return (city, country_code)
        else:
            print(f"⚠️ Destino genérico extraído pero sin código: {city}, {country_name}")
            return (city, None)
    
    print(f"❌ No se pudo extraer destino de la pregunta: {question[:100]}...")
    return None

