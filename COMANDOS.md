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

### Backend (Terminal 1)
```bash
cd backend
source venv/bin/activate        # En Windows: venv\Scripts\activate
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

