# 🌍 ViajeIA - Asistente Personal de Viajes

Aplicación web para planificación de viajes con inteligencia artificial, construida con React y FastAPI.

## 🚀 Inicio Rápido (5 Pasos)

### Paso 1: Obtener API Key de Google Gemini

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Crea una nueva API Key
4. Copia la API Key (la necesitarás en el Paso 3)

### Paso 2: Instalar Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Paso 3: Configurar API Key

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

> 💡 **Para hacerlo permanente:** Agrega el comando a `~/.bashrc` o `~/.zshrc` (Linux/Mac) o configura en Variables de Entorno (Windows).

### Paso 4: Iniciar Backend

```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

Deberías ver: `✅ API Key de Gemini configurada`

### Paso 5: Iniciar Frontend

En una **nueva terminal**:

```bash
cd frontend
npm install  # Solo la primera vez
npm start
```

La aplicación se abrirá automáticamente en `http://localhost:3000`

---

## ✅ Verificación

### ¿Funciona el backend?
Visita: http://localhost:8000/api/health

Deberías ver: `{"status": "ok"}`

### ¿Funciona el frontend?
Visita: http://localhost:3000

Deberías ver la interfaz de ViajeIA.

---

## 📋 URLs Importantes

- **Aplicación**: http://localhost:3000
- **API Backend**: http://localhost:8000
- **Documentación API**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

---

## 🔧 Solución de Problemas

### ❌ Error: "API key no configurada"

**Solución:** Verifica que la variable de entorno esté configurada:

```bash
echo $GEMINI_API_KEY  # Linux/Mac
$env:GEMINI_API_KEY   # Windows PowerShell
```

Si no aparece nada, vuelve al Paso 3.

### ❌ Error: "No module named 'fastapi'"

**Solución:** Activa el entorno virtual e instala dependencias:

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### ❌ Frontend no se conecta al backend

**Solución:** Asegúrate de que:
1. El backend esté corriendo en `http://localhost:8000`
2. No haya errores en la consola del backend
3. El frontend esté en `http://localhost:3000`

---

## 🤖 Modelo de IA

El proyecto usa **`gemini-2.0-flash`** (100% gratuito) por defecto.

✅ **Modelos gratuitos disponibles:**
- `gemini-2.0-flash` (por defecto)
- `gemini-2.5-flash`
- `gemini-flash-latest`

Para cambiar el modelo:

```bash
export GEMINI_MODEL=gemini-2.5-flash
```

> ⚠️ **Importante:** Solo se permiten modelos Flash (gratuitos). Los modelos Pro están bloqueados automáticamente.

---

## 📁 Estructura del Proyecto

```
ViajeIA/
├── backend/
│   ├── main.py           # API FastAPI
│   └── requirements.txt  # Dependencias Python
└── frontend/
    ├── src/
    │   └── App.js        # Componente principal React
    └── package.json      # Dependencias Node.js
```

---

## 🛑 Detener los Servidores

Presiona `Ctrl + C` en cada terminal donde estén corriendo.

---

## 📚 Documentación Adicional

- **`COMANDOS.md`** - Referencia rápida de comandos
- **`SECRETS.md`** - Gestión avanzada de secrets (producción)

---

## 🎯 Tecnologías

- **Frontend**: React 18
- **Backend**: FastAPI, Python 3.9+
- **IA**: Google Gemini AI
- **Comunicación**: REST API, CORS configurado

---

## 📄 Licencia

Código abierto para uso personal y educativo.
