# 🔧 Guía de Solución de Problemas - ViajeIA

Esta guía contiene soluciones a los problemas más comunes al trabajar con ViajeIA.

---

## ❌ Error: "Address already in use" (Puerto ocupado)

### Backend - Puerto 8000

**Síntoma:**
```
ERROR:    [Errno 48] Address already in use
```

**Causa:** Hay otra instancia del backend corriendo en el puerto 8000.

**Solución rápida:**
```bash
# Detener cualquier proceso en el puerto 8000
kill -9 $(lsof -ti:8000) 2>/dev/null

# Esperar un segundo
sleep 1

# Intentar iniciar el backend de nuevo
cd backend
./start_backend.sh
```

**Verificar qué proceso está usando el puerto:**
```bash
lsof -i:8000
```

---

### Frontend - Puerto 3000

**Síntoma:**
```
? Something is already running on port 3000. Probably:
  /usr/local/Cellar/node/24.1.0/bin/node ... (pid 27559)
```

**Causa:** Hay otra instancia del frontend corriendo en el puerto 3000.

**Solución rápida:**
```bash
# Opción 1: Usar el PID específico mostrado en el error
kill -9 27559

# Opción 2: Detener cualquier proceso en el puerto 3000
kill -9 $(lsof -ti:3000) 2>/dev/null

# Esperar un segundo
sleep 1

# Iniciar frontend
cd frontend
npm start
```

**Comando todo-en-uno:**
```bash
kill -9 $(lsof -ti:3000) 2>/dev/null && sleep 1 && cd frontend && npm start
```

---

## ⚠️ Warnings del Backend (No críticos)

### Warning: `importlib.metadata` has no attribute 'packages_distributions'

**Síntoma:**
```
An error occurred: module 'importlib.metadata' has no attribute 'packages_distributions'
```

**Causa:** Incompatibilidad menor entre versiones de Python y dependencias.

**Solución:** Este warning **no afecta la funcionalidad**. El backend funcionará correctamente. Puedes ignorarlo.

**Si quieres solucionarlo (opcional):**
```bash
cd backend
source venv/bin/activate
pip install --upgrade importlib-metadata
```

---

### Warning: Python 3.9.6 past its end of life

**Síntoma:**
```
FutureWarning: You are using a Python version (3.9.6) past its end of life.
Please upgrade to the latest Python version, or at least Python 3.10
```

**Causa:** Estás usando una versión de Python que ya no recibe soporte oficial.

**Solución:** 
- **Corto plazo:** Puedes ignorar este warning. El backend funcionará correctamente.
- **Largo plazo:** Considera actualizar a Python 3.10 o superior:
  ```bash
  # Ver versión actual
  python3 --version
  
  # Instalar Python 3.10+ (macOS con Homebrew)
  brew install python@3.10
  
  # Recrear el entorno virtual con la nueva versión
  cd backend
  python3.10 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  ```

---

### Warning: OpenSSL/LibreSSL

**Síntoma:**
```
NotOpenSSLWarning: urllib3 v2 only supports OpenSSL 1.1.1+, 
currently the 'ssl' module is compiled with 'LibreSSL 2.8.3'
```

**Causa:** Incompatibilidad menor entre urllib3 y la versión de SSL del sistema.

**Solución:** Este warning **no afecta la funcionalidad**. Puedes ignorarlo.

**Si quieres solucionarlo (opcional):**
```bash
cd backend
source venv/bin/activate
pip install 'urllib3<2.0'
```

---

## ❌ Error: "API key no configurada"

**Síntoma:**
```
⚠️  ADVERTENCIA: GEMINI_API_KEY no está configurada
```

**Solución:**

1. **Verificar si está configurada:**
   ```bash
   echo $GEMINI_API_KEY  # Linux/Mac
   ```

2. **Configurarla temporalmente (solo esta sesión):**
   ```bash
   export GEMINI_API_KEY=tu_api_key_aqui
   ```

3. **Configurarla permanentemente (recomendado):**
   
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

---

## ❌ Error: "No module named 'fastapi'"

**Síntoma:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Causa:** Las dependencias no están instaladas o el entorno virtual no está activado.

**Solución:**
```bash
cd backend
source venv/bin/activate  # Asegúrate de activar el entorno virtual
pip install -r requirements.txt
```

---

## ❌ Frontend no se conecta al backend

**Síntoma:** El frontend carga pero no puede comunicarse con el backend.

**Verificaciones:**

1. **¿El backend está corriendo?**
   ```bash
   curl http://localhost:8000/api/health
   ```
   Deberías ver: `{"status": "ok"}`

2. **¿El backend está en el puerto correcto?**
   - Backend debe estar en: `http://localhost:8000`
   - Frontend debe estar en: `http://localhost:3000`

3. **Revisar la consola del navegador:**
   - Abre las herramientas de desarrollador (F12)
   - Ve a la pestaña "Console" o "Red"
   - Busca errores de conexión

4. **Revisar logs del backend:**
   - Los logs aparecen en la terminal donde ejecutaste `uvicorn`
   - Busca errores o mensajes de conexión

**Solución:**
```bash
# Asegúrate de que ambos estén corriendo:
# Terminal 1: Backend
cd backend
./start_backend.sh

# Terminal 2: Frontend
cd frontend
npm start
```

---

## 🔍 Comandos de Diagnóstico

### Ver qué procesos están usando los puertos
```bash
# Puerto 8000 (Backend)
lsof -i:8000

# Puerto 3000 (Frontend)
lsof -i:3000
```

### Verificar que los servidores están corriendo
```bash
# Backend
curl http://localhost:8000/api/health

# Frontend (debería abrirse automáticamente)
open http://localhost:3000  # macOS
```

### Ver logs en tiempo real
```bash
# Los logs aparecen directamente en las terminales donde ejecutaste:
# - Backend: Terminal donde corre uvicorn
# - Frontend: Terminal donde corre npm start
```

---

## 🛑 Detener todos los procesos

### Detener backend y frontend
```bash
# Detener backend (puerto 8000)
kill -9 $(lsof -ti:8000) 2>/dev/null

# Detener frontend (puerto 3000)
kill -9 $(lsof -ti:3000) 2>/dev/null
```

### Detener todos los procesos de Node.js (cuidado)
```bash
killall node
```

---

## 📚 Recursos Adicionales

- **COMANDOS.md** - Referencia rápida de comandos
- **README.md** - Documentación principal del proyecto
- **SECRETS.md** - Gestión avanzada de secrets (producción)

---

## 💡 Tips

1. **Siempre inicia el backend antes que el frontend**
2. **Usa `Ctrl + C` para detener servidores de forma segura** (en lugar de cerrar la terminal)
3. **Si tienes problemas persistentes, recrea el entorno virtual:**
   ```bash
   cd backend
   rm -rf venv
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
4. **Para el frontend, si npm install falla:**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

---

**Última actualización:** Basado en problemas comunes encontrados durante el desarrollo.

