# 🔒 Configuración Segura de API Key

## ⚠️ Importante

**NUNCA** incluyas la API key en el código fuente o archivos del proyecto.

Este proyecto usa **SOLO variables de entorno del sistema** (no archivos .env).

---

## 🔑 Configurar API Key

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
echo 'export GEMINI_API_KEY=tu_api_key_aqui' >> ~/.zshrc
source ~/.zshrc
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

**Nota:** Después de configurar, reinicia la terminal o ejecuta `source ~/.zshrc` (o `source ~/.bashrc`).

---

## ✅ Verificar Configuración

```bash
echo $GEMINI_API_KEY            # Linux/Mac
$env:GEMINI_API_KEY             # Windows PowerShell
echo %GEMINI_API_KEY%           # Windows CMD
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

## 🔄 Rotar API Key

Si expusiste una API key por error:

1. Revoca la API key en [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Genera una nueva API key
3. Actualiza la variable de entorno

---

## 🚀 Producción

Para producción, usa **Secrets Managers**:
- AWS Secrets Manager
- Google Cloud Secret Manager
- Azure Key Vault
- Kubernetes Secrets
