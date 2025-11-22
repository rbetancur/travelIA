"""
Módulo para obtener información en tiempo real: tipo de cambio, diferencia horaria y temperatura.
"""
import os
import requests
from typing import Optional, Dict, Any
from datetime import datetime
import pytz
from weather import WeatherService, parse_form_destination


class RealtimeInfoService:
    """
    Servicio para obtener información en tiempo real de un destino.
    """
    
    EXCHANGE_RATE_API = "https://api.exchangerate-api.com/v4/latest/USD"
    TIMEZONE_API = "https://worldtimeapi.org/api/timezone"
    
    def __init__(self):
        """Inicializa el servicio de información en tiempo real."""
        self.weather_service = WeatherService()
    
    def get_realtime_info(self, destination: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene información en tiempo real para un destino.
        
        Args:
            destination: Destino en formato "Ciudad, País"
            
        Returns:
            Diccionario con información en tiempo real o None si hay error
        """
        if not destination or not destination.strip():
            return None
        
        # Parsear destino
        parsed = parse_form_destination(destination)
        if not parsed:
            return None
        
        city, country_code = parsed
        
        # Obtener información del clima (incluye coordenadas)
        weather_data = None
        if self.weather_service.is_available():
            weather_data = self.weather_service.get_weather(city, country_code)
        
        # Obtener tipo de cambio
        exchange_rate = self._get_exchange_rate(country_code)
        
        # Obtener diferencia horaria
        time_difference = self._get_time_difference(city, country_code, weather_data)
        
        # Obtener temperatura actual
        temperature = None
        if weather_data:
            temperature = weather_data.get("temperatura")
        
        return {
            "destination": destination,
            "city": city,
            "country_code": country_code,
            "exchange_rate": exchange_rate,
            "time_difference": time_difference,
            "temperature": temperature,
            "weather_data": weather_data
        }
    
    def _get_exchange_rate(self, country_code: Optional[str]) -> Optional[Dict[str, Any]]:
        """
        Obtiene el tipo de cambio de la moneda del país.
        
        Args:
            country_code: Código ISO del país (ej: "ES", "FR", "US")
            
        Returns:
            Diccionario con información del tipo de cambio o None
        """
        if not country_code:
            return None
        
        # Mapeo de códigos de país a códigos de moneda ISO 4217
        country_to_currency = {
            "ES": "EUR", "FR": "EUR", "IT": "EUR", "DE": "EUR", "PT": "EUR",
            "NL": "EUR", "BE": "EUR", "AT": "EUR", "GR": "EUR", "IE": "EUR",
            "US": "USD", "CA": "CAD", "MX": "MXN",
            "GB": "GBP", "UK": "GBP",
            "JP": "JPY",
            "CN": "CNY",
            "AU": "AUD", "NZ": "NZD",
            "CH": "CHF",
            "SE": "SEK", "NO": "NOK", "DK": "DKK",
            "PL": "PLN",
            "CZ": "CZK",
            "HU": "HUF",
            "BR": "BRL",
            "AR": "ARS",
            "CL": "CLP",
            "CO": "COP",
            "PE": "PEN",
            "ID": "IDR",
            "TH": "THB",
            "SG": "SGD",
            "MY": "MYR",
            "PH": "PHP",
            "VN": "VND",
            "IN": "INR",
            "KR": "KRW",
            "AE": "AED",
            "SA": "SAR",
            "IL": "ILS",
            "TR": "TRY",
            "RU": "RUB",
            "ZA": "ZAR",
            "EG": "EGP",
            "MA": "MAD"
        }
        
        currency_code = country_to_currency.get(country_code.upper())
        if not currency_code:
            return None
        
        try:
            # Usar API gratuita de exchangerate-api.com
            response = requests.get(self.EXCHANGE_RATE_API, timeout=5)
            if response.status_code == 200:
                data = response.json()
                rates = data.get("rates", {})
                
                if currency_code in rates:
                    # Obtener tasa de cambio USD a la moneda del destino
                    usd_to_dest = rates[currency_code]
                    # Calcular tasa inversa (moneda destino a USD)
                    dest_to_usd = 1 / usd_to_dest if usd_to_dest > 0 else None
                    
                    return {
                        "currency_code": currency_code,
                        "usd_to_dest": round(usd_to_dest, 4),
                        "dest_to_usd": round(dest_to_usd, 4) if dest_to_usd else None,
                        "last_updated": data.get("date", "")
                    }
        except Exception as e:
            print(f"⚠️ Error al obtener tipo de cambio: {e}")
        
        return None
    
    def _get_time_difference(self, city: str, country_code: Optional[str], weather_data: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Obtiene la diferencia horaria entre el destino y la hora local del usuario.
        
        Args:
            city: Nombre de la ciudad
            country_code: Código ISO del país
            weather_data: Datos del clima que pueden incluir coordenadas
            
        Returns:
            Diccionario con información de diferencia horaria o None
        """
        try:
            # Obtener timezone del destino usando WorldTimeAPI
            # Primero intentar con el país
            timezone_name = None
            
            if country_code:
                # Mapeo de códigos de país a zonas horarias comunes
                country_timezones = {
                    "ES": "Europe/Madrid",
                    "FR": "Europe/Paris",
                    "IT": "Europe/Rome",
                    "DE": "Europe/Berlin",
                    "GB": "Europe/London",
                    "UK": "Europe/London",
                    "US": "America/New_York",  # Por defecto, se puede mejorar
                    "CA": "America/Toronto",
                    "MX": "America/Mexico_City",
                    "JP": "Asia/Tokyo",
                    "CN": "Asia/Shanghai",
                    "AU": "Australia/Sydney",
                    "NZ": "Pacific/Auckland",
                    "BR": "America/Sao_Paulo",
                    "AR": "America/Argentina/Buenos_Aires",
                    "CL": "America/Santiago",
                    "CO": "America/Bogota",
                    "PE": "America/Lima",
                    "ID": "Asia/Jakarta",
                    "TH": "Asia/Bangkok",
                    "SG": "Asia/Singapore",
                    "IN": "Asia/Kolkata",
                    "KR": "Asia/Seoul",
                    "AE": "Asia/Dubai",
                    "SA": "Asia/Riyadh",
                    "IL": "Asia/Jerusalem",
                    "TR": "Europe/Istanbul",
                    "RU": "Europe/Moscow",
                    "ZA": "Africa/Johannesburg",
                    "EG": "Africa/Cairo",
                    "MA": "Africa/Casablanca"
                }
                
                timezone_name = country_timezones.get(country_code.upper())
            
            # Si no encontramos timezone por país, intentar obtenerlo de la API
            if not timezone_name:
                # Usar WorldTimeAPI con IP o intentar con el nombre de la ciudad
                # Por ahora, usar una aproximación basada en el país
                print(f"⚠️ No se encontró timezone para {city}, {country_code}")
                return None
            
            # Obtener hora actual del destino
            dest_tz = pytz.timezone(timezone_name)
            dest_time = datetime.now(dest_tz)
            
            # Obtener hora local (asumimos que el servidor está en UTC o hora local del usuario)
            # Por simplicidad, usaremos UTC como referencia
            local_tz = pytz.UTC
            local_time = datetime.now(local_tz)
            
            # Calcular diferencia
            dest_offset = dest_time.utcoffset().total_seconds() / 3600
            local_offset = local_time.utcoffset().total_seconds() / 3600
            time_diff_hours = dest_offset - local_offset
            
            # Formatear diferencia
            if time_diff_hours == 0:
                diff_str = "Sin diferencia"
            elif time_diff_hours > 0:
                diff_str = f"+{int(time_diff_hours)}h"
            else:
                diff_str = f"{int(time_diff_hours)}h"
            
            return {
                "timezone": timezone_name,
                "destination_time": dest_time.strftime("%H:%M"),
                "local_time": local_time.strftime("%H:%M"),
                "difference_hours": round(time_diff_hours, 1),
                "difference_string": diff_str
            }
            
        except Exception as e:
            print(f"⚠️ Error al obtener diferencia horaria: {e}")
            return None


def get_realtime_info(destination: str) -> Optional[Dict[str, Any]]:
    """
    Función helper para obtener información en tiempo real.
    
    Args:
        destination: Destino en formato "Ciudad, País"
        
    Returns:
        Diccionario con información en tiempo real o None
    """
    service = RealtimeInfoService()
    return service.get_realtime_info(destination)

