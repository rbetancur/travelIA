# Guía de TOON (Token-Oriented Object Notation)

## ¿Qué es TOON?

**TOON (Token-Oriented Object Notation)** es un formato de datos diseñado específicamente para optimizar la comunicación con Modelos de Lenguaje de Gran Escala (LLMs) como Gemini, GPT, Claude, etc. A diferencia de JSON, TOON elimina caracteres redundantes y utiliza una estructura más eficiente basada en indentación y formato tabular.

## Ventajas de TOON sobre JSON

### 1. **Reducción de Tokens (30-60%)**
- **JSON**: Requiere llaves `{}`, corchetes `[]`, comillas `""`, comas `,` para cada elemento
- **TOON**: Declara campos una sola vez y usa formato tabular, eliminando redundancia
- **Ejemplo**: 100 filas de productos → JSON: 4,523 tokens | TOON: 1,892 tokens (58% menos)

### 2. **Mejor Precisión**
- TOON alcanza ~73.9% de precisión vs ~69.7% de JSON en tareas de recuperación de datos
- La estructura explícita facilita la comprensión del LLM

### 3. **Ahorro de Costos**
- Menos tokens = menos costo por llamada a la API
- En sistemas RAG con 10,000 consultas/día: ahorro de ~$2,700 diarios

### 4. **Mayor Capacidad en Contexto**
- Permite incluir 40-60% más datos en la misma ventana de contexto
- Especialmente útil para modelos con límites estrictos de tokens

## Reglas Generales para Usar TOON con LLMs

### ✅ CUÁNDO USAR TOON

1. **Arrays Uniformes de Objetos**
   - Cuando todos los objetos tienen los mismos campos
   - Ideal para catálogos, listas, resultados de búsqueda, tablas

2. **Datos Tabulares**
   - Información que se puede representar en formato tabla
   - Productos, usuarios, destinos, eventos, etc.

3. **Volumen de Datos Grande**
   - Cuando necesitas enviar/recibir muchos elementos
   - Cada ahorro de token se multiplica por el número de elementos

4. **Comunicación con LLMs**
   - Especialmente útil en prompts que requieren estructuras de datos
   - Respuestas estructuradas del LLM

### ❌ CUÁNDO NO USAR TOON

1. **Estructuras Profundamente Anidadas**
   - JSON es más claro para objetos complejos con múltiples niveles
   - TOON funciona mejor con estructuras planas o de 1-2 niveles

2. **Datos Heterogéneos**
   - Cuando los objetos tienen campos diferentes
   - JSON es más flexible para estructuras variables

3. **Compatibilidad con Sistemas Existentes**
   - Si otros sistemas esperan JSON estricto
   - Si necesitas interoperabilidad inmediata

4. **Datos Simples o Únicos**
   - Para un solo objeto o estructura simple, JSON es más legible
   - TOON brilla con múltiples elementos

## Sintaxis TOON

### Formato Básico: Lista Simple

**JSON:**
```json
["París, Francia", "Tokio, Japón", "Nueva York, Estados Unidos"]
```

**TOON:**
```
París, Francia
Tokio, Japón
Nueva York, Estados Unidos
```

### Formato Tabular: Objetos con Campos

**JSON:**
```json
[
  {"name": "París", "country": "Francia", "continent": "Europa"},
  {"name": "Tokio", "country": "Japón", "continent": "Asia"},
  {"name": "Nueva York", "country": "Estados Unidos", "continent": "América"}
]
```

**TOON (Formato 1 - Tabular con separador):**
```
name | country | continent
París | Francia | Europa
Tokio | Japón | Asia
Nueva York | Estados Unidos | América
```

**TOON (Formato 2 - Con dos puntos):**
```
name: París | country: Francia | continent: Europa
name: Tokio | country: Japón | continent: Asia
name: Nueva York | country: Estados Unidos | continent: América
```

**TOON (Formato 3 - Indentado):**
```
name: París
country: Francia
continent: Europa

name: Tokio
country: Japón
continent: Asia

name: Nueva York
country: Estados Unidos
continent: América
```

### Formato con Encabezado (Recomendado)

El formato más eficiente y claro para LLMs:

```
name | country | continent
París | Francia | Europa
Tokio | Japón | Asia
Nueva York | Estados Unidos | América
```

## Mejores Prácticas para Prompts con TOON

### 1. **Instrucciones Claras en el Prompt**

```python
prompt = """Devuelve la lista de destinos en formato TOON.

FORMATO TOON REQUERIDO:
- Primera línea: encabezados separados por |
- Líneas siguientes: valores separados por |
- NO uses JSON, usa TOON

Ejemplo:
name | country
París | Francia
Tokio | Japón

Responde SOLO con el formato TOON, sin explicaciones adicionales."""
```

