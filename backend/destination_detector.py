"""
Módulo para detectar y comparar destinos mencionados en preguntas del usuario.
Permite identificar cambios de destino explícitos e implícitos en la conversación.
"""
import re
from typing import Optional, Tuple
from weather import extract_destination_from_question


def normalize_destination(destination: str) -> str:
    """
    Normaliza un destino para comparación (minúsculas, sin acentos básicos)
    
    Args:
        destination: Destino en formato "Ciudad, País"
        
    Returns:
        Destino normalizado para comparación
    """
    if not destination:
        return ""
    
    # Convertir a minúsculas y limpiar espacios
    normalized = destination.lower().strip()
    
    # Remover acentos básicos (mejorable con unicode normalization)
    replacements = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
        'ñ': 'n', 'ü': 'u', 'ç': 'c'
    }
    for old, new in replacements.items():
        normalized = normalized.replace(old, new)
    
    return normalized


def extract_destination_from_text(text: str) -> Optional[str]:
    """
    Extrae cualquier destino mencionado en un texto
    Retorna en formato "Ciudad, País" o None
    
    Args:
        text: Texto del que extraer el destino
        
    Returns:
        Destino en formato "Ciudad, País" o None si no se encuentra
    """
    if not text:
        return None
    
    # Mapeo de ciudades comunes a formato completo "Ciudad, País"
    common_cities = {
        'parís': 'París, Francia',
        'paris': 'París, Francia',
        'madrid': 'Madrid, España',
        'barcelona': 'Barcelona, España',
        'valencia': 'Valencia, España',
        'sevilla': 'Sevilla, España',
        'roma': 'Roma, Italia',
        'rome': 'Roma, Italia',
        'milán': 'Milán, Italia',
        'milan': 'Milán, Italia',
        'venecia': 'Venecia, Italia',
        'venice': 'Venecia, Italia',
        'londres': 'Londres, Reino Unido',
        'london': 'Londres, Reino Unido',
        'tokio': 'Tokio, Japón',
        'tokyo': 'Tokio, Japón',
        'kyoto': 'Kioto, Japón',
        'kioto': 'Kioto, Japón',
        'nueva york': 'Nueva York, Estados Unidos',
        'new york': 'Nueva York, Estados Unidos',
        'los angeles': 'Los Ángeles, Estados Unidos',
        'san francisco': 'San Francisco, Estados Unidos',
        'miami': 'Miami, Estados Unidos',
        'chicago': 'Chicago, Estados Unidos',
        'bali': 'Bali, Indonesia',
        'bangkok': 'Bangkok, Tailandia',
        'dubai': 'Dubái, Emiratos Árabes Unidos',
        'sydney': 'Sídney, Australia',
        'amsterdam': 'Ámsterdam, Países Bajos',
        'berlín': 'Berlín, Alemania',
        'berlin': 'Berlín, Alemania',
        'múnich': 'Múnich, Alemania',
        'munich': 'Múnich, Alemania',
        'viena': 'Viena, Austria',
        'vienna': 'Viena, Austria',
        'praga': 'Praga, República Checa',
        'prague': 'Praga, República Checa',
        'lisboa': 'Lisboa, Portugal',
        'lisbon': 'Lisboa, Portugal',
        'atenas': 'Atenas, Grecia',
        'athens': 'Atenas, Grecia',
        'estambul': 'Estambul, Turquía',
        'istanbul': 'Estambul, Turquía',
        'moscú': 'Moscú, Rusia',
        'moscow': 'Moscú, Rusia',
        'buenos aires': 'Buenos Aires, Argentina',
        'río de janeiro': 'Río de Janeiro, Brasil',
        'rio de janeiro': 'Río de Janeiro, Brasil',
        'ciudad de méxico': 'Ciudad de México, México',
        'mexico city': 'Ciudad de México, México',
        'cancún': 'Cancún, México',
        'cancun': 'Cancún, México',
    }
    
    text_lower = text.lower()
    
    # Buscar ciudades comunes mencionadas sin país
    for city_key, full_destination in common_cities.items():
        if city_key in text_lower:
            return full_destination
    
    # Intentar usar la función existente de weather.py
    result = extract_destination_from_question(text)
    if result:
        city, country_code = result
        if city and country_code:
            # Convertir código de país a nombre (simplificado)
            country_names = {
                'ES': 'España', 'FR': 'Francia', 'IT': 'Italia', 'GB': 'Reino Unido',
                'US': 'Estados Unidos', 'JP': 'Japón', 'ID': 'Indonesia', 'TH': 'Tailandia',
                'AE': 'Emiratos Árabes Unidos', 'AU': 'Australia', 'NL': 'Países Bajos',
                'DE': 'Alemania', 'AT': 'Austria', 'CZ': 'República Checa', 'PT': 'Portugal',
                'GR': 'Grecia', 'TR': 'Turquía', 'RU': 'Rusia', 'AR': 'Argentina',
                'BR': 'Brasil', 'MX': 'México'
            }
            country_name = country_names.get(country_code, country_code)
            return f"{city}, {country_name}"
        elif city:
            return city
    
    # Buscar patrones de "Ciudad, País" en el texto
    pattern = r'([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*),\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)'
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        city = match.group(1).strip()
        country = match.group(2).strip()
        return f"{city}, {country}"
    
    return None


