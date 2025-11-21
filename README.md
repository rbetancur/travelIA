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

- Interfaz moderna y responsiva con colores azules y blancos
- Campo de texto para preguntas sobre viajes
- Botón para enviar consultas
- Área de respuestas con diseño elegante
- Arquitectura separada frontend/backend
- CORS configurado para comunicación entre servicios

## 🔧 Tecnologías Utilizadas

- **Frontend**: React 18, Axios
- **Backend**: FastAPI, Uvicorn, Pydantic
- **Estilos**: CSS3 con gradientes y animaciones

## 📝 Próximos Pasos

- Integración con modelos de IA para respuestas más inteligentes
- Historial de conversaciones
- Guardado de planes de viaje
- Integración con APIs de viajes (vuelos, hoteles, etc.)

## 📄 Licencia

Este proyecto es de código abierto y está disponible para uso personal y educativo.

