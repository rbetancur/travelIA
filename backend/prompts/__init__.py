"""
Módulo para cargar prompts optimizados en formato TOON desde archivos.
"""
import os
from pathlib import Path
from typing import Optional
from security import sanitize_user_input, escape_for_format


PROMPTS_DIR = Path(__file__).parent


def load_prompt(prompt_name: str, **kwargs) -> str:
    """
    Carga un prompt desde un archivo y aplica formato con variables.
    Sanitiza todas las variables de entrada antes de formatear para prevenir prompt injection.
    
    Args:
        prompt_name: Nombre del archivo de prompt (sin extensión .txt)
        **kwargs: Variables para formatear el prompt usando .format()
        
    Returns:
        Contenido del prompt formateado
        
    Raises:
        FileNotFoundError: Si el archivo de prompt no existe
    """
    prompt_path = PROMPTS_DIR / f"{prompt_name}.txt"
    
    if not prompt_path.exists():
        raise FileNotFoundError(
            f"Prompt '{prompt_name}' no encontrado en {PROMPTS_DIR}"
        )
    
    with open(prompt_path, 'r', encoding='utf-8') as f:
        prompt_content = f.read().strip()
    
    # Sanitizar y escapar variables antes de formatear
    if kwargs:
        sanitized_kwargs = {}
        for key, value in kwargs.items():
            if isinstance(value, str):
                # Sanitizar entrada del usuario
                # Usar límites apropiados según el tipo de variable
                if key == 'question':
                    max_length = 2000
                elif key == 'query':
                    max_length = 100
                elif key == 'destination' or key == 'current_destination':
                    max_length = 200
                elif key == 'conversation_history':
                    max_length = 5000  # El historial ya está sanitizado en conversation_history.py
                else:
                    max_length = 2000  # Por defecto
                
                # Sanitizar y escapar para .format()
                sanitized_value = sanitize_user_input(value, max_length=max_length)
                sanitized_kwargs[key] = escape_for_format(sanitized_value)
            else:
                # Para valores no-string, usar tal cual (pero convertirlos a string si es necesario)
                sanitized_kwargs[key] = escape_for_format(str(value)) if value is not None else ""
        
        # Aplicar formato con variables sanitizadas
        prompt_content = prompt_content.format(**sanitized_kwargs)
    
    return prompt_content


def get_prompt_path(prompt_name: str) -> Path:
    """
    Obtiene la ruta completa de un archivo de prompt.
    
    Args:
        prompt_name: Nombre del archivo de prompt (sin extensión .txt)
        
    Returns:
        Path al archivo de prompt
    """
    return PROMPTS_DIR / f"{prompt_name}.txt"

