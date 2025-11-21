# 🔧 Configuración de Google Gemini

## 📍 Ubicaciones Importantes

### 1. **API Key de Gemini**
**Ubicación:** Variable de entorno del sistema

**⚠️ IMPORTANTE:** 
- La API key NUNCA debe estar en el código fuente
- El proyecto usa SOLO variables de entorno del sistema (NO archivos .env)
- Esto es más seguro y apropiado para producción

**Configurar la API key como variable de entorno:**

#### Linux/Mac:
```bash
# Temporal (solo para la sesión actual)
export GEMINI_API_KEY=tu_api_key_de_gemini_aqui

# Permanente (agregar a ~/.bashrc o ~/.zshrc)
echo 'export GEMINI_API_KEY=tu_api_key_de_gemini_aqui' >> ~/.bashrc
source ~/.bashrc
```

#### Windows (PowerShell):
```powershell
# Temporal (solo para la sesión actual)
$env:GEMINI_API_KEY="tu_api_key_de_gemini_aqui"

# Permanente (usar variables de entorno del sistema)
[System.Environment]::SetEnvironmentVariable("GEMINI_API_KEY", "tu_api_key_de_gemini_aqui", "User")
```

#### Windows (CMD):
```cmd
# Temporal
set GEMINI_API_KEY=tu_api_key_de_gemini_aqui

# Permanente: Configurar en Panel de Control > Sistema > Variables de entorno
```

**Verificar que está configurada:**
```bash
echo $GEMINI_API_KEY  # Linux/Mac
echo %GEMINI_API_KEY%  # Windows CMD
$env:GEMINI_API_KEY   # Windows PowerShell
```

#### Opciones Avanzadas (Producción):
- **Docker**: Variables de entorno en docker-compose.yml o Dockerfile
- **Cloud**: AWS Secrets Manager, Google Secret Manager, Azure Key Vault
- **Kubernetes**: Kubernetes Secrets
- Ver `SECRETS.md` para más detalles

### 2. **Modelo de Gemini**
**Ubicación:** `backend/main.py` (línea 67)

```python
model = genai.GenerativeModel('gemini-2.0-flash')
```

**Para cambiar el modelo:**
1. Abre el archivo `backend/main.py`
2. En la línea 67, cambia el nombre del modelo entre comillas
3. Guarda el archivo
4. El servidor se recargará automáticamente (si usas `--reload`)

## 🤖 Modelos Disponibles de Gemini

### ⚠️ IMPORTANTE: Solo Modelos Gratuitos

Este proyecto está configurado para usar **SOLO modelos GRATUITOS** de Gemini para evitar costos inesperados.

### ✅ Modelos Gratuitos Permitidos (Flash):

- **`gemini-2.0-flash`** ⚡ (Modelo por defecto - 100% gratuito)
- **`gemini-2.5-flash`** ⚡ (Más reciente y rápido - 100% gratuito)
- **`gemini-2.0-flash-lite`** 💨 (Ultra rápido - 100% gratuito)
- **`gemini-flash-latest`** 🎯 (Versión más reciente - 100% gratuito)
- **`gemini-pro-latest`** ⚠️ (Gratuito con límites de uso)

### ❌ Modelos de Pago (NO Permitidos):

- **`gemini-2.5-pro`** ❌ (De pago - NO permitido)
- **`gemini-2.0-pro`** ❌ (De pago - NO permitido)
- **`gemini-pro`** ❌ (Versiones antiguas, pueden tener costo - NO permitido)

### Modelos Especializados:

- **`gemini-2.5-flash-image`** (Para imágenes)
- **`gemini-2.5-flash-preview-tts`** (Text-to-speech)

## 📝 Ejemplo de Cambio

### Cambiar de `gemini-2.0-flash` a `gemini-2.5-flash`:

**Antes:**
```python
model = genai.GenerativeModel('gemini-2.0-flash')
```

**Después:**
```python
model = genai.GenerativeModel('gemini-2.5-flash')
```

## 🔒 Seguridad

- El archivo `.env` está en `.gitignore` para proteger tu API key
- **NUNCA** subas tu API key a repositorios públicos
- Si compartes el código, usa `.env.example` como plantilla

## 🧪 Verificar Modelos Disponibles

Si quieres ver todos los modelos disponibles, ejecuta:

```bash
cd backend
source venv/bin/activate
python3 -c "import google.generativeai as genai; import os; from dotenv import load_dotenv; load_dotenv(); genai.configure(api_key=os.getenv('GEMINI_API_KEY')); models = genai.list_models(); print('\n'.join([m.name for m in models if 'generateContent' in m.supported_generation_methods]))"
```

## ⚠️ Notas Importantes

- ✅ **Solo modelos Flash:** Todos los modelos Flash son 100% gratuitos
- ✅ **Sin costos:** El código valida que solo se usen modelos gratuitos
- ❌ **NO modelos Pro:** Los modelos Pro (excepto `gemini-pro-latest`) son de pago y NO están permitidos
- 🛡️ **Protección:** El código rechazará automáticamente modelos de pago
- 📚 **Ver:** `MODELOS_GRATUITOS.md` para más detalles sobre modelos gratuitos vs de pago

