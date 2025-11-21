# 🔒 Gestión Segura de Secrets (API Keys)

## ⚠️ Reglas de Oro

1. **NUNCA** incluyas API keys en el código fuente
2. **NUNCA** uses archivos `.env` en el proyecto (solo variables de entorno)
3. **SIEMPRE** usa variables de entorno del sistema o secrets managers
4. **SIEMPRE** valida que las variables de entorno estén configuradas antes de ejecutar

## 📍 Cómo Configurar la API Key de Gemini

**⚠️ IMPORTANTE:** Este proyecto usa SOLO variables de entorno del sistema. NO se usan archivos `.env` por seguridad.

### Método 1: Variable de Entorno del Sistema (Recomendado)

**Linux/Mac (Temporal - Solo para la sesión actual):**
```bash
export GEMINI_API_KEY=tu_api_key_real_aqui
```

**Linux/Mac (Permanente - Agregar a ~/.bashrc o ~/.zshrc):**
```bash
# Agregar al final del archivo
echo 'export GEMINI_API_KEY=tu_api_key_real_aqui' >> ~/.bashrc
# o para zsh
echo 'export GEMINI_API_KEY=tu_api_key_real_aqui' >> ~/.zshrc

# Recargar configuración
source ~/.bashrc  # o source ~/.zshrc
```

**Windows PowerShell (Temporal):**
```powershell
$env:GEMINI_API_KEY="tu_api_key_real_aqui"
```

**Windows PowerShell (Permanente):**
```powershell
[System.Environment]::SetEnvironmentVariable("GEMINI_API_KEY", "tu_api_key_real_aqui", "User")
```

**Windows CMD (Temporal):**
```cmd
set GEMINI_API_KEY=tu_api_key_real_aqui
```

**Windows CMD (Permanente):**
Configurar manualmente en: Panel de Control > Sistema > Configuración avanzada del sistema > Variables de entorno

**Verificar que está configurada:**
```bash
# Linux/Mac
echo $GEMINI_API_KEY

# Windows CMD
echo %GEMINI_API_KEY%

# Windows PowerShell
$env:GEMINI_API_KEY
```

### Método 2: Secrets Managers (Producción Avanzada)

#### Docker
```yaml
# docker-compose.yml
services:
  backend:
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}  # Lee de variables de entorno del host
```

#### Kubernetes
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: gemini-secret
type: Opaque
stringData:
  api-key: tu_api_key_aqui
```

#### AWS (Secrets Manager)
```python
import boto3
import json

def get_secret():
    client = boto3.client('secretsmanager')
    response = client.get_secret_value(SecretId='gemini-api-key')
    secret = json.loads(response['SecretString'])
    return secret['api_key']
```

#### Google Cloud (Secret Manager)
```python
from google.cloud import secretmanager

def get_secret(project_id, secret_id):
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{project_id}/secrets/{secret_id}/versions/latest"
    response = client.access_secret_version(request={"name": name})
    return response.payload.data.decode("UTF-8")
```

## 🔍 Verificar que la API Key Está Configurada

### Desde Python:
```python
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    # Mostrar solo parte por seguridad
    masked = f"{api_key[:10]}...{api_key[-4:]}"
    print(f"✅ API Key encontrada: {masked}")
else:
    print("❌ API Key no encontrada")
```

### Desde terminal:
```bash
# Verificar variable de entorno
echo $GEMINI_API_KEY  # Linux/Mac
echo %GEMINI_API_KEY%  # Windows CMD
$env:GEMINI_API_KEY   # Windows PowerShell

# Verificar que está configurada (mostrar solo primeros y últimos caracteres)
if [ -n "$GEMINI_API_KEY" ]; then
    masked="${GEMINI_API_KEY:0:10}...${GEMINI_API_KEY: -4}"
    echo "✅ API Key configurada: $masked"
else
    echo "❌ API Key no configurada"
fi
```

## 🛡️ Buenas Prácticas

### ✅ HACER:
- ✅ Usar SOLO variables de entorno del sistema
- ✅ Validar que la API key existe al iniciar la app
- ✅ Usar secrets managers en producción
- ✅ Rotar API keys periódicamente
- ✅ Configurar variables de entorno de forma permanente
- ✅ Verificar que las variables están configuradas antes de ejecutar

### ❌ NO HACER:
- ❌ Hardcodear API keys en el código
- ❌ Usar archivos `.env` en el proyecto
- ❌ Subir archivos con API keys a git
- ❌ Compartir API keys en chats, emails o documentos públicos
- ❌ Exponer API keys en logs o mensajes de error
- ❌ Usar la misma API key en desarrollo y producción

## 📝 Checklist de Seguridad

Antes de hacer commit:

- [ ] Verifico que no hay API keys en el código
- [ ] Verifico que `.env` está en `.gitignore`
- [ ] Verifico que `.env.example` no tiene valores reales
- [ ] Verifico que los logs no exponen la API key completa
- [ ] Si usé una API key por error, la revoco y creo una nueva

## 🔄 Rotar API Keys

Si expusiste una API key por error:

1. **Revoca la API key** en Google Cloud Console
2. **Genera una nueva** API key
3. **Actualiza** todas las variables de entorno/secrets
4. **Revisa** los logs por posibles accesos no autorizados

## 📚 Recursos

- [Google Cloud Secret Manager](https://cloud.google.com/secret-manager)
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- [12 Factor App - Config](https://12factor.net/config)
- [OWASP - Secrets Management](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_cryptographic_key)

