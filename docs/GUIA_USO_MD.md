# 📖 Guía de Uso: Mejores Prácticas con Composer y Referencias @

Esta guía documenta las mejores prácticas para usar Composer (Cursor AI) con referencias a archivos mediante la sintaxis `@`, optimizando el uso de tokens y mejorando la precisión del contexto.

## 📋 Tabla de Contenidos

- [Introducción](#introducción)
- [Ventajas del Sistema de Referencias](#ventajas-del-sistema-de-referencias)
- [Cómo Referenciar Archivos](#cómo-referenciar-archivos)
- [Flujo de Trabajo con Composer](#flujo-de-trabajo-con-composer)
- [Mejores Prácticas](#mejores-prácticas)
- [Ejemplos Prácticos](#ejemplos-prácticos)
- [Consejos Avanzados](#consejos-avanzados)

---

## Introducción

Composer es la herramienta de IA integrada en Cursor que permite interactuar con tu código de manera eficiente. Una de sus características más poderosas es el sistema de referencias `@`, que te permite especificar exactamente qué archivos o documentación debe usar el modelo como contexto.

### ¿Por qué usar referencias @?

En lugar de que Cursor analice todo tu código base automáticamente (lo cual consume muchos tokens y puede incluir información irrelevante), puedes dirigir específicamente qué documentación o código debe considerar. Esto resulta en:

- **Reducción del 60-80% de tokens** utilizados
- **Contexto más preciso** y relevante
- **Documentación siempre actualizada** (el modelo lee directamente los archivos)
- **Fácil mantenimiento** (actualiza la documentación, no el prompt)

---

## Ventajas del Sistema de Referencias

### 1. Reducción del 60-80% de Tokens

**Sin referencias @:**
```
Cursor analiza automáticamente:
- Todo el código del proyecto (backend/, frontend/)
- Todos los archivos de configuración
- Todos los módulos y dependencias
- Archivos de test, logs, etc.

Resultado: 50,000+ tokens consumidos
```

**Con referencias @:**
```
Tú especificas:
@docs/API_DOCUMENTATION.md
@docs/ARQUITECTURA.md

Resultado: 5,000-10,000 tokens consumidos
Ahorro: 80% de tokens
```

### 2. Contexto Más Preciso

Al referenciar solo los archivos relevantes, el modelo:

- **No se distrae** con código no relacionado
- **Se enfoca** en la información específica que necesitas
- **Genera respuestas más precisas** basadas en el contexto exacto
- **Evita confusiones** con código legacy o experimental

### 3. Documentación Siempre Actualizada

Cuando usas `@docs/nombre_archivo.md`, el modelo:

- **Lee directamente** el archivo actualizado
- **No depende** de información desactualizada en el prompt
- **Se adapta automáticamente** a cambios en la documentación
- **Mantiene coherencia** con el estado actual del proyecto

### 4. Fácil Mantenimiento

En lugar de actualizar prompts largos y complejos:

- **Actualiza la documentación** una vez
- **Todas las referencias** se benefician automáticamente
- **Estructura clara** y organizada
- **Reutilizable** en múltiples conversaciones

---

## Cómo Referenciar Archivos

### Referencia a un Solo Archivo

Para referenciar un único archivo, usa la sintaxis `@` seguida de la ruta relativa:

```
@docs/API_DOCUMENTATION.md
```

**Ejemplo de uso:**
```
@docs/API_DOCUMENTATION.md

¿Cómo funciona el endpoint POST /api/travel? Explica los parámetros requeridos y la estructura de la respuesta.
```

### Referencia a Múltiples Archivos

Para referenciar varios archivos, simplemente lista múltiples referencias `@` en líneas separadas:

```
@docs/API_DOCUMENTATION.md
@docs/ARQUITECTURA.md
@backend/main.py
```

**Ejemplo de uso:**
```
@docs/API_DOCUMENTATION.md
@docs/ARQUITECTURA.md
@backend/security.py

Explica cómo funciona el flujo completo de validación de seguridad desde que el usuario envía una pregunta hasta que se procesa.
```

### Rutas Relativas y Absolutas

- **Rutas relativas**: Desde la raíz del proyecto
  ```
  @docs/API_DOCUMENTATION.md
  @backend/main.py
  @frontend/src/App.js
  ```

- **Rutas absolutas**: También funcionan
  ```
  @/Users/ruben/Documents/cursor/travelIA/docs/API_DOCUMENTATION.md
  ```

**Recomendación**: Usa rutas relativas para mayor portabilidad.

### Referencias a Directorios

También puedes referenciar directorios completos:

```
@backend/
@docs/
```

**Nota**: Esto incluirá todos los archivos del directorio, úsalo con precaución para evitar consumir demasiados tokens.

---

## Flujo de Trabajo con Composer

### Paso 1: Abrir Composer

Presiona `Cmd+I` (macOS) o `Ctrl+I` (Windows/Linux) para abrir Composer.

### Paso 2: Escribir Referencias @

Escribe las referencias a los archivos que quieres que el modelo considere:

```
@docs/API_DOCUMENTATION.md
@docs/ARQUITECTURA.md
```

### Paso 3: Hacer una Pregunta

Después de las referencias, escribe tu pregunta o instrucción:

```
@docs/API_DOCUMENTATION.md

¿Cuáles son los códigos de error posibles del endpoint POST /api/travel y qué significan?
```

### Paso 4: Cursor Usa Solo el Contexto Especificado

Cursor leerá únicamente los archivos referenciados y generará una respuesta basada en ese contexto específico.

**Ejemplo completo:**

```
@docs/API_DOCUMENTATION.md
@backend/validators.py

Explica cómo funciona la validación de la pregunta del usuario. Incluye los límites de longitud y las reglas de sanitización.
```

---

## Mejores Prácticas

### 1. Documentar APIs y Arquitectura

Mantén documentación actualizada de:

- **Endpoints de API**: Parámetros, respuestas, códigos de error
- **Arquitectura del sistema**: Componentes, flujos de datos, tecnologías
- **Configuración**: Variables de entorno, dependencias
- **Flujos de trabajo**: Procesos complejos, integraciones

**Ejemplo de estructura recomendada:**

```
docs/
├── API_DOCUMENTATION.md      # Documentación completa de endpoints
├── ARQUITECTURA.md           # Arquitectura y diseño del sistema
├── CONFIGURACION.md          # Configuración y variables de entorno
└── GUIA_USO_MD.md           # Esta guía
```

### 2. Mantener la Documentación Actualizada

**Regla de oro**: La documentación debe reflejar el estado actual del código.

- **Actualiza la documentación** cuando cambies el código
- **Revisa periódicamente** que la documentación esté sincronizada
- **Usa ejemplos reales** del código actual
- **Incluye versiones** o fechas de última actualización

**Ejemplo de formato:**

```markdown
## Endpoint POST /api/travel

**Última actualización**: 2024-01-15

### Parámetros
- `question` (requerido): String de 10-500 caracteres
- `destination` (opcional): Formato "Ciudad, País"
- `session_id` (opcional): UUID v4
```

### 3. Usar una Estructura Clara

Organiza la documentación de manera lógica:

- **Tabla de contenidos** para navegación fácil
- **Secciones bien definidas** con headers claros
- **Formato consistente** en toda la documentación
- **Ejemplos prácticos** en cada sección importante

**Estructura recomendada:**

```markdown
# Título Principal

## Tabla de Contenidos
- [Sección 1](#sección-1)
- [Sección 2](#sección-2)

## Sección 1
Contenido...

### Subsección 1.1
Contenido...

## Sección 2
Contenido...
```

### 4. Incluir Ejemplos de Código

Los ejemplos hacen que la documentación sea más útil:

- **Ejemplos de requests** y responses
- **Ejemplos de uso** de funciones o clases
- **Ejemplos de configuración**
- **Ejemplos de casos de error**

**Formato recomendado:**

```markdown
### Ejemplo de Request

```json
{
  "question": "¿Qué lugares debo visitar en París?",
  "destination": "París, Francia"
}
```

### Ejemplo de Response

```json
{
  "answer": "Para 3 días en París...",
  "weather": "15°C, Parcialmente nublado",
  "session_id": "123e4567-e89b-12d3-a456-426614174000"
}
```
```

### 5. Referenciar Archivos Específicos

En lugar de referenciar todo el proyecto:

✅ **Bueno:**
```
@docs/API_DOCUMENTATION.md
@backend/validators.py
```

❌ **Evitar:**
```
@backend/
@frontend/
```

### 6. Combinar Documentación y Código

Para preguntas técnicas complejas, combina:

- **Documentación** para contexto general
- **Código específico** para detalles de implementación

**Ejemplo:**
```
@docs/ARQUITECTURA.md
@backend/security.py
@backend/validators.py

Explica cómo funciona el sistema de validación y seguridad. Incluye el flujo completo desde la recepción de la petición hasta la validación final.
```

### 7. Usar Referencias Incrementales

Para preguntas de seguimiento, puedes agregar más contexto:

**Primera pregunta:**
```
@docs/API_DOCUMENTATION.md

¿Qué endpoints están disponibles?
```

**Seguimiento:**
```
@docs/API_DOCUMENTATION.md
@backend/main.py

Ahora explícame cómo está implementado el endpoint POST /api/travel
```

---

## Ejemplos Prácticos

### Ejemplo 1: Consulta sobre API

**Prompt:**
```
@docs/API_DOCUMENTATION.md

¿Cuáles son los parámetros requeridos para el endpoint POST /api/travel y qué validaciones se aplican?
```

**Resultado esperado:**
- Respuesta basada únicamente en `API_DOCUMENTATION.md`
- Información precisa sobre parámetros y validaciones
- Ejemplos del documento

### Ejemplo 2: Consulta sobre Arquitectura

**Prompt:**
```
@docs/ARQUITECTURA.md
@docs/API_DOCUMENTATION.md

Explica el flujo completo desde que un usuario envía una pregunta hasta que recibe la respuesta. Incluye todos los componentes involucrados.
```

**Resultado esperado:**
- Flujo detallado basado en ambos documentos
- Referencias a componentes específicos
- Diagrama o descripción paso a paso

### Ejemplo 3: Consulta Técnica Específica

**Prompt:**
```
@docs/API_DOCUMENTATION.md
@backend/security.py
@backend/validators.py

¿Cómo funciona la detección de prompt injection? Explica el proceso completo y qué patrones se detectan.
```

**Resultado esperado:**
- Explicación técnica basada en el código real
- Detalles de implementación
- Ejemplos de patrones detectados

### Ejemplo 4: Desarrollo de Nueva Feature

**Prompt:**
```
@docs/ARQUITECTURA.md
@docs/API_DOCUMENTATION.md
@backend/main.py

Quiero agregar un nuevo endpoint GET /api/destinations/recommendations que devuelva recomendaciones personalizadas. ¿Cómo debería estructurarlo siguiendo los patrones existentes?
```

**Resultado esperado:**
- Sugerencias basadas en la arquitectura existente
- Ejemplos siguiendo los patrones del proyecto
- Consideraciones de diseño

---

## Consejos Avanzados

### 1. Crear Documentos de Referencia Rápida

Crea documentos específicos para consultas frecuentes:

```
docs/
├── QUICK_REFERENCE.md      # Referencia rápida de endpoints
├── ERROR_CODES.md          # Códigos de error y soluciones
└── DEPLOYMENT_CHECKLIST.md # Checklist de despliegue
```

### 2. Usar Comentarios en el Código

Complementa la documentación con comentarios claros en el código:

```python
def validate_question(question: str) -> str:
    """
    Valida y sanitiza la pregunta del usuario.
    
    Reglas:
    - Longitud: 10-500 caracteres
    - Sanitiza caracteres de control
    - Detecta prompt injection
    
    Returns:
        str: Pregunta validada y sanitizada
        
    Raises:
        ValueError: Si la pregunta no cumple las reglas
    """
    # Implementación...
```

### 3. Mantener Documentación Modular

Divide la documentación en módulos temáticos:

- Un documento por tema principal
- Referencias cruzadas entre documentos
- Fácil de mantener y actualizar

### 4. Incluir Diagramas y Visualizaciones

Para conceptos complejos, incluye:

- Diagramas de flujo (texto o imágenes)
- Tablas comparativas
- Ejemplos visuales

### 5. Versionar la Documentación

Mantén un historial de cambios:

```markdown
## Historial de Cambios

- **2024-01-15**: Agregado endpoint POST /api/realtime-info
- **2024-01-10**: Actualizada validación de sesiones
- **2024-01-05**: Documentación inicial
```

---

## Resumen de Ventajas

| Aspecto | Sin Referencias @ | Con Referencias @ |
|---------|-------------------|-------------------|
| **Tokens consumidos** | 50,000+ | 5,000-10,000 (60-80% menos) |
| **Precisión** | Variable (mucho ruido) | Alta (contexto específico) |
| **Velocidad** | Lenta (análisis completo) | Rápida (solo archivos relevantes) |
| **Mantenimiento** | Actualizar prompts | Actualizar documentación |
| **Reutilización** | Limitada | Alta (documentación reutilizable) |

---

## Checklist de Mejores Prácticas

- [ ] Documentación organizada en `docs/`
- [ ] Cada documento tiene tabla de contenidos
- [ ] Ejemplos de código incluidos
- [ ] Fechas de última actualización
- [ ] Referencias cruzadas entre documentos
- [ ] Estructura clara y consistente
- [ ] Documentación sincronizada con código
- [ ] Archivos de referencia rápida creados
- [ ] Comentarios en código complementan documentación

---

## Recursos Adicionales

- [Documentación de Cursor](https://cursor.sh/docs)
- [Guía de Markdown](https://www.markdownguide.org/)
- [Mejores Prácticas de Documentación](https://www.writethedocs.org/guide/)

---

**Última actualización**: 2025-11-29

