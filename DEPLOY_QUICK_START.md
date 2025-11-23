# 🚀 Despliegue Rápido - TravelIA

## ⚡ Inicio Rápido (5 minutos)

### 1️⃣ Frontend en Vercel (2 minutos)

1. Ve a [vercel.com](https://vercel.com) y haz login con GitHub
2. Click en **"Add New Project"**
3. Importa tu repositorio `travelIA`
4. Configura:
   - **Root Directory:** `frontend`
   - **Framework:** Create React App (auto-detectado)
5. Agrega variable de entorno:
   ```
   REACT_APP_API_URL=https://tu-backend.railway.app
   ```
   (Actualiza esto después de desplegar el backend)
6. Click **"Deploy"** ✅

### 2️⃣ Backend en Railway (3 minutos)

1. Ve a [railway.app](https://railway.app) y haz login con GitHub
2. Click en **"New Project"** → **"Deploy from GitHub repo"**
3. Selecciona tu repositorio y el directorio `backend`
4. En **Variables**, agrega:
   ```
   GEMINI_API_KEY=tu_key
   OPENWEATHER_API_KEY=tu_key
   UNSPLASH_ACCESS_KEY=tu_key
   ENVIRONMENT=production
   ```
5. Railway desplegará automáticamente ✅
6. Copia la URL generada (ej: `https://travelia-backend.railway.app`)
7. **Actualiza `REACT_APP_API_URL` en Vercel** con esta URL

### 3️⃣ ¡Listo! 🎉

Tu app está online:
- Frontend: `https://tu-app.vercel.app`
- Backend: `https://tu-backend.railway.app/docs`

---

## 📚 Guía Completa

Para más detalles, consulta [DEPLOYMENT.md](./DEPLOYMENT.md)

