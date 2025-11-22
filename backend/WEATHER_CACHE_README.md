# 📦 Sistema de Cache para Clima

## 🎯 Objetivo

Reducir las solicitudes a la API de OpenWeatherMap mediante un sistema de cache inteligente que:
- Almacena datos del clima en memoria
- Reutiliza datos cacheados antes de hacer nuevas solicitudes
- Mantiene los datos actualizados con un TTL (Time To Live)
- Evita reintentos innecesarios si la API no está disponible

## ⚙️ Características

### 1. Cache en Memoria
- Almacena datos del clima por ciudad/país
- Clave única basada en ciudad y país normalizados
- Datos persistentes durante la ejecución del servidor

### 2. TTL (Time To Live)
- **Duración por defecto**: 30 minutos (1800 segundos)
- Los datos se consideran válidos durante este tiempo
- Después de expirar, se actualizan automáticamente en la próxima solicitud

### 3. Sin Reintentos
- Si la API falla (401, 429, error de conexión), se marca como no disponible
- No se hacen más intentos hasta reiniciar el servidor
- Evita saturar la API con solicitudes fallidas

### 4. Limpieza Automática
- Limpieza lazy de entradas expiradas (10% de probabilidad por solicitud)
- No impacta el rendimiento
- Mantiene el cache optimizado

## 📊 Flujo de Funcionamiento

```
1. Solicitud de clima para "Barcelona, ES"
   ↓
2. ¿Está en cache?
   ├─ SÍ → ¿Ha expirado?
   │   ├─ NO → Retornar datos del cache ✅
   │   └─ SÍ → Eliminar del cache, continuar
   └─ NO → Continuar
   ↓
3. ¿API disponible?
   ├─ NO → Retornar None (sin reintentos) ⚠️
   └─ SÍ → Continuar
   ↓
4. Hacer solicitud a OpenWeatherMap API
   ↓
5. ¿Solicitud exitosa?
   ├─ SÍ → Guardar en cache, retornar datos ✅
   └─ NO → Marcar API como no disponible, retornar None ❌
```

## 🔧 Configuración

### TTL Personalizado

Puedes configurar un TTL diferente al inicializar el servicio:

```python
from weather import WeatherService

# TTL de 1 hora (3600 segundos)
weather_service = WeatherService(cache_ttl_seconds=3600)

# TTL de 15 minutos (900 segundos)
weather_service = WeatherService(cache_ttl_seconds=900)
```

### Criterio de Actualización

**TTL por defecto: 30 minutos**

Este tiempo es un balance óptimo porque:
- El clima no cambia tan rápido (no necesitamos actualizaciones cada minuto)
- Reduce significativamente las solicitudes a la API
- Mantiene los datos razonablemente actualizados
- Respeta los límites de la API gratuita (60 llamadas/minuto)

## 📈 Estadísticas del Cache

### Endpoint de Estadísticas

```bash
GET /api/weather/cache/stats
```

Respuesta:
```json
{
  "cache_stats": {
    "total_entries": 5,
    "valid_entries": 4,
    "expired_entries": 1,
    "ttl_seconds": 1800,
    "ttl_minutes": 30
  },
  "api_available": true
}
```

### Limpiar Cache Manualmente

```bash
POST /api/weather/cache/clear
```

Respuesta:
```json
{
  "message": "Cache limpiado exitosamente",
  "cleared": true
}
```

## 🚫 Sin Reintentos

El sistema **NO hace reintentos** si:
- Error 401 (API key inválida)
- Error 429 (Límite excedido)
- Error de conexión
- Cualquier error HTTP crítico

**Razón**: Evitar saturar la API y desperdiciar recursos cuando sabemos que fallará.

**Solución**: Reiniciar el servidor después de corregir el problema (ej: configurar API key válida).

## 📝 Logs

El sistema genera logs informativos:

### Cache Hit (Datos encontrados en cache)
```
📦 Cache HIT para barcelona,es (válido por 25 min 30 seg más)
```

### Cache Miss (No encontrado, se consulta API)
```
📦 Cache MISS para paris,fr (no encontrado en cache)
🌐 Consultando API de OpenWeatherMap para: Paris, FR
✅ Clima obtenido y guardado en cache
```

### Cache Expirado
```
⏰ Cache expirado para london,gb, será actualizado en la próxima solicitud
```

### API No Disponible
```
⚠️ API de OpenWeatherMap no disponible, no se harán más intentos
```

## 💡 Beneficios

1. **Reducción de Solicitudes**: Si 10 usuarios consultan "Barcelona" en 30 minutos, solo se hace 1 solicitud a la API
2. **Mejor Rendimiento**: Respuestas instantáneas desde cache
3. **Respeto a Límites**: No excede los límites de la API gratuita
4. **Datos Actualizados**: TTL de 30 minutos mantiene datos razonablemente frescos
5. **Sin Reintentos**: Evita saturar la API con solicitudes fallidas

## 🔄 Reinicio del Servidor

Al reiniciar el servidor:
- El cache se limpia (es en memoria)
- El flag `api_unavailable` se resetea
- Se pueden hacer nuevas solicitudes a la API

## 📊 Ejemplo de Uso

```python
# Primera solicitud para Barcelona
weather_data = weather_service.get_weather("Barcelona", "ES")
# → Consulta API, guarda en cache

# Segunda solicitud (dentro de 30 min)
weather_data = weather_service.get_weather("Barcelona", "ES")
# → Retorna desde cache (más rápido)

# Tercera solicitud (después de 30 min)
weather_data = weather_service.get_weather("Barcelona", "ES")
# → Cache expirado, consulta API, actualiza cache
```

## 🛠️ Mantenimiento

### Ver Estadísticas
```bash
curl http://localhost:8000/api/weather/cache/stats
```

### Limpiar Cache
```bash
curl -X POST http://localhost:8000/api/weather/cache/clear
```

### Ver Logs
Los logs aparecen en la consola donde ejecutaste el servidor.

