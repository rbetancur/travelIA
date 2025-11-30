# Análisis del Sistema de Prompts - ViajeIA

## Paso 1: Analizar el Código Actual

### 1.1. Archivos de Prompts Utilizados

El sistema utiliza dos archivos principales de prompts según el tipo de respuesta:

#### **Prompt Estructurado (Formato JSON)**
- **Archivo**: `backend/prompts/travel_planning.txt`
- **Uso**: Cuando se requiere respuesta en formato JSON estructurado con 5 secciones
- **Ubicación en código**: `backend/main.py` línea 646
- **Tamaño**: 
  - **6,052 caracteres**
  - **90 líneas**
  - **Aproximadamente 1,513 tokens** (estimación: 1 token ≈ 4 caracteres)

#### **Prompt Contextualizado (Respuesta Conversacional)**
- **Archivo**: `backend/prompts/travel_contextual.txt`
- **Uso**: Cuando se requiere respuesta directa y conversacional (NO JSON)
- **Ubicación en código**: `backend/main.py` línea 707
- **Tamaño**: 
  - **2,126 caracteres**
  - **43 líneas**
  - **Aproximadamente 532 tokens** (estimación: 1 token ≈ 4 caracteres)

### 1.2. Estructura Actual del Prompt

#### **Prompt Estructurado (`travel_planning.txt`)**

El prompt está organizado en formato TOON (formato optimizado) con las siguientes secciones:

```
<<<INSTRUCCIONES_SISTEMA>>>
  - Definición de personalidad de Mary (consultora de viajes)
  - Formato de respuesta (JSON con 5 secciones)
  - Ejemplo de formato JSON
  - Secciones obligatorias (alojamiento, comida_local, lugares_imperdibles, consejos_locales, estimacion_costos)
  - Reglas importantes (estructura, información, cantidad, detalles, tono)
<<</INSTRUCCIONES_SISTEMA>>>

<<<ENTRADA_USUARIO>>>
  {question}
<<</ENTRADA_USUARIO>>>

<<<INSTRUCCIONES_SISTEMA>>>
  - Instrucción final
  - Reglas de respuesta (8 reglas detalladas sobre contexto, preguntas específicas, mapeo de temas, etc.)
<<</INSTRUCCIONES_SISTEMA>>>
```

**Características del prompt estructurado:**
- **Muy verboso**: Incluye definiciones extensas de personalidad, formato, ejemplos completos y múltiples reglas
- **Instrucciones repetitivas**: Las instrucciones del sistema aparecen dos veces (al inicio y al final)
- **Ejemplo completo**: Incluye un ejemplo JSON completo con 5 secciones y múltiples recomendaciones
- **Reglas detalladas**: 8 reglas específicas sobre cómo manejar diferentes tipos de preguntas

#### **Prompt Contextualizado (`travel_contextual.txt`)**

El prompt contextualizado es más conciso:

```
<<<INSTRUCCIONES_SISTEMA>>>
  - Definición de personalidad de Mary
  - Formato de respuesta (texto natural, NO JSON)
  - Reglas de respuesta (10 reglas)
<<</INSTRUCCIONES_SISTEMA>>>

<<<ENTRADA_USUARIO>>>
  {question}
<<</ENTRADA_USUARIO>>>

<<<HISTORIAL_CONVERSACION>>>
  {conversation_history}
<<</HISTORIAL_CONVERSACION>>>

<<<INSTRUCCIONES_SISTEMA>>>
  - Instrucción final
<<</INSTRUCCIONES_SISTEMA>>>
```

**Características del prompt contextualizado:**
- **Menos verboso**: Más conciso que el estructurado
- **Incluye historial**: Tiene una sección específica para el historial de conversación
- **Instrucciones repetitivas**: Las instrucciones del sistema también aparecen dos veces

### 1.3. Construcción Dinámica del Prompt

El prompt se construye dinámicamente en `backend/main.py` (líneas 644-713):

#### **Para Prompt Estructurado:**

1. **Carga del prompt base** (línea 646):
   ```python
   base_prompt = load_prompt("travel_planning", question=query.question)
   ```

2. **Añadido de contexto dinámico** (líneas 648-695):
   - Si hay contexto de conversación, se añade información adicional en formato TOON:
     - `destino | {current_destination}`
     - `historial | {recent_context}` (hasta 6 mensajes, máximo 5,000 caracteres)
     - `referencia | ...` (si la pregunta usa referencias)
     - `tema | ...` (si es pregunta específica)
     - `enfoque | ...` (instrucciones de enfoque)

3. **Combinación final**:
   ```python
   prompt = context_section + "\n\n" + base_prompt
   ```

#### **Para Prompt Contextualizado:**

