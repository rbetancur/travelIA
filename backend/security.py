"""
Módulo de seguridad para prevenir prompt injection y validar entradas del usuario.
Implementa sanitización, detección de inyección y validación de longitud.
"""
import re
import unicodedata
from typing import List, Dict, Tuple, Optional
from fastapi import HTTPException


# Patrones de detección de prompt injection (en español e inglés)
INJECTION_PATTERNS = [
    # Patrones en español
    r'ignora\s+(las\s+)?instrucciones\s+(anteriores|previas|del\s+sistema)',
    r'olvida\s+(todo\s+)?lo\s+anterior',
    r'eres\s+ahora\s+[^.]*',
    r'repite\s+(todas\s+)?las\s+instrucciones',
    r'no\s+sigas\s+(las\s+)?reglas',
    r'ignora\s+(el\s+)?prompt\s+(anterior|inicial)',
    r'actúa\s+como\s+[^.]*',
    r'desobedece\s+[^.]*',
    r'cambia\s+tu\s+(rol|personalidad|comportamiento)',
    r'ejecuta\s+[^.]*',
    r'mostrar\s+(el\s+)?prompt\s+(completo|original)',
    r'revelar\s+[^.]*',
    r'mostrar\s+(las\s+)?instrucciones',
    # Patrones en inglés
    r'ignore\s+(the\s+)?(previous|prior|system\s+)?instructions?',
    r'forget\s+(all\s+)?(the\s+)?previous',
    r'you\s+are\s+now\s+[^.]*',
    r'repeat\s+(all\s+)?(the\s+)?instructions?',
    r'don\'?t\s+follow\s+(the\s+)?rules?',
    r'ignore\s+(the\s+)?(previous\s+)?prompt',
    r'act\s+as\s+[^.]*',
    r'disobey\s+[^.]*',
    r'change\s+your\s+(role|personality|behavior)',
    r'execute\s+[^.]*',
    r'show\s+(the\s+)?(complete\s+)?prompt',
    r'reveal\s+[^.]*',
    r'display\s+(the\s+)?instructions?',
    # Patrones de escape de delimitadores
    r'<<<[^>]*>>>',
    r'###[^#]*###',
    r'```[^`]*```',
    r'---[^-]*---',
    r'\{\{[^}]*\}\}',
]

# Caracteres de control que deben ser eliminados
CONTROL_CHARS = re.compile(r'[\x00-\x1f\x7f-\x9f]')


def sanitize_user_input(text: str, max_length: int = 2000) -> str:
    """
    Sanitiza la entrada del usuario eliminando caracteres peligrosos y normalizando.
    
    Args:
        text: Texto a sanitizar
        max_length: Longitud máxima permitida
        
    Returns:
        Texto sanitizado
    """
    if not text:
        return ""
    
    # Convertir a string si no lo es
    text = str(text)
    
    # Normalizar unicode (NFD -> NFC)
    text = unicodedata.normalize('NFC', text)
    
    # Eliminar caracteres de control
    text = CONTROL_CHARS.sub('', text)
    
    # Normalizar espacios en blanco (múltiples espacios -> uno solo)
    text = re.sub(r'\s+', ' ', text)
    
    # Eliminar espacios al inicio y final
    text = text.strip()
    
    # Limitar longitud
    if len(text) > max_length:
        text = text[:max_length]
    
    return text


def detect_prompt_injection(text: str) -> Tuple[bool, str]:
    """
    Detecta intentos de prompt injection en el texto.
    
    Args:
        text: Texto a analizar
        
    Returns:
        Tupla (es_inyeccion: bool, razon: str)
    """
    if not text:
        return False, ""
    
    text_lower = text.lower()
    
    # Verificar cada patrón
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            return True, f"Patrón sospechoso detectado: {pattern}"
    
    # Detectar múltiples intentos de escape de delimitadores
    delimiter_attempts = len(re.findall(r'<<<|>>>|###|```|---|\{\{|\}\}', text))
    if delimiter_attempts >= 3:
        return True, "Múltiples intentos de escape de delimitadores detectados"
    
    return False, ""


