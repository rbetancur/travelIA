# 📋 Comandos Principales - ViajeIA

## 🔧 Instalación Inicial (solo la primera vez)

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

---

## 🚀 Iniciar el Proyecto

### Configurar API Key (primero, solo una vez)

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

### Backend (Terminal 1)
```bash
cd backend
source venv/bin/activate        # En Windows: venv\Scripts\activate
# Asegúrate de que GEMINI_API_KEY esté configurada antes de ejecutar
uvicorn main:app --reload --port 8000
```

### Frontend (Terminal 2)
```bash
cd frontend
npm start
```

---

## 🌐 URLs de Acceso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentación API**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

---

## 📝 Notas

- El backend debe estar ejecutándose antes que el frontend
- El flag `--reload` en uvicorn permite recarga automática al cambiar código
- El frontend se abrirá automáticamente en el navegador al ejecutar `npm start`

---

## 🛑 Detener los Servidores

Presiona `Ctrl + C` en cada terminal donde estén corriendo los servidores.

