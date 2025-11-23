# 🚀 Despliegue Rápido - TravelIA

## ⚡ Inicio Rápido (5 minutos)

### 1️⃣ Frontend en Vercel (2 minutos)

1. Ve a [vercel.com](https://vercel.com) y haz login con GitHub
2. Click en **"Add New Project"**
3. Importa tu repositorio `travelIA`
4. **IMPORTANTE - Nombre del proyecto:**
   - En el campo **"Private Repository Name"**, cambia `travelIA` a `travelia` (todo minúsculas)
   - Vercel solo permite nombres en minúsculas, números y caracteres `.`, `_`, `-`
5. **IMPORTANTE - Cambiar rama:**
   - Después de importar, en la sección **"Configure Project"**
   - Busca el campo **"Production Branch"** o **"Branch"**
   - Cambia de `main` a `release/v1.0.0` (o la rama donde están tus cambios)
6. Configura:
   - **Root Directory:** `frontend`
   - **Framework:** Create React App (auto-detectado)
7. Agrega variable de entorno:
   ```
   REACT_APP_API_URL=https://tu-backend.railway.app
   ```
   (Actualiza esto después de desplegar el backend)
8. Click **"Create"** o **"Deploy"** ✅

**Nota:** Si no ves la opción de cambiar rama durante la configuración inicial, puedes hacerlo después:
- Ve a **Settings** → **Git** → **Production Branch**
- Cambia a `release/v1.0.0` y guarda

### 2️⃣ Backend en Railway (3 minutos)

1. Ve a [railway.app](https://railway.app) y haz login con GitHub
2. Click en **"New Project"** → **"Deploy from GitHub repo"**
3. Selecciona tu repositorio `travelIA`
4. **IMPORTANTE - Cambiar rama y directorio:**
   - En la configuración del servicio, busca **"Branch"** o **"Source"**
   - Cambia la rama de `main` a `release/v1.0.0`
   - Configura el **Root Directory** como `backend`
5. En **Variables**, agrega:
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