1. **Carga del prompt base con variables** (líneas 707-711):
   ```python
   base_prompt = load_prompt("travel_contextual", 
       question=query.question,
       current_destination=current_destination or "el destino actual",
       conversation_history=conversation_context or "No hay historial previo"
   )
   ```

2. **El prompt ya incluye el historial** dentro del archivo mediante la variable `{conversation_history}`

### 1.4. Estimación de Tokens por Llamada

#### **Prompt Estructurado (Sin Historial):**
- Prompt base: ~1,513 tokens
- Pregunta del usuario: ~50-500 tokens (dependiendo de longitud)
- Contexto adicional (si hay destino): ~10-50 tokens
- **Total aproximado: 1,573 - 2,063 tokens**

#### **Prompt Estructurado (Con Historial):**
- Prompt base: ~1,513 tokens
- Pregunta del usuario: ~50-500 tokens
- Contexto adicional (destino): ~10-50 tokens
- Historial de conversación: ~100-1,250 tokens (hasta 5,000 caracteres = ~1,250 tokens)
- Instrucciones adicionales (formato TOON): ~20-100 tokens
- **Total aproximado: 1,693 - 3,413 tokens**

#### **Prompt Contextualizado (Sin Historial):**
- Prompt base: ~532 tokens
- Pregunta del usuario: ~50-500 tokens
- **Total aproximado: 582 - 1,032 tokens**

#### **Prompt Contextualizado (Con Historial):**
- Prompt base: ~532 tokens
- Pregunta del usuario: ~50-500 tokens
- Historial de conversación: ~100-1,250 tokens
- **Total aproximado: 682 - 2,282 tokens**

### 1.5. Instrucciones Repetidas en Cada Llamada

#### **Problemas Identificados:**

1. **Instrucciones del Sistema Duplicadas:**
   - En `travel_planning.txt`: Las instrucciones del sistema aparecen **dos veces**:
     - Al inicio (líneas 1-66)
     - Al final (líneas 72-90)
   - En `travel_contextual.txt`: Las instrucciones del sistema aparecen **dos veces**:
     - Al inicio (líneas 1-28)
     - Al final (líneas 38-42)

2. **Definición de Personalidad Repetida:**
   - La personalidad de Mary se define en ambos prompts y se envía en cada llamada
   - Incluye: nombre, rol, tono, emojis, actitud, enfoque

3. **Reglas Repetidas:**
   - Las reglas de formato y respuesta se repiten en cada llamada
   - En `travel_planning.txt`: 8 reglas detalladas (líneas 77-88)
   - En `travel_contextual.txt`: 10 reglas (líneas 16-27)

4. **Ejemplo Completo Repetido:**
   - En `travel_planning.txt`: Se incluye un ejemplo JSON completo con 5 secciones y múltiples recomendaciones (líneas 19-48)
   - Este ejemplo se envía en cada llamada aunque el modelo ya conoce el formato

5. **Contexto de Historial Potencialmente Repetitivo:**
   - El historial completo (hasta 5,000 caracteres) se puede incluir en cada llamada
   - Si hay 6 mensajes previos, se repiten en cada nueva pregunta

### 1.6. Verbosidad del Prompt

#### **Nivel de Verbosidad: ALTO**

**Prompt Estructurado:**
- **Muy verboso**: 6,052 caracteres de instrucciones
- Incluye definiciones extensas, ejemplos completos, múltiples secciones de instrucciones
- Formato TOON añade estructura pero también verbosidad adicional

**Prompt Contextualizado:**
- **Moderadamente verboso**: 2,126 caracteres
- Más conciso que el estructurado, pero aún incluye múltiples secciones de instrucciones

### 1.7. Resumen de Análisis

| Aspecto | Prompt Estructurado | Prompt Contextualizado |
|--------|---------------------|------------------------|
| **Archivo** | `travel_planning.txt` | `travel_contextual.txt` |
| **Tamaño (caracteres)** | 6,052 | 2,126 |
| **Tamaño (líneas)** | 90 | 43 |
| **Tokens aproximados (base)** | ~1,513 | ~532 |
| **Tokens con historial** | ~1,693 - 3,413 | ~682 - 2,282 |
| **Verbosidad** | Muy alto | Moderado |
| **Instrucciones duplicadas** | Sí (2 veces) | Sí (2 veces) |
| **Ejemplo incluido** | Sí (completo) | No |
| **Repetición de reglas** | Sí (8 reglas) | Sí (10 reglas) |

### 1.8. Oportunidades de Optimización Identificadas

1. **Eliminar duplicación de instrucciones del sistema**
2. **Mover definición de personalidad a configuración del modelo** (si es posible)
3. **Reducir o eliminar el ejemplo completo** (el modelo ya conoce el formato)
4. **Optimizar el historial** para incluir solo información relevante
5. **Consolidar reglas** en instrucciones más concisas
6. **Usar formato más compacto** manteniendo la claridad

