"""
Módulo para cargar prompts optimizados en formato TOON desde archivos.
"""
import os
from pathlib import Path
from typing import Optional
from security import sanitize_user_input, escape_for_format


PROMPTS_DIR = Path(__file__).parent

# Cache para el system prompt
_system_prompt_cache: Optional[str] = None


def load_system_prompt() -> str:
    """
    Carga el prompt de sistema reutilizable.
    Usa cache para evitar leer el archivo múltiples veces.
    
    Returns:
        Contenido del system prompt
    """
    global _system_prompt_cache
    
    if _system_prompt_cache is None:
        system_prompt_path = PROMPTS_DIR / "system_prompt.txt"
        if system_prompt_path.exists():
            with open(system_prompt_path, 'r', encoding='utf-8') as f:
                _system_prompt_cache = f.read().strip()
        else:
            _system_prompt_cache = ""
    
    return _system_prompt_cache


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
    
    # Si el prompt contiene {system_prompt}, reemplazarlo con el system prompt reutilizable
    if '{system_prompt}' in prompt_content:
        system_prompt = load_system_prompt()
        prompt_content = prompt_content.replace('{system_prompt}', system_prompt)
    
    # Sanitizar y escapar variables antes de formatear
    if kwargs:
        sanitized_kwargs = {}
        for key, value in kwargs.items():
            if isinstance(value, str):
                # Sanitizar entrada del usuario
                # Usar límites apropiados según el tipo de variable
                if key == 'question':
                    # Importar constante de validators para mantener consistencia
                    from validators import MAX_QUESTION_LENGTH
                    max_length = MAX_QUESTION_LENGTH
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


def build_optimized_prompt(question: str, prompt_type: str = "structured", destination: Optional[str] = None) -> str:
    """
    Construye un prompt ultra-optimizado combinando directamente el system prompt
    con la pregunta validada y limpia, eliminando contexto redundante.
    
    Args:
        question: Pregunta del usuario (será validada y limpiada)
        prompt_type: Tipo de prompt ("structured" o "contextual")
        destination: Destino opcional (solo si es crítico)
        
    Returns:
        Prompt optimizado listo para usar
    """
    from validators import MAX_QUESTION_LENGTH, MIN_QUESTION_LENGTH
    from security import sanitize_user_input, validate_input_length
    
    # 1. Validar y limpiar la pregunta
    try:
        validate_input_length(question, "question", min_length=MIN_QUESTION_LENGTH, max_length=MAX_QUESTION_LENGTH)
    except Exception as e:
        raise ValueError(f"Pregunta inválida: {str(e)}")
    
    cleaned_question = sanitize_user_input(question, max_length=MAX_QUESTION_LENGTH)
    
    # 2. Cargar system prompt reutilizable
    system_prompt = load_system_prompt()
    
    # 3. Construir prompt mínimo según tipo
    if prompt_type == "structured":
        # Prompt estructurado: system + formato JSON + pregunta
        prompt = f"""{system_prompt}

Responde en JSON con 5 secciones: alojamiento, comida_local, lugares_imperdibles, consejos_locales, estimacion_costos.
Cada sección: array de strings con recomendaciones detalladas (mínimo 3-5).

Pregunta: {cleaned_question}"""
    else:
        # Prompt contextual: system + formato conversacional + pregunta
        destination_text = f" sobre {destination}" if destination else ""
        prompt = f"""{system_prompt}

Responde de forma conversacional y directa (NO JSON), 2-4 párrafos{destination_text}.

Pregunta: {cleaned_question}"""
    
    return prompt

