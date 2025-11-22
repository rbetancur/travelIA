# 🔒 Configuración Segura de API Keys

## ⚠️ Importante

**NUNCA** incluyas las API keys en el código fuente o archivos del proyecto.

Este proyecto usa **SOLO variables de entorno del sistema** (no archivos .env).

---

## 🔑 API Keys Requeridas

Este proyecto necesita **2 API keys**:

1. **GEMINI_API_KEY**: Para Google Gemini AI (obligatoria)
2. **OPENWEATHER_API_KEY**: Para OpenWeatherMap (opcional, pero recomendada para mostrar clima)

---

## 🌐 1. Google Gemini API Key

### Obtener la API Key

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Create API Key" o "Get API Key"
4. Copia la API key generada

### Configurar API Key

### Método 1: Temporal (Solo para esta sesión)

**Linux/Mac:**
```bash
export GEMINI_API_KEY=tu_api_key_aqui
```

**Windows (PowerShell):**
```powershell
$env:GEMINI_API_KEY="tu_api_key_aqui"
```

**Windows (CMD):**
```cmd
set GEMINI_API_KEY=tu_api_key_aqui
```

### Método 2: Permanente (Recomendado)

**Linux/Mac (zsh):**
```bash
# Agregar a .zshrc
echo 'export GEMINI_API_KEY=tu_api_key_aqui' >> ~/.zshrc

# Para la sesión actual (evita error de compdef)
export GEMINI_API_KEY=tu_api_key_aqui

# O simplemente abre una nueva terminal
```

**Linux/Mac (bash):**
```bash
echo 'export GEMINI_API_KEY=tu_api_key_aqui' >> ~/.bashrc
source ~/.bashrc
```

**Windows (PowerShell):**
```powershell
[System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY', 'tu_api_key_aqui', 'User')
```

**Windows (GUI):**
Configurar en: Panel de Control > Sistema > Variables de Entorno

**Nota:** 
- Para zsh: Después de agregar a `.zshrc`, exporta la variable en la sesión actual o abre una nueva terminal (evita el error `compdef` al ejecutar `source ~/.zshrc`).
- Para bash: Después de configurar, reinicia la terminal o ejecuta `source ~/.bashrc`.

---

---

## 🌤️ 2. OpenWeatherMap API Key

### Obtener la API Key (GRATUITA)

