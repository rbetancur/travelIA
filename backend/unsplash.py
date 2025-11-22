"""
Módulo para obtener fotos de destinos usando Unsplash API.
"""
import os
import requests
from typing import Optional, List, Dict, Any, Tuple


class UnsplashService:
    """
    Servicio para obtener fotos de destinos usando Unsplash API.
    """
    
    BASE_URL = "https://api.unsplash.com/search/photos"
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Inicializa el servicio de Unsplash.
        
        Args:
            api_key: API key de Unsplash. Si no se proporciona, se busca en variables de entorno.
        """
        self.api_key = api_key or os.getenv("UNSPLASH_API_KEY")
        self.api_unavailable = False  # Flag para evitar reintentos si la API no está disponible
    
    def is_available(self) -> bool:
        """
        Verifica si el servicio está disponible (tiene API key configurada).
        
        Returns:
            True si la API key está configurada, False en caso contrario
        """
        return self.api_key is not None and self.api_key.strip() != ""
    
    def get_photos(self, destination: str, count: int = 3) -> Optional[List[Dict[str, Any]]]:
        """
        Obtiene fotos de un destino.
        
        Args:
            destination: Nombre del destino (ej: "Barcelona, España" o "Paris")
            count: Número de fotos a obtener (default: 3)
            
        Returns:
            Lista de diccionarios con información de las fotos o None si hay error
        """
        if not self.is_available():
            print("⚠️ API key de Unsplash no configurada")
            return None
        
        # Si la API no está disponible, no intentar solicitud
        if self.api_unavailable:
            print(f"⚠️ API de Unsplash no disponible, no se harán más intentos")
            return None
        
        # Limpiar el destino para la búsqueda
        search_query = destination.strip()
        
        print(f"📸 Consultando API de Unsplash para: {search_query}")
        photos_data = self._fetch_photos_from_api(search_query, count)
        
        if photos_data:
            self.api_unavailable = False  # Resetear flag si la solicitud fue exitosa
            print(f"✅ {len(photos_data)} fotos obtenidas de Unsplash")
        else:
            # Si falló por error de autenticación o API no disponible, marcar como no disponible
            if self.api_unavailable:
                print(f"⚠️ API marcada como no disponible, no se harán más intentos hasta reiniciar el servidor")
        
        return photos_data
    
    def _fetch_photos_from_api(self, query: str, count: int) -> Optional[List[Dict[str, Any]]]:
        """
        Hace una solicitud a la API de Unsplash.
        
        Args:
            query: Término de búsqueda
            count: Número de fotos a obtener
            
        Returns:
            Lista de diccionarios con información de las fotos o None si hay error
        """
        if not self.api_key:
            print("❌ API key de Unsplash no configurada")
            self.api_unavailable = True
            return None
        
        # Limpiar la API key (eliminar espacios en blanco)
        api_key_clean = self.api_key.strip()
        if not api_key_clean:
            print("❌ API key de Unsplash está vacía")
            self.api_unavailable = True
            return None
        
        try:
            headers = {
                "Authorization": f"Client-ID {api_key_clean}"
            }
            
            params = {
                "query": query,
                "per_page": min(count, 10),  # Unsplash permite máximo 30 por página
                "orientation": "landscape",  # Preferir fotos horizontales
                "order_by": "relevance"  # Ordenar por relevancia
            }
            
            response = requests.get(self.BASE_URL, headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                
                # Formatear las fotos para el frontend
                photos = []
                for photo in results[:count]:
                    photos.append({
                        "id": photo.get("id"),
                        "url": photo.get("urls", {}).get("regular"),  # URL de tamaño regular
                        "url_small": photo.get("urls", {}).get("small"),  # URL pequeña para thumbnails
                        "url_full": photo.get("urls", {}).get("full"),  # URL completa
                        "description": photo.get("description") or photo.get("alt_description") or "",
                        "photographer": photo.get("user", {}).get("name", "Unknown"),
                        "photographer_url": photo.get("user", {}).get("links", {}).get("html", ""),
                        "width": photo.get("width"),
                        "height": photo.get("height")
                    })
                
                return photos if photos else None
                
            elif response.status_code == 401:
                print(f"❌ ERROR 401: API key de Unsplash no válida o no autorizada")
                self.api_unavailable = True
                return None
            elif response.status_code == 403:
                print(f"❌ ERROR 403: Acceso denegado a la API de Unsplash")
                self.api_unavailable = True
                return None
            else:
                print(f"❌ ERROR {response.status_code}: Error al consultar Unsplash API")
                print(f"   Respuesta: {response.text[:200]}")
                return None
                
        except requests.exceptions.Timeout:
            print(f"❌ Timeout al consultar Unsplash API")
            return None
        except requests.exceptions.RequestException as e:
            print(f"❌ Error de conexión con Unsplash API: {e}")
            return None
        except Exception as e:
            print(f"❌ Error inesperado al consultar Unsplash API: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def validate_api_key(self) -> Tuple[bool, Optional[str]]:
        """
        Valida la API key haciendo una solicitud de prueba.
        
        Returns:
            Tupla (es_válida, mensaje_error)
        """
        if not self.is_available():
            return False, "API key no configurada"
        
        try:
            headers = {
                "Authorization": f"Client-ID {self.api_key.strip()}"
            }
            
            # Hacer una búsqueda simple de prueba
            params = {
                "query": "travel",
                "per_page": 1
            }
            
            response = requests.get(self.BASE_URL, headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                return True, None
            elif response.status_code == 401:
                return False, "API key no válida o no autorizada"
            elif response.status_code == 403:
                return False, "Acceso denegado. Verifica los límites de tu cuenta"
            else:
                return False, f"Error {response.status_code}: {response.text[:100]}"
                
        except Exception as e:
            return False, f"Error de conexión: {str(e)}"

