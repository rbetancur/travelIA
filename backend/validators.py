"""
Validadores Pydantic personalizados para validar y sanitizar entradas del usuario.
"""
from typing import Optional
from pydantic import field_validator
from pydantic_core import ValidationError
from security import (
    sanitize_user_input,
    detect_prompt_injection,
    validate_input_length
)
import re
import uuid


def validate_question(value: str) -> str:
    """
    Valida y sanitiza una pregunta del usuario.
    
    Args:
        value: Pregunta a validar
        
    Returns:
        Pregunta sanitizada
        
    Raises:
        ValidationError: Si la pregunta es inválida o contiene intentos de inyección
    """
    if not value or not isinstance(value, str):
        raise ValidationError("La pregunta no puede estar vacía")
    
    # Validar longitud
    try:
        validate_input_length(value, "question", min_length=1, max_length=2000)
    except Exception as e:
        raise ValidationError(str(e))
    
    # Sanitizar entrada
    sanitized = sanitize_user_input(value, max_length=2000)
    
    # Detectar prompt injection
    is_injection, reason = detect_prompt_injection(sanitized)
    if is_injection:
        print(f"⚠️ [SECURITY] Intento de prompt injection detectado en pregunta: {reason}")
        raise ValidationError("La entrada contiene contenido no permitido")
    
    return sanitized


def validate_destination(value: Optional[str]) -> Optional[str]:
    """
    Valida y sanitiza un destino en formato "Ciudad, País".
    
    Args:
        value: Destino a validar
        
    Returns:
        Destino sanitizado o None
        
    Raises:
        ValidationError: Si el destino es inválido
    """
    if value is None:
        return None
    
    if not isinstance(value, str):
        raise ValidationError("El destino debe ser una cadena de texto")
    
    # Validar longitud
    try:
        validate_input_length(value, "destination", min_length=1, max_length=200)
    except Exception as e:
        raise ValidationError(str(e))
    
    # Sanitizar entrada
    sanitized = sanitize_user_input(value, max_length=200)
    
    # Validar formato básico (debe contener al menos una coma para "Ciudad, País")
    # Pero permitir otros formatos también
    if len(sanitized) < 3:
        raise ValidationError("El destino es demasiado corto")
    
    # Detectar prompt injection
    is_injection, reason = detect_prompt_injection(sanitized)
    if is_injection:
        print(f"⚠️ [SECURITY] Intento de prompt injection detectado en destino: {reason}")
        raise ValidationError("El destino contiene contenido no permitido")
    
    # Validar caracteres permitidos (letras, números, espacios, comas, guiones, acentos)
    if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s,\-\.]+$', sanitized):
        raise ValidationError("El destino contiene caracteres no permitidos")
    
    return sanitized


def validate_search_query(value: str) -> str:
    """
    Valida y sanitiza una consulta de búsqueda de destinos.
    
    Args:
        value: Consulta a validar
        
    Returns:
        Consulta sanitizada
        
    Raises:
        ValidationError: Si la consulta es inválida o contiene intentos de inyección
    """
    if not value or not isinstance(value, str):
        raise ValidationError("La consulta de búsqueda no puede estar vacía")
    
    # Validar longitud
    try:
        validate_input_length(value, "query", min_length=1, max_length=100)
    except Exception as e:
        raise ValidationError(str(e))
    
    # Sanitizar entrada
    sanitized = sanitize_user_input(value, max_length=100)
    
    # Detectar prompt injection
    is_injection, reason = detect_prompt_injection(sanitized)
    if is_injection:
        print(f"⚠️ [SECURITY] Intento de prompt injection detectado en búsqueda: {reason}")
        raise ValidationError("La consulta contiene contenido no permitido")
    
    return sanitized


def validate_session_id(value: Optional[str]) -> Optional[str]:
    """
    Valida y sanitiza un session ID (debe ser un UUID válido).
    
    Args:
        value: Session ID a validar
        
    Returns:
        Session ID sanitizado o None
        
    Raises:
        ValidationError: Si el session ID es inválido
    """
    if value is None:
        return None
    
    if not isinstance(value, str):
        raise ValidationError("El session ID debe ser una cadena de texto")
    
    # Sanitizar entrada
    sanitized = sanitize_user_input(value, max_length=100)
    
    # Validar formato UUID
    try:
        uuid.UUID(sanitized)
    except ValueError:
        raise ValidationError("El session ID no tiene un formato válido (UUID)")
    
    return sanitized