def compare_destinations(dest1: str, dest2: str) -> bool:
    """
    Compara dos destinos para determinar si son el mismo
    Retorna True si son iguales (normalizados), False si son diferentes
    
    Args:
        dest1: Primer destino en formato "Ciudad, País"
        dest2: Segundo destino en formato "Ciudad, País"
        
    Returns:
        True si los destinos son iguales, False en caso contrario
    """
    if not dest1 or not dest2:
        return False
    
    norm1 = normalize_destination(dest1)
    norm2 = normalize_destination(dest2)
    
    # Comparación exacta
    if norm1 == norm2:
        return True
    
    # Comparación por ciudad (si una contiene la otra)
    # Ej: "París" vs "París, Francia"
    city1 = norm1.split(',')[0].strip()
    city2 = norm2.split(',')[0].strip()
    
    if city1 == city2:
        return True
    
    return False


def detect_destination_change(
    current_destination: Optional[str],
    question: str
) -> Tuple[bool, Optional[str], bool]:
    """
    Detecta si hay un cambio de destino en la pregunta
    
    Args:
        current_destination: Destino actual de la conversación (puede ser None)
        question: Pregunta del usuario
        
    Returns:
        Tuple[is_change: bool, detected_destination: Optional[str], is_explicit: bool]
        - is_change: True si se detectó un destino diferente al actual
        - detected_destination: El destino detectado en la pregunta (si existe)
        - is_explicit: True si el cambio es explícito (usuario menciona nuevo destino claramente)
    """
    detected = extract_destination_from_text(question)
    
    if not detected:
        # No se detectó destino en la pregunta
        return (False, None, False)
    
    if not current_destination:
        # No hay destino actual, este es el primero
        return (False, detected, True)
    
    # Comparar destinos
    is_same = compare_destinations(current_destination, detected)
    
    if is_same:
        # Mismo destino
        return (False, detected, False)
    else:
        # Destino diferente detectado
        # Determinar si es explícito (palabras clave como "cambiar", "ahora", "quiero ir a")
        explicit_keywords = [
            'cambiar', 'cambio', 'ahora quiero', 'quiero ir a', 
            'mejor', 'prefiero', 'en lugar de', 'cambiar a', 'cambiar destino',
            'ahora', 'mejor destino', 'otro destino', 'diferente destino'
        ]
        question_lower = question.lower()
        is_explicit = any(keyword in question_lower for keyword in explicit_keywords)
        
        return (True, detected, is_explicit)

