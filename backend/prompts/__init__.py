"""
Módulo para cargar prompts optimizados en formato TOON desde archivos.
"""
import os
from pathlib import Path
from typing import Optional


PROMPTS_DIR = Path(__file__).parent


def load_prompt(prompt_name: str, **kwargs) -> str:
    """
    Carga un prompt desde un archivo y aplica formato con variables.
    
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
    
    # Aplicar formato si hay variables
    if kwargs:
        prompt_content = prompt_content.format(**kwargs)
    
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

