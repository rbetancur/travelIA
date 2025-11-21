# 📋 Comandos de Referencia Rápida

## 🔧 Instalación (Solo Primera Vez)

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

---

## 🚀 Iniciar el Proyecto

### 1. Configurar API Key (Solo Primera Vez)

**Configuración Permanente (Recomendado):**

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

**Configuración Temporal (Solo esta sesión):**
```bash
export GEMINI_API_KEY=tu_api_key_aqui  # Linux/Mac
```

### 2. Iniciar Backend (Terminal 1)

**Opción A: Usando el script de inicio (Recomendado)**
```bash
cd backend
./start_backend.sh
```

**Opción B: Manual**
```bash
cd backend
source venv/bin/activate        # Windows: venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Iniciar Frontend (Terminal 2)
```bash
cd frontend
npm start
```

---

## ✅ Verificar Configuración

### Verificar API Key
```bash
echo $GEMINI_API_KEY            # Linux/Mac
$env:GEMINI_API_KEY             # Windows PowerShell
echo %GEMINI_API_KEY%           # Windows CMD
```

### Verificar Backend
```bash
curl http://localhost:8000/api/health
```

---

## 🌐 URLs

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

---

## 🛑 Detener Servidores

Presiona `Ctrl + C` en cada terminal.

---

## 🔄 Comandos Útiles

### Activar entorno virtual (Backend)
```bash
cd backend
source venv/bin/activate        # Windows: venv\Scripts\activate
```

### Ver logs del backend
Los logs aparecen en la terminal donde ejecutaste `uvicorn`

### Reiniciar frontend
Presiona `Ctrl + C` y ejecuta `npm start` de nuevo

---

## 📝 Notas

- El backend debe iniciarse **antes** que el frontend
- El flag `--reload` permite recarga automática del backend
- El frontend se abre automáticamente en el navegador