### 2. **Especificar el Separador**

```python
prompt = """Usa formato TOON con separador | (pipe).

Formato:
campo1 | campo2 | campo3
valor1 | valor2 | valor3"""
```

### 3. **Validar y Parsear la Respuesta**

```python
def parse_toon_list(toon_text: str) -> list[str]:
    """
    Parsea una lista simple de TOON (una línea por elemento).
    """
    lines = [line.strip() for line in toon_text.strip().split('\n')]
    return [line for line in lines if line and not line.startswith('#')]

def parse_toon_table(toon_text: str) -> list[dict]:
    """
    Parsea una tabla TOON con encabezados.
    """
    lines = [line.strip() for line in toon_text.strip().split('\n') if line.strip()]
    if not lines:
        return []
    
    headers = [h.strip() for h in lines[0].split('|')]
    result = []
    
    for line in lines[1:]:
        values = [v.strip() for v in line.split('|')]
        if len(values) == len(headers):
            result.append(dict(zip(headers, values)))
    
    return result
```

### 4. **Manejo de Errores y Fallback**

```python
def parse_toon_with_fallback(response_text: str) -> list:
    """
    Intenta parsear TOON, si falla intenta JSON como fallback.
    """
    try:
        # Intentar TOON primero
        return parse_toon_table(response_text)
    except:
        try:
            # Fallback a JSON
            import json
            return json.loads(response_text)
        except:
            # Fallback a valores por defecto
            return []
```

## Ejemplos de Implementación

### Ejemplo 1: Lista Simple de Destinos

**Prompt:**
```python
prompt = """Devuelve exactamente 5 destinos turísticos populares en formato TOON.

FORMATO TOON (una línea por destino):
París, Francia
Tokio, Japón
Nueva York, Estados Unidos
Bali, Indonesia
Barcelona, España

Responde SOLO con los 5 destinos, uno por línea, sin numeración ni explicaciones."""
```

**Parser:**
```python
def parse_toon_destinations(toon_text: str) -> list[str]:
    lines = [line.strip() for line in toon_text.strip().split('\n')]
    return [line for line in lines if line and not line.startswith('#')][:5]
```

### Ejemplo 2: Tabla con Múltiples Campos

**Prompt:**
```python
prompt = """Devuelve destinos en formato TOON tabular.

FORMATO:
name | country | continent | popularity
París | Francia | Europa | Alta
Tokio | Japón | Asia | Alta

Responde SOLO con la tabla TOON."""
```

**Parser:**
```python
def parse_toon_destinations_table(toon_text: str) -> list[dict]:
    lines = [line.strip() for line in toon_text.strip().split('\n') if line.strip()]
    if not lines or '|' not in lines[0]:
        return []
    
    headers = [h.strip() for h in lines[0].split('|')]
    result = []
    
    for line in lines[1:]:
        if '|' in line:
            values = [v.strip() for v in line.split('|')]
            if len(values) == len(headers):
                result.append(dict(zip(headers, values)))
    
    return result
```

## Comparación de Eficiencia

### Ejemplo Real: 10 Destinos

**JSON (156 tokens):**
```json
[
  {"name": "París, Francia"},
  {"name": "Tokio, Japón"},
  {"name": "Nueva York, Estados Unidos"},
  {"name": "Bali, Indonesia"},
  {"name": "Barcelona, España"},
  {"name": "Roma, Italia"},
  {"name": "Londres, Reino Unido"},
  {"name": "Dubái, Emiratos Árabes Unidos"},
  {"name": "Singapur, Singapur"},
  {"name": "Bangkok, Tailandia"}
]
```

**TOON (67 tokens - 57% menos):**
```
París, Francia
Tokio, Japón
Nueva York, Estados Unidos
Bali, Indonesia
Barcelona, España
Roma, Italia
Londres, Reino Unido
Dubái, Emiratos Árabes Unidos
Singapur, Singapur
Bangkok, Tailandia
```

## Checklist para Implementar TOON

- [ ] Identificar endpoints que devuelven arrays uniformes
- [ ] Modificar prompts para solicitar formato TOON
- [ ] Crear funciones parser para TOON
- [ ] Implementar fallback a JSON si TOON falla
- [ ] Probar con diferentes casos de uso
- [ ] Medir reducción de tokens
- [ ] Documentar formato TOON esperado
- [ ] Actualizar tests si existen

## Referencias

- TOON está diseñado específicamente para LLMs
- Funciona mejor con modelos modernos (Gemini 2.0+, GPT-4, Claude 3+)
- La eficiencia aumenta con el número de elementos
- Siempre incluir fallback a JSON para robustez

---

**Última actualización**: 2025-01-27
**Versión**: 1.0

