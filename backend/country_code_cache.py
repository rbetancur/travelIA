"""
Cache para mapeos de nombres de países a códigos ISO usando Gemini.
"""
import time
from typing import Optional, Dict


class CountryCodeCache:
    """
    Cache en memoria para mapeos de países a códigos ISO.
    
    El cache es permanente (sin TTL) porque los códigos ISO de países no cambian.
    Una vez que Gemini mapea un país, se guarda para siempre.
    """
    
    def __init__(self):
        """Inicializa el cache de códigos de países."""
        self.cache: Dict[str, Optional[str]] = {}
        print("📦 Cache de códigos de países inicializado")
    
    def _normalize_country_name(self, country_name: str) -> str:
        """
        Normaliza el nombre del país para usar como clave del cache.
        
        Args:
            country_name: Nombre del país
            
        Returns:
            Nombre normalizado (minúsculas, sin espacios extra)
        """
        return country_name.strip().lower()
    
    def get(self, country_name: str) -> Optional[str]:
        """
        Obtiene el código ISO del país desde el cache.
        
        Args:
            country_name: Nombre del país
            
        Returns:
            Código ISO del país si está en cache, None en caso contrario
        """
        if not country_name:
            return None
        
        normalized = self._normalize_country_name(country_name)
        
        if normalized in self.cache:
            code = self.cache[normalized]
            print(f"📦 Cache HIT para país '{country_name}' → {code}")
            return code
        
        print(f"📦 Cache MISS para país '{country_name}'")
        return None
    
    def set(self, country_name: str, country_code: Optional[str]) -> None:
        """
        Guarda un mapeo de país a código ISO en el cache.
        
        Args:
            country_name: Nombre del país
            country_code: Código ISO del país (o None si no se encontró)
        """
        if not country_name:
            return
        
        normalized = self._normalize_country_name(country_name)
        self.cache[normalized] = country_code
        
        if country_code:
            print(f"💾 Mapeo guardado en cache: '{country_name}' → {country_code}")
        else:
            print(f"💾 Mapeo guardado en cache: '{country_name}' → None (no encontrado)")
    
    def clear(self) -> None:
        """
        Limpia todo el cache.
        """
        count = len(self.cache)
        self.cache.clear()
        print(f"🗑️  Cache de códigos de países limpiado ({count} entradas eliminadas)")
    
    def get_stats(self) -> Dict[str, int]:
        """
        Obtiene estadísticas del cache.
        
        Returns:
            Diccionario con estadísticas del cache
        """
        return {
            "total_entries": len(self.cache),
            "entries_with_code": sum(1 for code in self.cache.values() if code is not None),
            "entries_without_code": sum(1 for code in self.cache.values() if code is None)
        }