def validate_input_length(text: str, field_name: str, min_length: int = 1, max_length: int = 2000) -> None:
    """
    Valida la longitud de una entrada y lanza excepción si es inválida.
    
    Args:
        text: Texto a validar
        field_name: Nombre del campo (para mensaje de error)
        min_length: Longitud mínima permitida
        max_length: Longitud máxima permitida
        
    Raises:
        HTTPException: Si la longitud es inválida
    """
    if not text:
        if min_length > 0:
            raise HTTPException(
                status_code=400,
                detail=f"El campo '{field_name}' no puede estar vacío"
            )
        return
    
    text_length = len(text)
    
    if text_length < min_length:
        raise HTTPException(
            status_code=400,
            detail=f"El campo '{field_name}' debe tener al menos {min_length} caracteres"
        )
    
    if text_length > max_length:
        raise HTTPException(
            status_code=400,
            detail=f"El campo '{field_name}' excede la longitud máxima de {max_length} caracteres"
        )


def sanitize_conversation_history(messages: List[Dict], max_message_length: int = 1000, max_total_length: int = 5000) -> str:
    """
    Sanitiza el historial de conversación antes de incluirlo en prompts.
    
    Args:
        messages: Lista de mensajes del historial
        max_message_length: Longitud máxima por mensaje
        max_total_length: Longitud máxima total del historial
        
    Returns:
        String con el historial sanitizado
    """
    if not messages:
        return ""
    
    sanitized_parts = []
    total_length = 0
    
    for msg in messages:
        if not isinstance(msg, dict):
            continue
        
        role = msg.get('role', 'unknown')
        content = msg.get('content', '')
        
        if not content or not isinstance(content, str):
            continue
        
        # Sanitizar contenido del mensaje
        sanitized_content = sanitize_user_input(content, max_message_length)
        
        # Detectar intentos de inyección
        is_injection, reason = detect_prompt_injection(sanitized_content)
        
        if is_injection:
            # Filtrar mensajes con intentos de inyección
            print(f"⚠️ [SECURITY] Mensaje filtrado por intento de inyección: {reason}")
            continue
        
        # Formatear mensaje
        role_name = "Usuario" if role == 'user' else "Mary"
        formatted_message = f"{role_name}: {sanitized_content}"
        
        # Verificar longitud total
        message_length = len(formatted_message)
        if total_length + message_length > max_total_length:
            # Truncar si excede el límite total
            remaining = max_total_length - total_length
            if remaining > 50:  # Solo incluir si queda espacio significativo
                formatted_message = formatted_message[:remaining] + "..."
                sanitized_parts.append(formatted_message)
            break
        
        sanitized_parts.append(formatted_message)
        total_length += message_length
    
    return "\n".join(sanitized_parts)


def escape_for_format(text: str) -> str:
    """
    Escapa caracteres especiales que podrían causar problemas en .format()
    
    Args:
        text: Texto a escapar
        
    Returns:
        Texto escapado
    """
    if not text:
        return ""
    
    # Escapar llaves que podrían ser interpretadas como placeholders
    text = text.replace('{', '{{').replace('}', '}}')
    
    return text


def add_delimiters(text: str, delimiter_type: str = "ENTRADA_USUARIO") -> str:
    """
    Agrega delimitadores alrededor del texto para separarlo de las instrucciones del sistema.
    
    Args:
        text: Texto a delimitar
        delimiter_type: Tipo de delimitador (ENTRADA_USUARIO, HISTORIAL, etc.)
        
    Returns:
        Texto con delimitadores
    """
    if not text:
        return ""
    
    return f"<<<{delimiter_type}>>>\n{text}\n<<</{delimiter_type}>>>"

