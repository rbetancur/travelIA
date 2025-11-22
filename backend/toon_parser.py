"""
Módulo para parsear respuestas TOON (Token-Oriented Object Notation) de LLMs.

TOON es un formato más eficiente que JSON para comunicarse con LLMs,
reduciendo el uso de tokens entre 30-60%.
"""
import re
from typing import List, Dict, Any, Optional


def parse_toon_list(toon_text: str) -> List[str]:
    """
    Parsea una lista simple de TOON (una línea por elemento).
    
    Ejemplo:
    Input:
        París, Francia
        Tokio, Japón
        Nueva York, Estados Unidos
    
    Output:
        ["París, Francia", "Tokio, Japón", "Nueva York, Estados Unidos"]
    
    Args:
        toon_text: Texto en formato TOON con un elemento por línea
        
    Returns:
        Lista de strings parseados
    """
    if not toon_text:
        return []
    
    lines = [line.strip() for line in toon_text.strip().split('\n')]
    # Filtrar líneas vacías y comentarios
    result = [
        line for line in lines 
        if line and not line.startswith('#') and not line.startswith('//')
    ]
    
    return result


def parse_toon_table(toon_text: str) -> List[Dict[str, str]]:
    """
    Parsea una tabla TOON con encabezados separados por | (pipe).
    
    Ejemplo:
    Input:
        name | country | continent
        París | Francia | Europa
        Tokio | Japón | Asia
    
    Output:
        [
            {"name": "París", "country": "Francia", "continent": "Europa"},
            {"name": "Tokio", "country": "Japón", "continent": "Asia"}
        ]
    
    Args:
        toon_text: Texto en formato TOON tabular con encabezados
        
    Returns:
        Lista de diccionarios parseados
    """
    if not toon_text:
        return []
    
    lines = [line.strip() for line in toon_text.strip().split('\n') if line.strip()]
    
    if not lines:
        return []
    
    # Buscar línea de encabezados (debe contener |)
    header_line_idx = None
    for i, line in enumerate(lines):
        if '|' in line:
            header_line_idx = i
            break
    
    if header_line_idx is None:
        # No hay formato tabular, intentar parsear como lista simple
        return []
    
    # Parsear encabezados
    headers = [h.strip() for h in lines[header_line_idx].split('|')]
    headers = [h for h in headers if h]  # Eliminar headers vacíos
    
    if not headers:
        return []
    
    # Parsear filas de datos
    result = []
    for line in lines[header_line_idx + 1:]:
        if not line or not '|' in line:
            continue
        
        values = [v.strip() for v in line.split('|')]
        
        # Ajustar longitud si hay diferencias
        if len(values) > len(headers):
            values = values[:len(headers)]
        elif len(values) < len(headers):
            values.extend([''] * (len(headers) - len(values)))
        
        # Crear diccionario
        row_dict = dict(zip(headers, values))
        result.append(row_dict)
    
    return result


def parse_toon_with_fallback(toon_text: str, fallback_to_json: bool = True) -> List[Any]:
    """
    Intenta parsear TOON, con fallback a JSON si falla.
    
    Args:
        toon_text: Texto a parsear (puede ser TOON o JSON)
        fallback_to_json: Si True, intenta parsear como JSON si TOON falla
        
    Returns:
        Lista parseada (strings o diccionarios)
    """
    if not toon_text:
        return []
    
    toon_text = toon_text.strip()
    
    # Intentar parsear como tabla TOON primero
    table_result = parse_toon_table(toon_text)
    if table_result:
        return table_result
    
    # Intentar parsear como lista simple TOON
    list_result = parse_toon_list(toon_text)
    if list_result:
        return list_result
    
    # Fallback a JSON si está habilitado
    if fallback_to_json:
        try:
            import json
            # Buscar JSON en el texto
            json_match = re.search(r'\[.*?\]', toon_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                parsed = json.loads(json_str)
                if isinstance(parsed, list):
                    return parsed
            
            # Intentar parsear todo el texto como JSON
            parsed = json.loads(toon_text)
            if isinstance(parsed, list):
                return parsed
        except (json.JSONDecodeError, ValueError):
            pass
    
    return []


def extract_toon_from_response(response_text: str) -> str:
    """
    Extrae el contenido TOON de una respuesta que puede contener texto adicional.
    
    Intenta encontrar el bloque TOON eliminando explicaciones previas o posteriores.
    
    Args:
        response_text: Texto completo de la respuesta del LLM
        
    Returns:
        Texto TOON limpio
    """
    if not response_text:
        return ""
    
    response_text = response_text.strip()
    
    # Buscar patrones comunes de inicio de TOON
    # 1. Línea que contiene | (formato tabular)
    # 2. Múltiples líneas sin caracteres especiales (formato lista)
    
    lines = response_text.split('\n')
    
    # Buscar primera línea con | (indicador de tabla TOON)
    start_idx = None
    for i, line in enumerate(lines):
        if '|' in line.strip():
            start_idx = i
            break
    
    if start_idx is not None:
        # Extraer desde la línea de encabezados hasta el final o hasta encontrar texto explicativo
        toon_lines = []
        for i in range(start_idx, len(lines)):
            line = lines[i].strip()
            # Detener si encontramos texto explicativo (sin | y muy corto o con puntuación final)
            if i > start_idx and '|' not in line:
                if len(line) < 3 or line.endswith('.') or line.endswith(':'):
                    break
            toon_lines.append(lines[i])
        return '\n'.join(toon_lines)
    
    # Si no hay formato tabular, buscar líneas consecutivas (formato lista)
    # Eliminar líneas que parecen explicaciones (muy cortas, con puntuación, etc.)
    clean_lines = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        # Filtrar líneas que parecen explicaciones
        if (line.startswith('#') or 
            line.startswith('//') or 
            (len(line) < 3 and line.endswith('.')) or
            line.lower().startswith('ejemplo') or
            line.lower().startswith('formato')):
            continue
        clean_lines.append(line)
    
    return '\n'.join(clean_lines)


def parse_destinations_toon(response_text: str) -> List[str]:
    """
    Parsea específicamente una lista de destinos en formato TOON.
    
    Maneja diferentes formatos:
    - Lista simple (una línea por destino)
    - Tabla con columna "name" o "destination"
    - Fallback a JSON si es necesario
    
    Args:
        response_text: Respuesta del LLM con destinos
        
    Returns:
        Lista de destinos (strings)
    """
    if not response_text:
        return []
    
    # Extraer TOON limpio
    clean_toon = extract_toon_from_response(response_text)
    
    # Intentar parsear como tabla
    table_result = parse_toon_table(clean_toon)
    if table_result:
        # Buscar columna con nombres de destinos
        for row in table_result:
            for key in ['name', 'destination', 'destino', 'ciudad', 'city']:
                if key in row and row[key]:
                    return [row[key] for row in table_result if row.get(key)]
        # Si no hay columna reconocida, usar primera columna
        if table_result and table_result[0]:
            first_key = list(table_result[0].keys())[0]
            return [row[first_key] for row in table_result if row.get(first_key)]
    
    # Intentar parsear como lista simple
    list_result = parse_toon_list(clean_toon)
    if list_result:
        return list_result
    
    # Fallback a JSON
    try:
        import json
        json_match = re.search(r'\[.*?\]', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            parsed = json.loads(json_str)
            if isinstance(parsed, list):
                return [str(item) for item in parsed if item]
    except (json.JSONDecodeError, ValueError):
        pass
    
    return []


