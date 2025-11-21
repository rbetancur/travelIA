# ViajeIA - Tu Asistente Personal de Viajes

Aplicación web moderna para asistencia en planificación de viajes, construida con React (frontend) y Python FastAPI (backend).

## 🏗️ Arquitectura

El proyecto está dividido en dos partes principales:

- **Frontend**: React aplicación cliente
- **Backend**: API REST con FastAPI

## ⚡ Inicio Rápido

### Primera vez (instalación inicial)

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### Comandos para iniciar (después de la instalación)

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # En Windows: venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### URLs de acceso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentación API**: http://localhost:8000/docs

## 🚀 Instalación y Configuración Detallada

### Backend

1. Navega al directorio del backend:
```bash
cd backend
```

2. Crea un entorno virtual (recomendado):
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

3. Instala las dependencias:
```bash
pip install -r requirements.txt
```

4. Ejecuta el servidor:
```bash
uvicorn main:app --reload --port 8000
```

El backend estará disponible en `http://localhost:8000`
La documentación automática de la API estará en `http://localhost:8000/docs`

### Frontend

1. Navega al directorio del frontend:
```bash
cd frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Ejecuta la aplicación en modo desarrollo:
```bash
npm start
```

El frontend se abrirá automáticamente en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
ViajeIA/
├── backend/
│   ├── main.py              # Aplicación FastAPI
│   └── requirements.txt     # Dependencias de Python
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js           # Componente principal
│   │   ├── App.css          # Estilos del componente
│   │   ├── index.js         # Punto de entrada
│   │   └── index.css        # Estilos globales
│   └── package.json         # Dependencias de Node.js
└── README.md
```

## 🎨 Características

- ✅ Interfaz moderna y responsiva con colores azules y blancos
- ✅ Campo de texto para preguntas sobre viajes
- ✅ Botón para enviar consultas
- ✅ Área de respuestas con diseño elegante
- ✅ Arquitectura separada frontend/backend
- ✅ CORS configurado para comunicación entre servicios
- ✅ **Integrado con Google Gemini** para respuestas inteligentes sobre viajes

## 🤖 Integración con Google Gemini

El proyecto está integrado con Google Gemini AI para generar respuestas inteligentes y detalladas sobre planificación de viajes.

**Configuración de la API Key (Variable de Entorno):**

La API key se configura mediante una variable de entorno del sistema. **NO se usan archivos .env** por seguridad.

**Linux/Mac:**
```bash
export GEMINI_API_KEY=tu_api_key_de_gemini_aqui
```

**Windows (PowerShell):**
```powershell
$env:GEMINI_API_KEY="tu_api_key_de_gemini_aqui"
```

**Windows (CMD):**
```cmd
set GEMINI_API_KEY=tu_api_key_de_gemini_aqui
```

**Para hacerlo permanente:**
- Linux/Mac: Agrega el comando `export` a tu `~/.bashrc` o `~/.zshrc`
- Windows: Configura en las variables de entorno del sistema (Panel de Control)

**Verificar que está configurada:**
```bash
echo $GEMINI_API_KEY  # Linux/Mac
echo %GEMINI_API_KEY%  # Windows CMD
$env:GEMINI_API_KEY   # Windows PowerShell
```

Ver `SECRETS.md` para más opciones avanzadas (Docker, Kubernetes, Cloud Secrets).

**Modelo utilizado:** `gemini-2.0-flash` (100% gratuito, rápido y eficiente)

⚠️ **IMPORTANTE:** El proyecto está configurado para usar **SOLO modelos GRATUITOS** de Gemini (Flash). Los modelos Pro están bloqueados para evitar costos inesperados. Ver `backend/MODELOS_GRATUITOS.md` para más detalles.

## 🔧 Tecnologías Utilizadas

- **Frontend**: React 18, Axios
- **Backend**: FastAPI, Uvicorn, Pydantic
- **IA**: Google Gemini AI
- **Estilos**: CSS3 con gradientes y animaciones

## 📝 Próximos Pasos

- ✅ Integración con Google Gemini
- Historial de conversaciones
- Guardado de planes de viaje
- Integración con APIs de viajes (vuelos, hoteles, etc.)
- Mejoras en el prompt para respuestas más personalizadas

## 📄 Licencia

Este proyecto es de código abierto y está disponible para uso personal y educativo.