1. Ve a [OpenWeatherMap](https://openweathermap.org/api)
2. Haz clic en "Sign Up" (registrarse) en la parte superior derecha
3. Completa el formulario de registro:
   - Username: elige un nombre de usuario
   - Email: tu correo electrónico
   - Password: crea una contraseña
   - Confirma tu email
4. Una vez registrado, ve a tu [API Keys](https://home.openweathermap.org/api_keys)
5. Verás una API key por defecto llamada "Default" - **esta es tu API key gratuita**
6. Copia la API key (tiene el formato: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

### Plan Gratuito de OpenWeatherMap

El plan gratuito incluye:
- ✅ 60 llamadas por minuto
- ✅ 1,000,000 llamadas por mes
- ✅ Datos del clima actual
- ✅ Datos de pronóstico (5 días)
- ✅ Más que suficiente para uso personal/proyectos pequeños

### ⚠️ IMPORTANTE: Activación de la API Key

**Después de registrarte, la API key puede tardar hasta 2 horas en activarse.**

Si recibes un error **401 (Unauthorized)**:

1. **Confirma tu email**: Revisa tu correo y haz clic en el enlace de confirmación
2. **Espera la activación**: La API key puede tardar hasta 2 horas en activarse después de confirmar el email
3. **Verifica la API key**: Ve a [API Keys](https://home.openweathermap.org/api_keys) y verifica que esté activa
4. **Copia la API key correctamente**: Asegúrate de copiar toda la key sin espacios adicionales
5. **Prueba manualmente**: Puedes probar la API key directamente:
   ```bash
   curl "https://api.openweathermap.org/data/2.5/weather?q=London&appid=TU_API_KEY&units=metric"
   ```
   Si funciona, deberías recibir datos JSON del clima de Londres.

### Configurar API Key

**Método 1: Temporal (Solo para esta sesión)**

**Linux/Mac:**
```bash
export OPENWEATHER_API_KEY=tu_api_key_aqui
```

**Windows (PowerShell):**
```powershell
$env:OPENWEATHER_API_KEY="tu_api_key_aqui"
```

**Windows (CMD):**
```cmd
set OPENWEATHER_API_KEY=tu_api_key_aqui
```

**Método 2: Permanente (Recomendado)**

**Linux/Mac (zsh):**
```bash
# Agregar a .zshrc
echo 'export OPENWEATHER_API_KEY=tu_api_key_aqui' >> ~/.zshrc

# Para la sesión actual (evita error de compdef)
export OPENWEATHER_API_KEY=tu_api_key_aqui

# O simplemente abre una nueva terminal
```

**Linux/Mac (bash):**
```bash
echo 'export OPENWEATHER_API_KEY=tu_api_key_aqui' >> ~/.bashrc
source ~/.bashrc
```

**Windows (PowerShell):**
```powershell
[System.Environment]::SetEnvironmentVariable('OPENWEATHER_API_KEY', 'tu_api_key_aqui', 'User')
```

**Windows (GUI):**
Configurar en: Panel de Control > Sistema > Variables de Entorno

**Nota:** 
- Para zsh: Después de agregar a `.zshrc`, exporta la variable en la sesión actual o abre una nueva terminal (evita el error `compdef` al ejecutar `source ~/.zshrc`).
- Para bash: Después de configurar, reinicia la terminal o ejecuta `source ~/.bashrc`.

---

## ✅ Verificar Configuración

### Verificar Gemini API Key
```bash
echo $GEMINI_API_KEY            # Linux/Mac
$env:GEMINI_API_KEY             # Windows PowerShell
echo %GEMINI_API_KEY%           # Windows CMD
```

### Verificar OpenWeatherMap API Key
```bash
echo $OPENWEATHER_API_KEY       # Linux/Mac
$env:OPENWEATHER_API_KEY        # Windows PowerShell
echo %OPENWEATHER_API_KEY%      # Windows CMD
```

---

## 🛡️ Buenas Prácticas

### ✅ HACER:
- Usar variables de entorno del sistema
- Configurar de forma permanente
- Rotar API keys periódicamente

### ❌ NO HACER:
- Hardcodear API keys en el código
- Usar archivos `.env` en el proyecto
- Subir API keys a git
- Compartir API keys públicamente

---

## 🔄 Rotar API Keys

Si expusiste una API key por error:

### Gemini API Key
1. Revoca la API key en [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Genera una nueva API key
3. Actualiza la variable de entorno `GEMINI_API_KEY`

### OpenWeatherMap API Key
1. Ve a [OpenWeatherMap API Keys](https://home.openweathermap.org/api_keys)
2. Elimina o regenera la API key comprometida
3. Genera una nueva API key
4. Actualiza la variable de entorno `OPENWEATHER_API_KEY`

---

## 🚀 Producción

Para producción, usa **Secrets Managers**:
- AWS Secrets Manager
- Google Cloud Secret Manager
- Azure Key Vault
- Kubernetes Secrets

---

## 🔧 Solución de Problemas

### Error 401 (Unauthorized) con OpenWeatherMap

Si ves este error en los logs del backend:
```
❌ ERROR 401: API key de OpenWeatherMap no válida o no activada
```

**Soluciones:**

1. **Verifica que hayas confirmado tu email**
   - Revisa tu correo electrónico
   - Busca el email de OpenWeatherMap
   - Haz clic en el enlace de confirmación

2. **Espera la activación**
   - La API key puede tardar hasta 2 horas en activarse
   - Después de confirmar el email, espera un poco

3. **Verifica la API key**
   - Ve a https://home.openweathermap.org/api_keys
   - Asegúrate de que la API key esté visible y activa
   - Copia la API key completa (32 caracteres)

4. **Prueba la API key manualmente**
   ```bash
   # Reemplaza TU_API_KEY con tu API key real
   curl "https://api.openweathermap.org/data/2.5/weather?q=London&appid=TU_API_KEY&units=metric"
   ```
   - Si funciona, deberías ver datos JSON
   - Si ves `{"cod":401, "message": "Invalid API key"}`, la key no es válida

5. **Verifica que no haya espacios**
   - Asegúrate de copiar la API key sin espacios al inicio o final
   - Ejemplo correcto: `cc21e5de64f21a487c2af69fb373a4e0`
   - Ejemplo incorrecto: ` cc21e5de64f21a487c2af69fb373a4e0 ` (con espacios)

6. **Regenera la API key si es necesario**
   - Ve a https://home.openweathermap.org/api_keys
   - Elimina la API key antigua
   - Genera una nueva
   - Configúrala de nuevo en tu sistema

### El clima no se muestra aunque la API key esté configurada

1. **Revisa los logs del backend**
   - Deberías ver: `✅ API key de OpenWeatherMap válida y funcionando`
   - Si ves errores, sigue las instrucciones arriba

2. **Verifica que el destino se extraiga correctamente**
   - Los logs mostrarán: `✅ Destino extraído: Ciudad, País`
   - Si no se extrae, prueba con formato: "Quiero viajar a Barcelona, España"

3. **Revisa la consola del navegador**
   - Abre DevTools (F12) > Console
   - Deberías ver: `🌤️ Clima recibido: ...`
   - Si ves `null`, el clima no está llegando del backend
