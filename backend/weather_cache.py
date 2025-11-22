"""
Sistema de cache para datos del clima.
"""
import time
from typing import Optional, Dict, Any
from datetime import datetime, timedelta


class WeatherCache:
    """
    Cache en memoria para datos del clima con TTL (Time To Live).
    
    Criterio de actualización:
    - TTL por defecto: 30 minutos (1800 segundos)
    - El clima no cambia tan rápido, 30 minutos es un buen balance
    - Reduce significativamente las solicitudes a la API
    """
    
    def __init__(self, ttl_seconds: int = 1800):
        """
        Inicializa el cache.
        
        Args:
            ttl_seconds: Tiempo de vida del cache en segundos (default: 30 minutos)
        """
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl_seconds = ttl_seconds
        print(f"📦 Cache de clima inicializado con TTL de {ttl_seconds // 60} minutos")
    
    def _get_cache_key(self, city: str, country: Optional[str] = None) -> str:
        """
        Genera una clave única para el cache basada en ciudad y país.
        
        Args:
            city: Nombre de la ciudad
            country: Código del país (opcional)
            
        Returns:
            Clave única para el cache
        """
        # Normalizar: convertir a minúsculas y limpiar espacios
        city_normalized = city.strip().lower()
        country_normalized = country.strip().lower() if country else ""
        
        if country_normalized:
            return f"{city_normalized},{country_normalized}"
        return city_normalized
    
    def get(self, city: str, country: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Obtiene datos del clima del cache si están disponibles y no han expirado.
        
        Args:
            city: Nombre de la ciudad
            country: Código del país (opcional)
            
        Returns:
            Datos del clima si están en cache y no han expirado, None en caso contrario
        """
        cache_key = self._get_cache_key(city, country)
        
        if cache_key not in self.cache:
            print(f"📦 Cache MISS para {cache_key} (no encontrado en cache)")
            return None
        
        cached_data = self.cache[cache_key]
        cached_time = cached_data.get("cached_at", 0)
        current_time = time.time()
        
        # Verificar si el cache ha expirado
        if current_time - cached_time > self.ttl_seconds:
            # Cache expirado, eliminarlo
            del self.cache[cache_key]
            print(f"⏰ Cache expirado para {cache_key}, será actualizado en la próxima solicitud")
            return None
        
        # Cache válido, retornar datos
        time_remaining = int(self.ttl_seconds - (current_time - cached_time))
        minutes_remaining = time_remaining // 60
        seconds_remaining = time_remaining % 60
        if minutes_remaining > 0:
            time_str = f"{minutes_remaining} min {seconds_remaining} seg"
        else:
            time_str = f"{seconds_remaining} seg"
        print(f"📦 Cache HIT para {cache_key} (válido por {time_str} más)")
        return cached_data.get("weather_data")
    
    def set(self, city: str, country: Optional[str], weather_data: Dict[str, Any]) -> None:
        """
        Guarda datos del clima en el cache.
        
        Args:
            city: Nombre de la ciudad
            country: Código del país (opcional)
            weather_data: Datos del clima a guardar
        """
        cache_key = self._get_cache_key(city, country)
        
        self.cache[cache_key] = {
            "weather_data": weather_data,
            "cached_at": time.time()
        }
        
        print(f"💾 Datos del clima guardados en cache para {cache_key}")
    
    def clear(self) -> None:
        """
        Limpia todo el cache.
        """
        count = len(self.cache)
        self.cache.clear()
        print(f"🗑️  Cache limpiado ({count} entradas eliminadas)")
    
    def clear_expired(self) -> None:
        """
        Elimina solo las entradas expiradas del cache.
        """
        current_time = time.time()
        expired_keys = []
        
        for key, cached_data in self.cache.items():
            cached_time = cached_data.get("cached_at", 0)
            if current_time - cached_time > self.ttl_seconds:
                expired_keys.append(key)
        
        for key in expired_keys:
            del self.cache[key]
        
        if expired_keys:
            print(f"🧹 {len(expired_keys)} entradas expiradas eliminadas del cache")
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Obtiene estadísticas del cache.
        
        Returns:
            Diccionario con estadísticas del cache
        """
        current_time = time.time()
        valid_entries = 0
        expired_entries = 0
        
        for cached_data in self.cache.values():
            cached_time = cached_data.get("cached_at", 0)
            if current_time - cached_time > self.ttl_seconds:
                expired_entries += 1
            else:
                valid_entries += 1
        
        return {
            "total_entries": len(self.cache),
            "valid_entries": valid_entries,
            "expired_entries": expired_entries,
            "ttl_seconds": self.ttl_seconds,
            "ttl_minutes": self.ttl_seconds // 60
        }

